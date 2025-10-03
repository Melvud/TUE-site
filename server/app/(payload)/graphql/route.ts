import config from '@payload-config'
import { createRouteHandler } from '@payloadcms/next/routes'

export const { GET, POST } = createRouteHandler({ config })
