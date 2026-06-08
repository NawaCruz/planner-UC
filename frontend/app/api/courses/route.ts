import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/utils/supabase/admin';
import { requireAdminAccess } from '@/lib/auth/server-auth';
import { CourseInput, CourseKind } from '@/types/course';

function normalizeCoursePayload(payload: Partial<CourseInput>) {
  const code = payload.code?.trim().toUpperCase();
  const name = payload.name?.trim();
  const description = payload.description?.trim() ?? '';
  const cycle = Number(payload.cycle);
  const blocksPerWeek = Number(payload.blocks_per_week);
  const maxSections = Number(payload.max_sections);
  const kind = payload.kind;

  if (!code || !name) {
    return { error: 'Codigo y nombre son obligatorios' };
  }

  if (!Number.isInteger(cycle) || cycle < 1 || cycle > 12) {
    return { error: 'El ciclo debe ser un entero entre 1 y 12' };
  }

  if (!Number.isInteger(blocksPerWeek) || blocksPerWeek < 1 || blocksPerWeek > 3) {
    return { error: 'Los bloques por semana deben estar entre 1 y 3' };
  }

  if (!Number.isInteger(maxSections) || maxSections < 1 || maxSections > 20) {
    return { error: 'El maximo de secciones debe estar entre 1 y 20' };
  }

  if (kind !== 'general' && kind !== 'carrera') {
    return { error: 'El tipo de curso no es valido' };
  }

  return {
    data: {
      code,
      name,
      cycle,
      blocks_per_week: blocksPerWeek,
      max_sections: maxSections,
      kind: kind as CourseKind,
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
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '10')));
  const offset = (page - 1) * limit;

  // Get total count
  const { count, error: countError } = await adminClient
    .from('courses')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Get paginated data
  const { data, error } = await adminClient
    .from('courses')
    .select('*')
    .order('cycle', { ascending: true })
    .order('code', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return NextResponse.json({
    courses: data ?? [],
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminAccess();
  if ('error' in auth) {
    return auth.error;
  }
  const adminClient = getAdminClient();

  const payload = await request.json();
  const normalized = normalizeCoursePayload(payload);

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('courses')
    .insert(normalized.data)
    .select('*')
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ course: data }, { status: 201 });
}
