import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/auth/server-auth';
import { getAdminClient } from '@/utils/supabase/admin';

const allowedRoles = ['profesor', 'alumno'] as const;

function normalizeCreatePayload(payload: Record<string, unknown>) {
  const fullName = String(payload.full_name ?? '').trim();
  const email = String(payload.email ?? '').trim().toLowerCase();
  const password = String(payload.password ?? '');
  const role = String(payload.role ?? '') as (typeof allowedRoles)[number];
  const isActive = payload.is_active !== false;
  const contractType = payload.contract_type ? String(payload.contract_type) : null;
  const category = payload.category ? String(payload.category) : null;

  if (!fullName) {
    return { error: 'El nombre completo es obligatorio' };
  }

  if (!email || !email.includes('@')) {
    return { error: 'El correo electronico no es valido' };
  }

  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' };
  }

  if (!allowedRoles.includes(role)) {
    return { error: 'El rol seleccionado no es valido' };
  }

  return {
    data: {
      full_name: fullName,
      email,
      password,
      role,
      is_active: isActive,
      contract_type: contractType,
      category,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminAccess();
  if ('error' in auth) {
    return auth.error;
  }
  const adminClient = getAdminClient();

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '5')));
  const offset = (page - 1) * limit;

  const [{ data: users, error: usersError, count }, { data: roles, error: rolesError }] =
    await Promise.all([
      adminClient
        .from('user_profiles')
        .select(
          `
          id,
          email,
          full_name,
          role_id,
          is_active,
          contract_type,
          category,
          created_at,
          updated_at,
          role:roles(id, name, description)
        `, { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
      adminClient
        .from('roles')
        .select('id, name, description')
        .in('name', allowedRoles)
        .order('id', { ascending: true }),
    ]);

  if (usersError || rolesError) {
    return NextResponse.json(
      { error: usersError?.message ?? rolesError?.message ?? 'No se pudo cargar usuarios' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    users: users ?? [],
    roles: roles ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if ('error' in auth) {
    return auth.error;
  }
  const adminClient = getAdminClient();

  const payload = await request.json();
  const normalized = normalizeCreatePayload(payload);

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const { data: roleRecord, error: roleError } = await adminClient
    .from('roles')
    .select('id, name')
    .eq('name', normalized.data.role)
    .single();

  if (roleError || !roleRecord) {
    return NextResponse.json({ error: 'No se encontro el rol solicitado' }, { status: 400 });
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: normalized.data.email,
    password: normalized.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: normalized.data.full_name,
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? 'No se pudo crear el usuario en autenticacion' },
      { status: authError?.status ?? 500 }
    );
  }

  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email: normalized.data.email,
      full_name: normalized.data.full_name,
      role_id: roleRecord.id,
      is_active: normalized.data.is_active,
      contract_type: normalized.data.contract_type,
      category: normalized.data.category,
    })
    .select(
      `
      id,
      email,
      full_name,
      role_id,
      is_active,
      contract_type,
      category,
      created_at,
      updated_at,
      role:roles(id, name, description)
    `
    )
    .single();

  if (profileError) {
    try {
      await adminClient.auth.admin.deleteUser(authData.user.id);
    } catch (cleanupError) {
      console.error('Error cleaning up auth user after profile failure:', cleanupError);
    }

    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ user: profile }, { status: 201 });
}
