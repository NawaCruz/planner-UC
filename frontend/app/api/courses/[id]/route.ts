import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/utils/supabase/admin';
import { requireAdminAccess } from '@/lib/auth/server-auth';
import { getMutationStatus, parsePositiveId } from '../../_shared/admin-mutations';
import { normalizeCoursePayload } from '../course-payload';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if ('error' in auth) {
    return auth.error;
  }
  const adminClient = getAdminClient();

  const { id } = await context.params;
  const courseId = parsePositiveId(id);
  if (!courseId) {
    return NextResponse.json({ error: 'ID de curso invalido' }, { status: 400 });
  }

  const payload = await request.json();
  const normalized = normalizeCoursePayload(payload);

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('courses')
    .update(normalized.data)
    .eq('id', courseId)
    .select('*')
    .single();

  if (error) {
    const status = getMutationStatus(error.code);
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ course: data });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if ('error' in auth) {
    return auth.error;
  }
  const adminClient = getAdminClient();

  const { id } = await context.params;
  const courseId = parsePositiveId(id);
  if (!courseId) {
    return NextResponse.json({ error: 'ID de curso invalido' }, { status: 400 });
  }

  const { error } = await adminClient.from('courses').delete().eq('id', courseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
