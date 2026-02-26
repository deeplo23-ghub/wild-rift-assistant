const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const champs = await prisma.champion.findMany({ take: 1 });
    if (champs.length > 0) {
      console.log('Keys:', Object.keys(champs[0]).join(', '));
      console.log('Burst:', champs[0].burstScore);
    } else {
      console.log('No champions found');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
