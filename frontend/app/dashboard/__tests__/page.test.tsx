/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'

const useAuth = jest.fn()

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => <img alt={String(props.alt)} />,
}))

jest.mock('next/dynamic', () => () => {
  return function MockTeacherStats() {
    return <div>Teacher stats mock</div>
  }
})

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => useAuth(),
}))

describe('DashboardPage', () => {
  it('renderiza la vista de administrador con stats', () => {
    useAuth.mockReturnValue({
      user: {
        full_name: 'Admin UC',
        email: 'admin@uc.edu',
        is_active: true,
        created_at: '2026-06-01T10:00:00.000Z',
      },
      userRole: 'administrador',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/bienvenido, admin uc/i)).toBeInTheDocument()
    expect(screen.getByText(/funciones de administrador/i)).toBeInTheDocument()
    expect(screen.getByText('Teacher stats mock')).toBeInTheDocument()
  })

  it('renderiza la vista de profesor', () => {
    useAuth.mockReturnValue({
      user: {
        full_name: 'Ana Torres',
        email: 'profe@uc.edu',
        is_active: true,
        created_at: '2026-06-01T10:00:00.000Z',
      },
      userRole: 'profesor',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/funciones de profesor/i)).toBeInTheDocument()
  })

  it('renderiza la vista de alumno inactivo', () => {
    useAuth.mockReturnValue({
      user: {
        full_name: 'Luis Perez',
        email: 'alumno@uc.edu',
        is_active: false,
        created_at: '2026-06-01T10:00:00.000Z',
      },
      userRole: 'alumno',
    })

    render(<DashboardPage />)

    expect(screen.getByText(/funciones de alumno/i)).toBeInTheDocument()
    expect(screen.getByText(/inactivo/i)).toBeInTheDocument()
  })
})
