import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), "../docker/.env") });
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log("Prisma: connexion OK");
  } catch (err) {
    console.error("Prisma: connexion échouée");
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
