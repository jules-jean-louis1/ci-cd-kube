import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), "../docker/.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
