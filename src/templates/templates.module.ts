import { Module } from '@nestjs/common';
import { OrgTemplateOverridesController } from './org-template-overrides.controller';
import { OrgTemplateOverridesService } from './org-template-overrides.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  providers: [TemplatesService, OrgTemplateOverridesService],
  controllers: [TemplatesController, OrgTemplateOverridesController],
  exports: [TemplatesService, OrgTemplateOverridesService],
})
export class TemplatesModule {}
