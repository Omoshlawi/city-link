import { Module } from '@nestjs/common';
import { OrgTemplateOverridesController } from './org-template-overrides.controller';
import { OrgTemplateOverridesService } from './org-template-overrides.service';
import { TemplateRendererService } from './template-renderer.service';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  providers: [
    TemplatesService,
    OrgTemplateOverridesService,
    TemplateRendererService,
  ],
  controllers: [TemplatesController, OrgTemplateOverridesController],
  exports: [TemplateRendererService],
})
export class TemplatesModule {}
