import type { ReactNode } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import GreenReportPage from '@/app/green-report/page'

jest.mock('@/components/layout/app-shell', () => ({
  AppShell: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

describe('GreenReportPage', () => {
  it('muestra por defecto la vista optimizada', () => {
    render(<GreenReportPage />)

    fireEvent.click(screen.getByRole('button', { name: /despu/i }))

    expect(screen.getByText('153')).toBeInTheDocument()
    expect(screen.getByText(/2\.1787 MB/i)).toBeInTheDocument()
  })

  it('permite cambiar a la vista antes', () => {
    render(<GreenReportPage />)

    fireEvent.click(screen.getByRole('button', { name: /antes/i }))

    expect(screen.getByText('485')).toBeInTheDocument()
    expect(screen.getByText(/15\.5435 MB/i)).toBeInTheDocument()
  })
})
