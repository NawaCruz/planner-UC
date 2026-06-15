import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAccess } from '@/lib/auth/server-auth';
import { getAdminClient } from '@/utils/supabase/admin';
import { getMutationStatus, parsePositiveId } from '../../_shared/admin-mutations';
import { normalizeRoomPayload } from '../room-payload';

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
  const roomId = parsePositiveId(id);
  if (!roomId) {
    return NextResponse.json({ error: 'ID de aula invalido' }, { status: 400 });
  }

  const payload = await request.json();
  const normalized = normalizeRoomPayload(payload);

  if ('error' in normalized) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const { data, error } = await adminClient
    .from('rooms')
    .update(normalized.data)
    .eq('id', roomId)
    .select('*')
    .single();

  if (error) {
    const status = getMutationStatus(error.code);
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ room: data });
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
  const roomId = parsePositiveId(id);
  if (!roomId) {
    return NextResponse.json({ error: 'ID de aula invalido' }, { status: 400 });
  }

  const { error } = await adminClient.from('rooms').delete().eq('id', roomId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
