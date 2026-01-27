// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Fix common Vercel configuration error: double quotes around the value
  if (url.startsWith('"') && url.endsWith('"')) {
    url = url.slice(1, -1);
    console.warn("WARN: DATABASE_URL was found with quotes. Stripped them automatically.");
  }
  return url;
};

const prismaClientSingleton = () => {
  const url = getDatabaseUrl();
  return new PrismaClient({
    datasources: {
      db: {
        url: url
      },
    },
  });
};

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
