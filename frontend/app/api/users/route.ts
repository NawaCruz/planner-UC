import { NextRequest, NextResponse } from 'next/server';
import {
  errorResponse,
  getAdminContext,
  getPagination,
  getPaginationPayload,
} from '../_shared/admin-mutations';

const allowedRoles = ['profesor', 'alumno'] as const;

function optionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue || null;
}

function requiredString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCreatePayload(payload: Record<string, unknown>) {
  const fullName = requiredString(payload.full_name);
  const email = requiredString(payload.email).toLowerCase();
  const password = typeof payload.password === 'string' ? payload.password : '';
  const role = requiredString(payload.role) as (typeof allowedRoles)[number];
  const isActive = payload.is_active !== false;
  const contractType = optionalString(payload.contract_type);
  const category = optionalString(payload.category);

  if (!fullName) {
    return { error: 'El nombre completo es obligatorio' };
  }

  if (!email.includes('@')) {
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
  const admin = await getAdminContext();
  if ('error' in admin) {
    return admin.error;
  }
  const { page, limit, offset } = getPagination(request, 5);

  const [{ data: users, error: usersError, count }, { data: roles, error: rolesError }] =
    await Promise.all([
      admin.adminClient
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
      admin.adminClient
        .from('roles')
        .select('id, name, description')
        .in('name', allowedRoles)
        .order('id', { ascending: true }),
    ]);

  if (usersError || rolesError) {
    return errorResponse(usersError?.message ?? rolesError?.message ?? 'No se pudo cargar usuarios');
  }

  return NextResponse.json({
    users: users ?? [],
    roles: roles ?? [],
    pagination: getPaginationPayload(page, limit, count ?? 0),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if ('error' in admin) {
    return admin.error;
  }

  const payload = await request.json();
  const normalized = normalizeCreatePayload(payload);

  if ('error' in normalized) {
    return errorResponse(normalized.error, 400);
  }

  const { data: roleRecord, error: roleError } = await admin.adminClient
    .from('roles')
    .select('id, name')
    .eq('name', normalized.data.role)
    .single();

  if (roleError || !roleRecord) {
    return errorResponse('No se encontro el rol solicitado', 400);
  }

  const { data: authData, error: authError } = await admin.adminClient.auth.admin.createUser({
    email: normalized.data.email,
    password: normalized.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: normalized.data.full_name,
    },
  });

  if (authError || !authData.user) {
    return errorResponse(
      authError?.message ?? 'No se pudo crear el usuario en autenticacion',
      authError?.status ?? 500
    );
  }

  const { data: profile, error: profileError } = await admin.adminClient
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
      await admin.adminClient.auth.admin.deleteUser(authData.user.id);
    } catch (cleanupError) {
      console.error('Error cleaning up auth user after profile failure:', cleanupError);
    }

    return errorResponse(profileError.message);
  }

  return NextResponse.json({ user: profile }, { status: 201 });
}
