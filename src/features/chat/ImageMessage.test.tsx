import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ImageMessage } from './ImageMessage'

const images = [1, 2, 3].map((index) => ({
  id: `image-${index}`,
  fileUrl: `https://res.cloudinary.com/demo/image/upload/photo-${index}.jpg`,
  fileType: 'image/jpeg',
  fileSize: 100,
}))

describe('ImageMessage', () => {
  it('renders every image in a compact group and opens the viewer', () => {
    render(<ImageMessage attachments={images} />)
    const buttons = screen.getAllByRole('button', { name: 'Open shared image' })
    expect(buttons).toHaveLength(3)

    fireEvent.load(screen.getAllByRole('img')[0])
    fireEvent.click(buttons[0])
    expect(screen.getByRole('dialog', { name: 'Image viewer' })).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a graceful error state for broken images', () => {
    const view = render(<ImageMessage attachments={[images[0]]} />)
    fireEvent.error(within(view.container).getByRole('img'))
    expect(screen.getByText('Image unavailable')).toBeVisible()
  })
})
