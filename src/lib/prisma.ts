import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  return new PrismaClient();
}

function hasTagDelegate(client: PrismaClient | undefined): client is PrismaClient {
  return Boolean(client && (client as { tag?: unknown }).tag);
}

function getClient(): PrismaClient {
  if (!hasTagDelegate(globalForPrisma.prisma)) {
    // Dev HMR can keep a pre-Tag schema client; replace it.
    void globalForPrisma.prisma?.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/** Always resolves to a client that matches the current schema (safe under Next.js HMR). */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
