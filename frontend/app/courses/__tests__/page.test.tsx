import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { rest } from 'msw'
import CoursesPage from '@/app/courses/page'
import { resetCourseFixtures } from '@/test/msw/handlers'
import { server } from '@/test/msw/server'

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('CoursesPage', () => {
  beforeEach(() => {
    resetCourseFixtures()
    jest.clearAllMocks()
  })

  it('carga y muestra cursos desde la API', async () => {
    render(<CoursesPage />)

    expect(screen.getByText(/cursos de universidad/i)).toBeInTheDocument()
    expect(await screen.findByText('Introduccion a la Programacion')).toBeInTheDocument()
    expect(screen.getByText('Matematica Discreta')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay cursos', async () => {
    server.use(
      rest.get('*/api/courses', (_req, res, ctx) =>
        res(
          ctx.json({
            courses: [],
            pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
          }),
        ),
      ),
    )

    render(<CoursesPage />)

    expect(
      await screen.findByText(/todavia no hay cursos registrados/i),
    ).toBeInTheDocument()
  })

  it('muestra un error cuando la API falla', async () => {
    server.use(
      rest.get('*/api/courses', (_req, res, ctx) =>
        res(ctx.status(500), ctx.json({ error: 'Fallo el servidor' })),
      ),
    )

    render(<CoursesPage />)

    expect(await screen.findByText('Fallo el servidor')).toBeInTheDocument()
  })

  it('crea un curso y refresca la lista', async () => {
    render(<CoursesPage />)

    await screen.findByText('Introduccion a la Programacion')

    fireEvent.change(screen.getByLabelText(/codigo/i), {
      target: { value: 'CS999' },
    })
    fireEvent.change(screen.getByLabelText(/^nombre$/i), {
      target: { value: 'Calidad de Software' },
    })
    fireEvent.change(screen.getByLabelText(/descripcion/i), {
      target: { value: 'Curso nuevo para testing.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /crear curso/i }))

    expect(await screen.findByText(/curso creado correctamente/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Calidad de Software')).toBeInTheDocument()
    })
    expect(screen.getByText('CS999')).toBeInTheDocument()
  })
})
