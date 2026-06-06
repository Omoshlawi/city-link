import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { PRISMA_CONFIG_TOKEN } from './prisma.contants';
import {
  PrismaClientOptions,
  type Subset,
} from '../generated/prisma/internal/prismaNamespace';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(PRISMA_CONFIG_TOKEN)
    _config: Subset<PrismaClientOptions, PrismaClientOptions>,
  ) {
    super(_config);
  }
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
