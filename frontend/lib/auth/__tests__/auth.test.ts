const createClient = jest.fn()

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => createClient(),
}))

describe('auth service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('loginWithEmail devuelve usuario, perfil y sesión', async () => {
    const signInWithPassword = jest.fn().mockResolvedValue({
      data: { user: { id: 'u1' }, session: { access_token: 'x' } },
      error: null,
    })
    const maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'u1', email: 'admin@uc.edu', role: { name: 'administrador' } },
      error: null,
    })
    const eq = jest.fn(() => ({ maybeSingle }))
    const select = jest.fn(() => ({ eq }))
    const from = jest.fn(() => ({ select }))

    createClient.mockReturnValue({
      auth: { signInWithPassword },
      from,
    })

    const { loginWithEmail } = await import('@/lib/auth/auth')
    const result = await loginWithEmail('admin@uc.edu', '12345678')

    expect(signInWithPassword).toHaveBeenCalled()
    expect(result.user.id).toBe('u1')
    expect(result.profile?.email).toBe('admin@uc.edu')
  })

  it('signupWithEmail crea usuario y perfil', async () => {
    const signUp = jest.fn().mockResolvedValue({
      data: { user: { id: 'u2' }, session: null },
      error: null,
    })
    const insert = jest.fn().mockResolvedValue({ error: null })
    const from = jest.fn(() => ({ insert }))

    createClient.mockReturnValue({
      auth: { signUp },
      from,
    })

    const { signupWithEmail } = await import('@/lib/auth/auth')
    const result = await signupWithEmail('new@uc.edu', '12345678', 'Nuevo')

    expect(signUp).toHaveBeenCalled()
    expect(insert).toHaveBeenCalled()
    expect(result.user?.id).toBe('u2')
  })

  it('getCurrentUser retorna null si no hay sesión', async () => {
    const getSession = jest.fn().mockResolvedValue({
      data: { session: null },
    })

    createClient.mockReturnValue({
      auth: { getSession },
    })

    const { getCurrentUser } = await import('@/lib/auth/auth')
    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('getUserRole obtiene el nombre del rol', async () => {
    const single = jest.fn().mockResolvedValue({
      data: { role: [{ name: 'profesor' }] },
      error: null,
    })
    const eq = jest.fn(() => ({ single }))
    const select = jest.fn(() => ({ eq }))
    const from = jest.fn(() => ({ select }))

    createClient.mockReturnValue({
      from,
    })

    const { getUserRole } = await import('@/lib/auth/auth')
    await expect(getUserRole('u3')).resolves.toBe('profesor')
  })

  it('changePassword usa updateUser', async () => {
    const updateUser = jest.fn().mockResolvedValue({ error: null })

    createClient.mockReturnValue({
      auth: { updateUser },
    })

    const { changePassword } = await import('@/lib/auth/auth')
    await changePassword('nueva123')

    expect(updateUser).toHaveBeenCalledWith({ password: 'nueva123' })
  })

  it('onAuthStateChanged reenvía el usuario al callback', async () => {
    const onAuthStateChange = jest.fn((_handler) => {
      _handler('SIGNED_IN', { user: { id: 'u9' } })
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    createClient.mockReturnValue({
      auth: { onAuthStateChange },
    })

    const { onAuthStateChanged } = await import('@/lib/auth/auth')
    const callback = jest.fn()
    onAuthStateChanged(callback)

    expect(callback).toHaveBeenCalledWith({ id: 'u9' })
  })
})
