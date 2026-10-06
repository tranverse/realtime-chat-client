import { render, screen } from '@testing-library/react'
import { Send } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders an icon while keeping its text as the accessible name', () => {
    render(<Button size="icon">Send message<Send data-testid="send-icon" /></Button>)

    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument()
    expect(screen.getByTestId('send-icon')).toBeVisible()
  })
})
