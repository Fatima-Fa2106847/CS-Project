import { PrismaClient } from "@prisma/client";

// Reuse the database connection during development
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

// Save the connection so Next.js doesn't create too many
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;