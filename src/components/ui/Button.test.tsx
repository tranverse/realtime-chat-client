import { render, screen } from '@testing-library/react'
import { FiSend } from 'react-icons/fi'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders an icon while keeping its text as the accessible name', () => {
    render(<Button size="icon">Send message<FiSend data-testid="send-icon" /></Button>)

    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    expect(screen.getByTestId('send-icon')).toBeVisible()
  })
})
