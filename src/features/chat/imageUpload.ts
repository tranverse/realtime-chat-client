const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
export const MAX_IMAGES_PER_MESSAGE = 10

export function validateChatImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return 'Choose a JPEG, PNG, WebP, or GIF image.'
  if (file.size > MAX_IMAGE_BYTES) return 'Choose an image smaller than 10 MB.'
  return null
}

export function limitChatImages(files: File[]) {
  return { files: files.slice(0, MAX_IMAGES_PER_MESSAGE), omitted: Math.max(0, files.length - MAX_IMAGES_PER_MESSAGE) }
}
