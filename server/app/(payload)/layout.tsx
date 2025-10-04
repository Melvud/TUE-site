import '@payloadcms/next/css'
import type { ReactNode } from 'react'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'
import ClientDebug from './ClientDebug'

export const metadata = { title: 'Admin' }

export default function PayloadLayout({ children }: { children: ReactNode }) {
  const serverFunction = async (args: unknown) => {
    'use server'
    // серверный лог каждого server action
    console.log('[Admin UI] handleServerFunctions call')
    return handleServerFunctions({ ...(args as any), config, importMap })
  }

  // серверный лог mounter’а layout
  console.log('[Admin UI] RootLayout render')

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {/* клиентский лог — чтобы увидеть, что клиент монтируется */}
      <ClientDebug where="(payload)/layout.tsx" />
      {children}
    </RootLayout>
  )
}
