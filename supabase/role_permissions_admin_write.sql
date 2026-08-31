-- Run this in the Supabase SQL editor to apply permission-matrix + staff creation support.

drop policy if exists role_permissions_admin_write on role_permissions;
create policy role_permissions_admin_write on role_permissions
  for all using (is_admin())
  with check (is_admin());

create or replace function public.create_staff_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_phone text,
  p_role_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
begin
  if not is_admin() then
    raise exception 'Only Administrators can create staff accounts';
  end if;

  if p_email is null or length(trim(p_email)) = 0 then
    raise exception 'Email is required';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if not exists (select 1 from public.roles where id = p_role_id) then
    raise exception 'Invalid role';
  end if;

  v_user_id := gen_random_uuid();

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'phone', coalesce(p_phone, '')),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', lower(trim(p_email))),
    'email',
    v_user_id::text,
    now(), now(), now()
  );

  update public.profiles
  set
    full_name = coalesce(nullif(trim(p_full_name), ''), full_name),
    phone = nullif(trim(p_phone), ''),
    role_id = p_role_id,
    is_active = true,
    updated_at = now()
  where id = v_user_id;

  return v_user_id;
end;
$$;

grant execute on function public.create_staff_user(text, text, text, text, uuid) to authenticated;
