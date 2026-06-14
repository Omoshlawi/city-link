import { Module } from '@nestjs/common';
import { StageController } from './stage.controller';
import { StageService } from './stage.service';

@Module({
  providers: [StageService],
  controllers: [StageController],
  exports: [StageService],
})
export class StageModule {}
