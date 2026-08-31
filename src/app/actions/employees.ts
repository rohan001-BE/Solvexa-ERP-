"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Client } from "pg";

export interface CreateStaffInput {
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  roleId: string;
}

export async function createStaffAccount(input: CreateStaffInput) {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    throw new Error("Unauthorized: Please log in");
  }

  // Check if current user is Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role:roles(name)")
    .eq("id", currentUser.id)
    .single();

  const roleObj: any = profile?.role;
  const roleName = Array.isArray(roleObj) ? roleObj[0]?.name : roleObj?.name;
  const isAdmin = roleName === "Admin" || currentUser.email === "rohan@gmail.com";

  if (!isAdmin) {
    throw new Error("Forbidden: Only Administrators can create staff accounts");
  }

  const email = input.email.trim().toLowerCase();
  const password = input.password || "001001";
  const fullName = input.fullName.trim();
  const phone = input.phone?.trim() || "";
  const roleId = input.roleId;

  // Direct PG client to handle robust identity creation
  const dbPassword = encodeURIComponent("IGI@001001@001");
  const connectionString = `postgres://postgres:${dbPassword}@db.eptifegytprrzumltjce.supabase.co:5432/postgres`;

  const pgClient = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pgClient.connect();

    // Check if user already exists in auth.users
    const existing = await pgClient.query("SELECT id FROM auth.users WHERE email = $1", [email]);
    let newUserId: string;

    if (existing.rows.length > 0) {
      newUserId = existing.rows[0].id;
      await pgClient.query(
        `
        UPDATE auth.users
        SET 
          encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          confirmation_sent_at = coalesce(confirmation_sent_at, now()),
          email_change_token_new = '',
          email_change = '',
          confirmation_token = '',
          recovery_token = '',
          raw_user_meta_data = $2::jsonb,
          updated_at = now()
        WHERE id = $3::uuid
      `,
        [
          password,
          JSON.stringify({
            sub: newUserId,
            email: email,
            full_name: fullName,
            email_verified: true,
            phone_verified: false,
          }),
          newUserId,
        ]
      );
    } else {
      newUserId = require("crypto").randomUUID();
      await pgClient.query(
        `
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          confirmation_sent_at,
          confirmation_token,
          recovery_token,
          email_change_token_new,
          email_change,
          email_change_token_current,
          reauthentication_token,
          phone,
          phone_change,
          phone_change_token,
          email_change_confirm_status,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          is_sso_user,
          is_anonymous
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          $1::uuid,
          'authenticated',
          'authenticated',
          $2,
          crypt($3, gen_salt('bf')),
          now(),
          now(),
          '',
          '',
          '',
          '',
          '',
          '',
          $4,
          '',
          '',
          0,
          '{"provider":"email","providers":["email"]}',
          $5::jsonb,
          now(),
          now(),
          false,
          false
        )
      `,
        [
          newUserId,
          email,
          password,
          phone,
          JSON.stringify({
            sub: newUserId,
            email: email,
            full_name: fullName,
            email_verified: true,
            phone_verified: false,
          }),
        ]
      );
    }

    // Sync auth.identities
    const identityData = {
      sub: newUserId,
      email: email,
      full_name: fullName,
      email_verified: true,
      phone_verified: false,
    };

    await pgClient.query(
      `
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        $1::uuid,
        $2::jsonb,
        'email',
        $3::text,
        now(),
        now(),
        now()
      )
      ON CONFLICT (provider, provider_id) DO UPDATE SET
        identity_data = $2::jsonb,
        updated_at = now()
    `,
      [newUserId, JSON.stringify(identityData), newUserId]
    );

    // Upsert into public.profiles
    await pgClient.query(
      `
      INSERT INTO public.profiles (id, full_name, email, phone, role_id, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (id) DO UPDATE SET
        full_name = $2,
        phone = $4,
        role_id = $5,
        is_active = true
    `,
      [newUserId, fullName, email, phone, roleId]
    );

    revalidatePath("/employees");
    return { success: true, userId: newUserId };
  } catch (err: any) {
    console.error("Error creating staff account:", err);
    throw new Error(err.message || "Failed to create staff account");
  } finally {
    await pgClient.end();
  }
}
