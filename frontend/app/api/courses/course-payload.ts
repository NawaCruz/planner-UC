import type { CourseInput } from '@/types/course';

export function normalizeCoursePayload(payload: Partial<CourseInput>) {
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
      kind,
      description: description || null,
      is_active: payload.is_active ?? true,
    },
  };
}
