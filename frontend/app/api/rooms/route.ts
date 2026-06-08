import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/auth/server-auth';
import { getAdminClient } from '@/utils/supabase/admin';
import { RoomInput } from '@/types/room';

function normalizeRoomPayload(payload: Partial<RoomInput>) {
  const name = payload.name?.trim();
  const location = payload.location?.trim() ?? '';
  const description = payload.description?.trim() ?? '';
  const capacity = Number(payload.capacity);
  const authorized_capacity = payload.authorized_capacity ? Number(payload.authorized_capacity) : null;
  const room_type = payload.room_type?.trim() || null;

  if (!name) {
    return { error: 'El nombre del aula es obligatorio' };
  }

  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 1000) {
    return { error: 'El aforo debe ser un entero entre 1 y 1000' };
  }

  return {
    data: {
      name,
      location: location || null,
      capacity,
      authorized_capacity,
      room_type,
      description: description || null,
      is_active: payload.is_active ?? true,
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

  const { data, error, count } = await adminClient
    .from('rooms')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    rooms: data ?? [],
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
  const normalized = normalizeRoomPayload(payload);

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('rooms')
    .insert(normalized.data)
    .select('*')
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ room: data }, { status: 201 });
}
