import { useEffect, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiImage, FiX } from 'react-icons/fi'
import type { Attachment } from '@/types/api'

export function ImageMessage({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter((attachment) => attachment.fileType.startsWith('image/'))
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const visible = images.slice(0, 4)

  useEffect(() => {
    if (activeIndex === null) return
    function keyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveIndex(null)
      if (event.key === 'ArrowLeft') setActiveIndex((current) => current === null ? null : (current - 1 + images.length) % images.length)
      if (event.key === 'ArrowRight') setActiveIndex((current) => current === null ? null : (current + 1) % images.length)
    }
    document.addEventListener('keydown', keyDown)
    return () => document.removeEventListener('keydown', keyDown)
  }, [activeIndex, images.length])

  if (images.length === 0) return null
  return <>
    <div className={`image-grid image-grid--${Math.min(images.length, 4)}`}>
      {visible.map((image, index) => <ImageTile key={image.id ?? image.fileUrl} image={image} onClick={() => setActiveIndex(index)} overlay={index === 3 && images.length > 4 ? `+${images.length - 4}` : undefined} />)}
    </div>
    {activeIndex !== null && <div className="image-viewer" role="dialog" aria-modal="true" aria-label="Image viewer" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveIndex(null) }}>
      <button type="button" className="image-viewer__close" aria-label="Close image viewer" title="Close" onClick={() => setActiveIndex(null)}><FiX /></button>
      {images.length > 1 && <button type="button" className="image-viewer__previous" aria-label="Previous image" title="Previous image" onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}><FiChevronLeft /></button>}
      <img src={images[activeIndex].fileUrl} alt={`Shared image ${activeIndex + 1} of ${images.length}`} />
      {images.length > 1 && <><span className="image-viewer__count">{activeIndex + 1} / {images.length}</span><button type="button" className="image-viewer__next" aria-label="Next image" title="Next image" onClick={() => setActiveIndex((activeIndex + 1) % images.length)}><FiChevronRight /></button></>}
    </div>}
  </>
}

function ImageTile({ image, overlay, onClick }: { image: Attachment; overlay?: string; onClick: () => void }) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading')
  return <button type="button" className={`image-tile is-${state}`} aria-label="Open shared image" onClick={onClick} disabled={state === 'error'}>
    {state === 'loading' && <span className="image-tile__loading" />}
    {state === 'error' && <span className="image-tile__error"><FiImage /><small>Image unavailable</small></span>}
    <img src={image.fileUrl} alt="Shared attachment" onLoad={() => setState('loaded')} onError={() => setState('error')} />
    {overlay && <span className="image-tile__overlay">{overlay}</span>}
  </button>
}
