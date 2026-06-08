import { render, screen, waitFor } from '@testing-library/react'
import { ProtectedRoute } from '@/components/auth/protected-route'

const push = jest.fn()
const useAuth = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}))

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => useAuth(),
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('muestra un loader mientras la autenticación está cargando', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      userRole: null,
      isLoading: true,
    })

    const { container } = render(
      <ProtectedRoute>
        <div>Contenido privado</div>
      </ProtectedRoute>,
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('redirige al login cuando el usuario no está autenticado', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      userRole: null,
      isLoading: false,
    })

    render(
      <ProtectedRoute>
        <div>Contenido privado</div>
      </ProtectedRoute>,
    )

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login')
    })
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('muestra acceso denegado cuando el rol no coincide', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      userRole: 'alumno',
      isLoading: false,
    })

    render(
      <ProtectedRoute requiredRole="administrador">
        <div>Contenido privado</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument()
    expect(
      screen.getByText(/no tienes permisos para acceder a esta página/i),
    ).toBeInTheDocument()
  })

  it('renderiza el contenido cuando el usuario está autenticado y autorizado', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      userRole: 'administrador',
      isLoading: false,
    })

    render(
      <ProtectedRoute requiredRole="administrador">
        <div>Contenido privado</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})
