import { describe, expect, it } from 'vitest'
import { validateChatImage } from './imageUpload'

describe('validateChatImage', () => {
  it('accepts supported images', () => {
    expect(validateChatImage(new File(['image'], 'photo.png', { type: 'image/png' }))).toBeNull()
  })

  it('rejects non-image files', () => {
    expect(validateChatImage(new File(['notes'], 'notes.txt', { type: 'text/plain' }))).toContain('JPEG')
  })

  it('rejects images larger than 10 MB', () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.webp', { type: 'image/webp' })
    expect(validateChatImage(file)).toContain('10 MB')
  })
})
