const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function validateChatImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Choose a JPEG, PNG, WebP, or GIF image.'
  if (file.size > MAX_IMAGE_BYTES) return 'Choose an image smaller than 10 MB.'
  return null
}
