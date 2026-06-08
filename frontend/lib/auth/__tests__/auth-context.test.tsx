import { act, render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/lib/auth/auth-context'

const getCurrentUser = jest.fn()
const getUserProfile = jest.fn()
const onAuthStateChanged = jest.fn()
const loginWithEmail = jest.fn()
const logout = jest.fn()
const signupWithEmail = jest.fn()
const unsubscribe = jest.fn()

jest.mock('@/lib/auth/auth', () => ({
  getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  getUserProfile: (...args: unknown[]) => getUserProfile(...args),
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChanged(...args),
  loginWithEmail: (...args: unknown[]) => loginWithEmail(...args),
  logout: (...args: unknown[]) => logout(...args),
  signupWithEmail: (...args: unknown[]) => signupWithEmail(...args),
}))

function Consumer() {
  const auth = useAuth()

  return (
    <div>
      <span>{auth.isLoading ? 'loading' : 'ready'}</span>
      <span>{auth.user?.email ?? 'sin-usuario'}</span>
      <span>{auth.userRole ?? 'sin-rol'}</span>
      <button onClick={() => auth.login('admin@uc.edu', '12345678')}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
      <button onClick={() => auth.signup('new@uc.edu', '12345678', 'Nuevo')}>signup</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    onAuthStateChanged.mockReturnValue({ unsubscribe })
  })

  it('carga el usuario inicial y expone el rol', async () => {
    getCurrentUser.mockResolvedValue({ id: 'u1' })
    getUserProfile.mockResolvedValue({
      id: 'u1',
      email: 'admin@uc.edu',
      role: { name: 'administrador' },
    })

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    expect(await screen.findByText('ready')).toBeInTheDocument()
    expect(screen.getByText('admin@uc.edu')).toBeInTheDocument()
    expect(screen.getByText('administrador')).toBeInTheDocument()
  })

  it('permite login y luego logout', async () => {
    getCurrentUser.mockResolvedValue(null)
    getUserProfile.mockResolvedValue({
      id: 'u2',
      email: 'admin@uc.edu',
      role: { name: 'administrador' },
    })
    loginWithEmail.mockResolvedValue({ user: { id: 'u2' } })
    logout.mockResolvedValue(undefined)

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await screen.findByText('ready')

    await act(async () => {
      screen.getByText('login').click()
    })

    await waitFor(() => {
      expect(screen.getByText('admin@uc.edu')).toBeInTheDocument()
    })

    await act(async () => {
      screen.getByText('logout').click()
    })

    await waitFor(() => {
      expect(screen.getByText('sin-usuario')).toBeInTheDocument()
    })
  })

  it('permite signup y suscribe cambios de auth', async () => {
    let authCallback: ((user: { id: string } | null) => void) | undefined

    getCurrentUser.mockResolvedValue(null)
    getUserProfile
      .mockResolvedValueOnce({
        id: 'u3',
        email: 'new@uc.edu',
        role: { name: 'alumno' },
      })
      .mockResolvedValueOnce({
        id: 'u4',
        email: 'listener@uc.edu',
        role: { name: 'profesor' },
      })
    signupWithEmail.mockResolvedValue({ user: { id: 'u3' } })
    onAuthStateChanged.mockImplementation((callback: (user: { id: string } | null) => void) => {
      authCallback = callback
      return { unsubscribe }
    })

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await screen.findByText('ready')

    await act(async () => {
      screen.getByText('signup').click()
    })

    await waitFor(() => {
      expect(screen.getByText('new@uc.edu')).toBeInTheDocument()
    })

    await act(async () => {
      authCallback?.({ id: 'u4' })
    })

    await waitFor(() => {
      expect(screen.getByText('listener@uc.edu')).toBeInTheDocument()
    })
  })
})
