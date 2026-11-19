const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const prisma = new PrismaClient();

async function main() {
  const users = [
    {
      universityId: "ya1808056",
      name: "Yara",
      email: "ya1808056@uni.com",
      password: "Yara123!",
      role: "ADMIN",
    },
    {
      universityId: "ya1808057",
      name: "Yara",
      email: "ya1808057@uni.com",
      password: "Yara1234!",
      role: "INSTRUCTOR",
    },
     {
      universityId: "ya1808058",
      name: "Yara",
      email: "ya1808058@uni.com",
      password: "Yara12345!",
      role: "STUDENT",
    },
    {
      universityId: "fa2106847",
      name: "Fatima",
      email: "fa2106847@uni.com",
      password: "MyCatLeo1608",
      role: "STUDENT",
    },
    {
      universityId: "de2203628",
      name: "Dana",
      email: "da2203628@uni.com",
      password: "Dana123!",
      role: "STUDENT",
    },
    {
      universityId: "ka2313170",
      name: "Khawla",
      email: "ka2313170@uni.com",
      password: "Khawla123!",
      role: "INSTRUCTOR",
    },
     
  ];

  for (const user of users) {
    const passwordHash = await argon2.hash(user.password, {
      type: argon2.argon2id,
    });

    await prisma.user.upsert({
      where: { universityId: user.universityId },
      update: {},
      create: {
        universityId: user.universityId,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
        status: "ACTIVE",
      },
    });

    console.log(`Account ready: ${user.name}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  }
);