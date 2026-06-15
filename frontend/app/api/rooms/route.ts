import { NextRequest, NextResponse } from 'next/server';
import {
  errorResponse,
  getAdminContext,
  getMutationStatus,
  getPagination,
  getPaginationPayload,
} from '../_shared/admin-mutations';
import { normalizeRoomPayload } from './room-payload';

export async function GET(request: NextRequest) {
  const admin = await getAdminContext();
  if ('error' in admin) {
    return admin.error;
  }
  const { page, limit, offset } = getPagination(request, 5);

  const { data, error, count } = await admin.adminClient
    .from('rooms')
    .select('*', { count: 'exact' })
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return errorResponse(error.message);
  }

  return NextResponse.json({
    rooms: data ?? [],
    pagination: getPaginationPayload(page, limit, count ?? 0),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if ('error' in admin) {
    return admin.error;
  }

  const payload = await request.json();
  const normalized = normalizeRoomPayload(payload);

  if ('error' in normalized) {
    return errorResponse(normalized.error, 400);
  }

  const { data, error } = await admin.adminClient
    .from('rooms')
    .insert(normalized.data)
    .select('*')
    .single();

  if (error) {
    return errorResponse(error.message, getMutationStatus(error.code));
  }

  return NextResponse.json({ room: data }, { status: 201 });
}
