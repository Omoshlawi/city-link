import { auth } from 'src/auth/auth.cli.config';
import { PrismaClient } from 'src/generated/prisma/client';

export default async function seedAdminUser(
  prisma: PrismaClient,
): Promise<void> {
  try {
    const username = process.env.ADMIN_USERNAME as string;
    const email = process.env.ADMIN_EMAIL as string;
    const password = process.env.ADMIN_PASSWORD as string;
    const skipAdminIfExist = process.env.ADMIN_SKIP_SEED_IF_EXISTS as string;
    const admin = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (admin) {
      if (skipAdminIfExist === 'true') {
        console.log('Found admin User .Skipping ....');
        return;
      } else {
        console.log('Found admin User .Deleting ....');
        await prisma.user.deleteMany({
          where: { OR: [{ username }, { email }] },
        });
      }
    }

    console.log('Seeding admin with credials: ');
    console.log('[+]Username: ', username);
    console.log('[+]Email: ', email);
    console.log('[+]Password: ', password);

    const user = await auth.api.signUpEmail({
      body: { email, username, password, name: username, rememberMe: false },
    });
    await prisma.user.update({
      where: { id: user.user.id },
      data: { role: 'admin', emailVerified: true },
    });
    console.log('🎉 Admin Seed Completed!');
  } catch (error) {
    console.error('Error seeding admin:', error);
    throw error;
  }
}
