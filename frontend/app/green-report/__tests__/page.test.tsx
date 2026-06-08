import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import GreenReportPage from '@/app/green-report/page'

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('GreenReportPage', () => {
  it('muestra por defecto la vista optimizada', () => {
    render(<GreenReportPage />)

    expect(screen.getByText(/métricas con green software/i)).toBeInTheDocument()
    expect(screen.getByText(/reducción -86%/i)).toBeInTheDocument()
  })

  it('permite cambiar a la vista antes', () => {
    render(<GreenReportPage />)

    fireEvent.click(screen.getByRole('button', { name: /antes/i }))

    expect(screen.getByText(/métricas sin optimizaciones/i)).toBeInTheDocument()
    expect(screen.getByText(/oportunidades de optimización detectadas/i)).toBeInTheDocument()
  })
})
