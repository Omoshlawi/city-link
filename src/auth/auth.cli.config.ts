import { PrismaPg } from '@prisma/adapter-pg';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import {
  admin,
  anonymous,
  bearer,
  jwt,
  openAPI,
  organization,
  phoneNumber,
  twoFactor,
  username,
} from 'better-auth/plugins';
import { PrismaClient } from '../generated/prisma/client';
import { adminConfig } from './auth.system.acl';
import { organizationConfig } from './auth.org.acl';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    username(),
    anonymous(),
    admin(adminConfig),
    organization(organizationConfig),
    bearer(),
    openAPI(),
    jwt(),
    twoFactor(),
    phoneNumber(),
  ],
  emailAndPassword: {
    enabled: true,
  },
});
