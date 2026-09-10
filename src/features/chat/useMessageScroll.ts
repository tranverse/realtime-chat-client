import { useCallback, useEffect, useRef, useState } from 'react'

const BOTTOM_THRESHOLD_PX = 96

export function preservedScrollTop(
  previousScrollHeight: number,
  nextScrollHeight: number,
  previousScrollTop: number,
) {
  return nextScrollHeight - previousScrollHeight + previousScrollTop
}

export function useMessageScroll(newestMessageId: string | undefined, newestMessageIsMine: boolean) {
  const historyRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const nearBottomRef = useRef(true)
  const previousNewestIdRef = useRef<string | undefined>(undefined)
  const [unseenMessages, setUnseenMessages] = useState(0)
  const [isNearBottom, setIsNearBottom] = useState(true)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
    nearBottomRef.current = true
    setIsNearBottom(true)
    setUnseenMessages(0)
  }, [])

  const handleScroll = useCallback(() => {
    const element = historyRef.current
    if (!element) return
    nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight <= BOTTOM_THRESHOLD_PX
    setIsNearBottom(nearBottomRef.current)
    if (nearBottomRef.current) setUnseenMessages(0)
  }, [])

  const loadOlderPreservingPosition = useCallback(async (load: () => Promise<unknown>) => {
    const element = historyRef.current
    if (!element) {
      await load()
      return
    }
    const previousScrollHeight = element.scrollHeight
    const previousScrollTop = element.scrollTop
    await load()
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      element.scrollTop = preservedScrollTop(
        previousScrollHeight,
        element.scrollHeight,
        previousScrollTop,
      )
    }))
  }, [])

  useEffect(() => {
    if (!newestMessageId || previousNewestIdRef.current === newestMessageId) return
    const isInitialMessage = previousNewestIdRef.current === undefined
    previousNewestIdRef.current = newestMessageId
    if (isInitialMessage || nearBottomRef.current || newestMessageIsMine) {
      scrollToBottom(isInitialMessage ? 'auto' : 'smooth')
    } else {
      setUnseenMessages((current) => current + 1)
    }
  }, [newestMessageId, newestMessageIsMine, scrollToBottom])

  return {
    historyRef,
    bottomRef,
    unseenMessages,
    isNearBottom,
    handleScroll,
    scrollToBottom,
    loadOlderPreservingPosition,
  }
}
