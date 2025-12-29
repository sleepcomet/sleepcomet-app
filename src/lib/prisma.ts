import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { 
  prismaClient: PrismaClient;
};

// Prisma 7: Using the node-postgres driver adapter
// https://www.prisma.io/docs/orm/overview/databases/postgresql#using-the-node-postgres-driver
const connectionString = process.env.DATABASE_URL!

const adapter = new PrismaPg({ connectionString })

// Initialize Prisma Client with the PostgreSQL adapter (Prisma 7)
export const prisma = globalForPrisma.prismaClient || new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClient = prisma
}
