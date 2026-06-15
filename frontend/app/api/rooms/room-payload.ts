import type { RoomInput } from '@/types/room';

export function normalizeRoomPayload(payload: Partial<RoomInput>) {
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
