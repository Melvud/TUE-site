'use client'

import { useEffect } from 'react'

export default function ClientDebug({ where }: { where: string }) {
  useEffect(() => {
    // видны в консоли браузера
    console.log(`[Admin UI] ClientDebug mounted at: ${where}`)
  }, [where])

  return null
}
