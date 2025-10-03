import '@payloadcms/next/css'
import type { ReactNode } from 'react'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'

export const metadata = {
  title: 'Admin',
}

export default function PayloadLayout({ children }: { children: ReactNode }) {
  const serverFunction = async (args: any) => {
    'use server'
    return handleServerFunctions({ ...args, config, importMap })
  }

  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  )
}
