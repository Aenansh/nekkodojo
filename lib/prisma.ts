import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionUrl = new URL(`${process.env.DATABASE_URL}`);
const sslMode = connectionUrl.searchParams.get("sslmode")?.toLowerCase();
if (
  ["prefer", "require", "verify-ca"].includes(sslMode ?? "") &&
  connectionUrl.searchParams.get("uselibpqcompat") !== "true"
) {
  connectionUrl.searchParams.set("sslmode", "verify-full");
}

const adapter = new PrismaPg({ connectionString: connectionUrl.toString() });
const prisma = new PrismaClient({ adapter });

export { prisma };
