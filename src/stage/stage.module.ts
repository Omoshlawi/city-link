import { Module } from '@nestjs/common';
import { StageLinkService } from './stage-link.service';
import { StageController } from './stage.controller';
import { StageService } from './stage.service';

@Module({
  providers: [StageService, StageLinkService],
  controllers: [StageController],
  exports: [StageService],
})
export class StageModule {}
