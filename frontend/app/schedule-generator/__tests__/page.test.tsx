import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ScheduleGeneratorPage from '@/app/schedule-generator/page'

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const schedulePayload = {
  success: true,
  career_name: 'Ingenieria de Sistemas',
  time_slots: ['Lun 07:00-08:30', 'Mar 07:00-08:30'],
  students_count: 120,
  summary: {
    opened_courses: 2,
    total_courses: 5,
    opened_sections: 2,
    total_demand: 150,
    uncovered_demand: 10,
    excess_capacity: 5,
  },
  sections: [
    {
      course_code: 'CS101',
      course_name: 'Programacion I',
      section: 1,
      label: 'CS101 - Seccion 1',
      cycle: 1,
      kind: 'carrera',
      room: 'Aula 101',
      room_capacity: 40,
      blocks_per_week: 1,
      time_slots: ['Lun 07:00-08:30'],
    },
    {
      course_code: 'MAT201',
      course_name: 'Matematica Discreta',
      section: 1,
      label: 'MAT201 - Seccion 1',
      cycle: 2,
      kind: 'general',
      room: 'Aula 102',
      room_capacity: 35,
      blocks_per_week: 1,
      time_slots: ['Mar 07:00-08:30'],
    },
  ],
  course_capacity_summary: [
    {
      course_code: 'CS101',
      course_name: 'Programacion I',
      demand: 80,
      opened_sections: 1,
      opened_capacity: 40,
      uncovered_demand: 40,
      excess_capacity: 0,
    },
    {
      course_code: 'MAT201',
      course_name: 'Matematica Discreta',
      demand: 70,
      opened_sections: 1,
      opened_capacity: 35,
      uncovered_demand: 35,
      excess_capacity: 0,
    },
  ],
}

describe('ScheduleGeneratorPage', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('muestra el horario cuando el backend responde correctamente', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => schedulePayload,
    } as Response)

    render(<ScheduleGeneratorPage />)

    expect(await screen.findByText(/ingenieria de sistemas/i)).toBeInTheDocument()
    expect(screen.getAllByText('Programacion I').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Matematica Discreta').length).toBeGreaterThan(0)

    const courseFilter = screen.getByRole('combobox')

    fireEvent.change(courseFilter, {
      target: { value: 'CS101' },
    })

    await waitFor(() => {
      expect(courseFilter).toHaveValue('CS101')
    })
  })

  it('muestra error cuando el backend falla', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(<ScheduleGeneratorPage />)

    expect(await screen.findByText(/no se pudo cargar el horario/i)).toBeInTheDocument()
    expect(screen.getByText(/la api respondio con 500/i)).toBeInTheDocument()
  })
})
