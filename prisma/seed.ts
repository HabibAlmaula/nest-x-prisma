import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as argon from 'argon2';

const prisma = new PrismaClient();
const fakerUser = async (): Promise<any> => ({
  email: faker.internet.email().toLowerCase(),
  fullname: faker.name.fullName(),
  password: await argon.hash('123'),
});

async function main() {
  const fakerRounds = 10;
  for (let i = 0; i < fakerRounds; i++) {
    await prisma.user.create({
      data: await fakerUser(),
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
