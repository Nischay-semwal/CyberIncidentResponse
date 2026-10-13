
import { PrismaClient, Role } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash("Instructor123!");

  const instructor = await prisma.user.upsert({
    where: {
      email: "instructor@cis.local",
    },
    update: {},
    create: {
      name: "Project Instructor",
      email: "instructor@cis.local",
      passwordHash,
      role: Role.INSTRUCTOR,
    },
  });

  console.log("Instructor ready:");
  console.log({
    email: instructor.email,
    role: instructor.role,
    password: "Instructor123!",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });