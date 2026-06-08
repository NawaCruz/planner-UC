import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import RoomsPage from '@/app/rooms/page'
import { resetCourseFixtures } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('RoomsPage', () => {
  beforeEach(() => {
    resetCourseFixtures()
  })

  it('muestra aulas cargadas desde la API', async () => {
    render(<RoomsPage />)

    expect(await screen.findByText('Aula 101')).toBeInTheDocument()
    expect(screen.getByText('Lab 201')).toBeInTheDocument()
  })

  it('muestra estado vacío si no hay aulas', async () => {
    server.use(
      rest.get('*/api/rooms', (_req, res, ctx) =>
        res(
          ctx.json({
            rooms: [],
            pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
          }),
        ),
      ),
    )

    render(<RoomsPage />)

    expect(await screen.findByText(/todavia no hay aulas registradas/i)).toBeInTheDocument()
  })

  it('crea un aula y actualiza la lista', async () => {
    render(<RoomsPage />)

    await screen.findByText('Aula 101')

    fireEvent.change(screen.getByLabelText(/nombre del aula/i), {
      target: { value: 'Aula 303' },
    })
    fireEvent.change(screen.getByLabelText(/ubicacion/i), {
      target: { value: 'Pabellon C' },
    })
    fireEvent.click(screen.getByRole('button', { name: /agregar aula/i }))

    expect(await screen.findByText(/aula creada correctamente/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Aula 303')).toBeInTheDocument()
    })
  })
})
