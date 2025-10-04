import '@payloadcms/next/css'
import type { ReactNode } from 'react'
import config from '@payload-config'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { importMap } from './admin/importMap'

export const metadata = { 
  title: 'PhE Admin',
  description: 'Photonics Society Eindhoven Admin Panel'
}

type Args = {
  children: ReactNode
}

export default function PayloadLayout({ children }: Args) {
  const serverFunction = async (args: unknown) => {
    'use server'
    return handleServerFunctions({ 
      ...(args as any), 
      config, 
      importMap 
    })
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