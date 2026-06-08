import { render, waitFor } from '@testing-library/react'
import Page from '@/app/page'

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

describe('Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('redirige al login cuando no hay sesión', async () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    })

    render(<Page />)

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login')
    })
  })
})
