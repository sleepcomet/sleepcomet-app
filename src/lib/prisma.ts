import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prismaClient: PrismaClient;
  pool: Pool;
};

// Prisma 7: Using the node-postgres driver adapter
// https://www.prisma.io/docs/orm/overview/databases/postgresql#using-the-node-postgres-driver
const connectionString = process.env.DATABASE_URL!;

// Create a Pool instance for the adapter
const pool = globalForPrisma.pool || new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with the PostgreSQL adapter (Prisma 7)
export const prisma =
  globalForPrisma.prismaClient ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClient = prisma;
  globalForPrisma.pool = pool;
}
