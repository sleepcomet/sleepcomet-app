// Prisma 7 configuration file
// This configures the datasource URL for Prisma Migrate
// Runtime connections use the adapter in src/lib/prisma.ts

import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})



