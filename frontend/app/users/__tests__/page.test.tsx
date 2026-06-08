import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import UsersPage from '@/app/users/page'
import { resetCourseFixtures } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/lib/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'admin-1' },
  }),
}))

describe('UsersPage', () => {
  beforeEach(() => {
    resetCourseFixtures()
  })

  it('muestra usuarios cargados desde la API', async () => {
    render(<UsersPage />)

    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByText('admin@uc.edu')).toBeInTheDocument()
  })

  it('muestra error si no se pueden cargar usuarios', async () => {
    server.use(
      rest.get('*/api/users', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'No se pudo cargar usuarios' })),
      ),
    )

    render(<UsersPage />)

    expect(await screen.findByText('No se pudo cargar usuarios')).toBeInTheDocument()
  })

  it('crea un profesor nuevo', async () => {
    render(<UsersPage />)

    await screen.findByText('Ana Torres')

    fireEvent.change(screen.getByLabelText(/nombre completo/i), {
      target: { value: 'Mario Flores' },
    })
    fireEvent.change(screen.getByLabelText(/correo electronico/i), {
      target: { value: 'mario@uc.edu' },
    })
    fireEvent.change(screen.getByLabelText(/contraseña inicial/i), {
      target: { value: 'secreto123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /agregar usuario/i }))

    expect(await screen.findByText(/usuario creado correctamente/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Mario Flores')).toBeInTheDocument()
    })
  })
})
