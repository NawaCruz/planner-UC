import { NextRequest, NextResponse } from 'next/server';
import {
  errorResponse,
  getAdminContext,
  getMutationStatus,
  getPagination,
  getPaginationPayload,
} from '../_shared/admin-mutations';
import { normalizeCoursePayload } from './course-payload';

export async function GET(request: NextRequest) {
  const admin = await getAdminContext();
  if ('error' in admin) {
    return admin.error;
  }
  const { page, limit, offset } = getPagination(request, 10);

  // Get total count
  const { count, error: countError } = await admin.adminClient
    .from('courses')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return errorResponse(countError.message);
  }

  // Get paginated data
  const { data, error } = await admin.adminClient
    .from('courses')
    .select('*')
    .order('cycle', { ascending: true })
    .order('code', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return errorResponse(error.message);
  }

  const total = count ?? 0;

  return NextResponse.json({
    courses: data ?? [],
    pagination: getPaginationPayload(page, limit, total),
  });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminContext();
  if ('error' in admin) {
    return admin.error;
  }

  const payload = await request.json();
  const normalized = normalizeCoursePayload(payload);

  if ('error' in normalized) {
    return errorResponse(normalized.error, 400);
  }

  const { data, error } = await admin.adminClient
    .from('courses')
    .insert(normalized.data)
    .select('*')
    .single();

  if (error) {
    return errorResponse(error.message, getMutationStatus(error.code));
  }

  return NextResponse.json({ course: data }, { status: 201 });
}
