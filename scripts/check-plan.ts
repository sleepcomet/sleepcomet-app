
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      subscription: true
    }
  });

  console.log('--- User Plans ---');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  users.forEach((user: any) => {
    console.log(`User: ${user.email} (${user.id})`);
    console.log(`  Plan: ${user.subscription ? user.subscription.plan : 'No subscription record (Defaults to FREE)'}`);
    console.log(`  Subscription ID: ${user.subscription ? user.subscription.id : 'N/A'}`);
    console.log('------------------');
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
