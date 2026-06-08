import { render, screen, waitFor } from '@testing-library/react'
import TeacherStats from '@/components/dashboard/teacher-stats'

describe('TeacherStats', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('muestra indicador verde cuando cumple el mínimo legal', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({
        users: [
          { role: { name: 'profesor' }, is_active: true, contract_type: 'TC' },
          { role: { name: 'profesor' }, is_active: true, contract_type: 'TP' },
          { role: { name: 'alumno' }, is_active: true, contract_type: null },
        ],
      }),
    } as Response)

    render(<TeacherStats />)

    await waitFor(() => {
      expect(screen.getByText(/50.0%/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/total docentes activos: 2/i)).toBeInTheDocument()
  })

  it('retorna null si todavía no hay datos', () => {
    jest.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}) as Promise<Response>)

    const { container } = render(<TeacherStats />)

    expect(container).toBeEmptyDOMElement()
  })
})
