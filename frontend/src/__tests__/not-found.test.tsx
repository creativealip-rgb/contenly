import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import NotFound from '@/app/not-found'

describe('NotFound page', () => {
  it('renders 404 heading and link', () => {
    render(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Halaman tidak ditemukan')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /kembali/i })).toHaveAttribute('href', '/')
  })
})
