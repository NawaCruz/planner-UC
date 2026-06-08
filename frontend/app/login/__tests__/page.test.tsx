import { render, screen, waitFor } from '@testing-library/react'
import LoginPage from '@/app/login/page'

const push = jest.fn()
const useAuth = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => useAuth(),
}))

jest.mock('@/components/auth/login-form', () => ({
  LoginForm: () => <div>Login form mock</div>,
}))

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza el contenido de login', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    render(<LoginPage />)

    expect(screen.getByText('Planner UC')).toBeInTheDocument()
    expect(screen.getByText('Login form mock')).toBeInTheDocument()
    expect(screen.getByText(/credenciales de demostración/i)).toBeInTheDocument()
  })

  it('redirige al dashboard si ya hay sesión', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    })

    render(<LoginPage />)

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/dashboard')
    })
  })
})
