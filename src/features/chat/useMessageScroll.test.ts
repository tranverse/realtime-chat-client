import { describe, expect, it } from 'vitest'
import { preservedScrollTop } from './useMessageScroll'

describe('preservedScrollTop', () => {
  it('keeps the same visible content after older messages are prepended', () => {
    expect(preservedScrollTop(1_000, 1_600, 250)).toBe(850)
  })
})
