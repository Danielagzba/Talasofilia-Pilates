'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'

declare global {
  interface Window {
    MP_DEVICE_SESSION_ID?: string
  }
}

export function MercadoPagoDevice() {
  const pathname = usePathname()
  if (pathname?.replace(/\/$/, '') === '/reset-password') return null

  return (
    <Script
      src="https://www.mercadopago.com/v2/security.js"
      strategy="afterInteractive"
      onLoad={() => {
        console.log('[MercadoPago] Security script loaded, Device ID:', window.MP_DEVICE_SESSION_ID)
      }}
    />
  )
}