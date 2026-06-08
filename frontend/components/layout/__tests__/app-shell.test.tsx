import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/app-shell'

const push = jest.fn()
const logout = jest.fn()
const usePathname = jest.fn()
const useAuth = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ push }),
}))

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => useAuth(),
}))

describe('AppShell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    usePathname.mockReturnValue('/dashboard')
  })

  function renderShell(children: ReactNode = <div>Contenido</div>) {
    return render(<AppShell>{children}</AppShell>)
  }

  it('muestra navegación administrativa completa para administradores', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Admin UC', email: 'admin@uc.edu' },
      userRole: 'administrador',
      logout,
    })

    renderShell()

    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Aulas')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('oculta módulos administrativos para usuarios no administradores', () => {
    useAuth.mockReturnValue({
      user: { full_name: 'Alumno UC', email: 'alumno@uc.edu' },
      userRole: 'alumno',
      logout,
    })

    renderShell()

    expect(screen.queryByText('Cursos')).not.toBeInTheDocument()
    expect(screen.queryByText('Aulas')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.getByText('Schedule Generator')).toBeInTheDocument()
  })

  it('ejecuta logout y redirige al login', async () => {
    logout.mockResolvedValue(undefined)
    useAuth.mockReturnValue({
      user: { full_name: 'Admin UC', email: 'admin@uc.edu' },
      userRole: 'administrador',
      logout,
    })

    renderShell()

    fireEvent.click(screen.getByRole('button', { name: /cerrar sesion/i }))

    expect(logout).toHaveBeenCalled()
  })
})
