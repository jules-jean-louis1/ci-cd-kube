import { Before, After } from "@cucumber/cucumber";
import { prisma } from "../../../src/utils/prisma.js";

Before(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});

After(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
});
