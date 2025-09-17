'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function useFbPageView() {
  const pathname = usePathname()
  const search = useSearchParams()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fbq = (window as unknown as Record<string, unknown>).fbq as any
      if (typeof fbq === 'function') {
        fbq('track', 'PageView')
      }
    }
  }, [pathname, search])
}
