import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { PrismaClient } from 'src/generated/prisma/client';
import seedAdminUser from './scripts/seed-admin';
import seedTemplates from './scripts/seed-templates';
import seedKenyaAddressHierarchy from './scripts/seed-kenya-address-hierarchy';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type Seeder = {
  name: string;
  fn: (prisma: PrismaClient) => Promise<void>;
};

const seeders: Seeder[] = [
  { name: 'Admin User', fn: seedAdminUser },
  { name: 'Templates', fn: seedTemplates },
  { name: 'Kenya Address Hierarchy', fn: seedKenyaAddressHierarchy },
];

async function main() {
  console.log('🌱 Starting seed process...\n');
  console.log('='.repeat(50));

  for (const seeder of seeders) {
    console.log(`\n🚀 Running: ${seeder.name}...\n`);
    await seeder.fn(prisma);
  }

  console.log('='.repeat(50));
  console.log('\n🎉 All seed scripts completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('\n💥 Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
