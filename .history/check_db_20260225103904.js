const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const champs = await prisma.champion.findMany({ take: 1 });
    console.log('Champ 0:', JSON.stringify(champs[0], null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
