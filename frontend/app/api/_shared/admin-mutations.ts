import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/auth/server-auth';
import { getAdminClient } from '@/utils/supabase/admin';

export async function getAdminContext() {
  const auth = await requireAdminAccess();
  if ('error' in auth) {
    return { error: auth.error };
  }

  return { adminClient: getAdminClient() };
}

export function getPagination(request: NextRequest, defaultLimit: number) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? String(defaultLimit))));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

export function errorResponse(message: string | undefined, status = 500) {
  return NextResponse.json({ error: message ?? 'Error inesperado' }, { status });
}

export function getPaginationPayload(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export function getMutationStatus(code: string) {
  if (code === 'PGRST116') {
    return 404;
  }

  return code === '23505' ? 409 : 500;
}

export function parsePositiveId(idParam: string) {
  const id = Number(idParam);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}
