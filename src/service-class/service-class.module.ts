import { Module } from '@nestjs/common';
import { ServiceClassController } from './service-class.controller';
import { ServiceClassService } from './service-class.service';

@Module({
  providers: [ServiceClassService],
  controllers: [ServiceClassController],
  exports: [ServiceClassService],
})
export class ServiceClassModule {}
