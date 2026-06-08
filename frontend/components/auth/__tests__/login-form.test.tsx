import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'

const push = jest.fn()
const login = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}))

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    login,
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza los campos del formulario', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('envía credenciales válidas y navega al dashboard', async () => {
    login.mockResolvedValue(undefined)

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'admin@uc.edu' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'secreto123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin@uc.edu', 'secreto123')
    })
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('muestra el error cuando el login falla', async () => {
    login.mockRejectedValue(new Error('Credenciales inválidas'))

    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'admin@uc.edu' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'incorrecta' },
    })
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})
