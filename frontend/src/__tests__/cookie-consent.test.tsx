import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { CookieConsent } from '@/components/cookie-consent'

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows banner when no consent stored', () => {
    render(<CookieConsent />)
    expect(screen.getByText(/cookies/i)).toBeInTheDocument()
  })

  it('hides banner after accepting', () => {
    render(<CookieConsent />)
    fireEvent.click(screen.getByText('Terima'))
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument()
    expect(localStorage.getItem('cookie-consent')).toBe('accepted')
  })

  it('does not show if already accepted', () => {
    localStorage.setItem('cookie-consent', 'accepted')
    render(<CookieConsent />)
    expect(screen.queryByText(/cookies/i)).not.toBeInTheDocument()
  })
})
