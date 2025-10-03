// Админ UI должен отрисовываться через компонент Admin.
// Этот экспорт доступен в актуальных версиях @payloadcms/next.
import config from '@payload-config'
import { Admin } from '@payloadcms/next/admin'
import { importMap } from '../importMap'

export default function AdminPage() {
  return <Admin config={config} importMap={importMap} />
}
