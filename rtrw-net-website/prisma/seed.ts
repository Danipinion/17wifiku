import { Role, UserStatus } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { hash } from "bcrypt-ts";
import prisma from "@/lib/prisma";

async function main() {
  const defaultPassword = await hash("user111", 12);

  const usersToCreate = 20;
  const usersData = [];

  for (let i = 0; i < usersToCreate; i++) {
    usersData.push({
      name: faker.person.fullName(),
      idNumber: faker.string.numeric(16),
      phone: `08${faker.helpers.fromRegExp("[0-9]{10}")}`,
      password: defaultPassword,
      address: faker.location.streetAddress(),
      role: Role.PELANGGAN,
      status: Math.random() > 0.5 ? UserStatus.ACTIVE : UserStatus.INACTIVE,
      abonemen: faker.number.int({ min: 50000, max: 250000 }),
      potongan: 0,
    });
  }

  await prisma.user.createMany({
    data: usersData,
    skipDuplicates: true,
  });

  console.log(`Seeding finished. Created ${usersToCreate} users.`);

  await prisma.$disconnect();
}
