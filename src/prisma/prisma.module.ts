import { DynamicModule, Module } from '@nestjs/common';
import { PRISMA_CONFIG_TOKEN } from './prisma.contants';
import { PrismaService } from './prisma.service';
import { PrismaAsyncOptions } from './prisma.types';
import { PrismaConfig } from './prisma.config';
import { PrismaPg } from '@prisma/adapter-pg';

@Module({})
export class PrismaModule {
  static forRootAsync(options: PrismaAsyncOptions): DynamicModule {
    return {
      module: PrismaModule,
      global: options.global,
      providers: [
        {
          provide: PRISMA_CONFIG_TOKEN,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }

  static forRoot() {
    return this.forRootAsync({
      global: true,
      useFactory: (config: PrismaConfig) => {
        return {
          adapter: new PrismaPg({ connectionString: config.databaseUrl }),
        };
      },
      inject: [PrismaConfig],
    });
  }
}
