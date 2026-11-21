import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Connect to the SQLite database
const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db",
});

// Reuse the database connection during development
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter });

// Save the connection so Next.js doesn't create too many
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;