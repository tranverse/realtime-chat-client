import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandMark } from './BrandMark'

describe('BrandMark', () => {
  it('shows the product name unless compact', () => {
    const { rerender } = render(<BrandMark />)
    expect(screen.getByText('luma')).toBeInTheDocument()

    rerender(<BrandMark compact />)
    expect(screen.queryByText('luma')).not.toBeInTheDocument()
  })
})
