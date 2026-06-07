import { Module } from '@nestjs/common';
import { OrgTemplateOverridesService } from './org-template-overrides.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  providers: [TemplatesService, OrgTemplateOverridesService],
  controllers: [TemplatesController],
  exports: [TemplatesService, OrgTemplateOverridesService],
})
export class TemplatesModule {}
