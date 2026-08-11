import { useState, useCallback, useEffect } from 'react'

// Measures a DOM element's width and keeps it updated on resize, via
// ResizeObserver rather than Recharts' own <ResponsiveContainer> (which
// renders at zero width with this React/Recharts version combo — see
// History.jsx). Pass the returned `ref` to the element to measure; `width`
// starts at `fallback` until the element actually exists and is measured.
//
// Uses a callback ref (not useRef + useLayoutEffect-on-mount) because the
// measured element is often conditionally rendered — it may not exist yet on
// the component's first render, and a plain ref set up once on mount would
// silently miss it. A callback ref re-fires every time React attaches it to
// a new DOM node, including the first time that node actually appears.
export function useElementWidth(fallback) {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(fallback)

  const ref = useCallback((el) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (!node) return

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(node)
    setWidth(node.getBoundingClientRect().width)

    return () => observer.disconnect()
  }, [node])

  return [ref, width]
}
