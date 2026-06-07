import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigifyModule } from '@itgorillaz/configify';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { AddressHierarchyModule } from './address-hierarchy/address-hierarchy.module';
import { TemplatesModule } from './templates/templates.module';

@Module({
  imports: [
    ConfigifyModule.forRootAsync(),
    PrismaModule.forRoot(),
    AuthModule.forRoot(),
    CommonModule,
    AddressHierarchyModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
