import config from '@payload-config'
import { Admin } from '@payloadcms/next/admin'
import { importMap } from '../../importMap.js'

export default function AdminPage() {
  return <Admin config={config} importMap={importMap} />
}
