import { hasRole, isAdmin, isStudent, isTeacher } from '@/lib/auth/role-utils'

describe('role-utils', () => {
  it('valida roles individuales y múltiples', () => {
    expect(hasRole('administrador', 'administrador')).toBe(true)
    expect(hasRole('profesor', ['administrador', 'profesor'])).toBe(true)
    expect(hasRole('alumno', 'profesor')).toBe(false)
    expect(hasRole(null, 'alumno')).toBe(false)
  })

  it('evalúa helpers de rol', () => {
    expect(isAdmin('administrador')).toBe(true)
    expect(isTeacher('profesor')).toBe(true)
    expect(isStudent('alumno')).toBe(true)
    expect(isAdmin('profesor')).toBe(false)
  })
})
