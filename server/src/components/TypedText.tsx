'use client'

import { useEffect, useState } from 'react'

type Props = {
  words: string[]
  typeSpeed?: number
  deleteSpeed?: number
  pause?: number
  loop?: boolean
  className?: string
  cursor?: boolean
}

export default function TypedText({
  words,
  typeSpeed = 45,
  deleteSpeed = 28,
  pause = 1100,
  loop = true,
  className,
  cursor = true,
}: Props) {
  const [wordIndex, setWordIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!words.length) return
    const current = words[wordIndex]

    if (!deleting && subIndex === current.length) {
      const t = setTimeout(() => setDeleting(true), pause)
      return () => clearTimeout(t)
    }

    if (deleting && subIndex === 0) {
      setDeleting(false)
      setWordIndex((i) => {
        const next = i + 1
        return next < words.length ? next : loop ? 0 : i
      })
      return
    }

    const t = setTimeout(() => {
      setSubIndex((i) => i + (deleting ? -1 : 1))
    }, deleting ? deleteSpeed : typeSpeed)

    return () => clearTimeout(t)
  }, [subIndex, deleting, wordIndex, words, typeSpeed, deleteSpeed, pause, loop])

  const text = words.length ? words[wordIndex].slice(0, subIndex) : ''

  return (
    <span className={className}>
      {text}
      {cursor && <span className="animate-pulse">|</span>}
    </span>
  )
}