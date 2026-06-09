import { Global, Module } from '@nestjs/common';
import { SettingsQueryService } from './settings-query.service';
import { SystemSettingsService } from './system-settings.service';
import { OrgSettingsService } from './org-settings.service';
import { UserSettingsService } from './user-settings.service';
import { SystemSettingsController } from './system-settings.controller';
import { OrgSettingsController } from './org-settings.controller';
import { UserSettingsController } from './user-settings.controller';

@Global()
@Module({
  providers: [
    SettingsQueryService,
    SystemSettingsService,
    OrgSettingsService,
    UserSettingsService,
  ],
  controllers: [
    SystemSettingsController,
    OrgSettingsController,
    UserSettingsController,
  ],
  exports: [SystemSettingsService, OrgSettingsService, UserSettingsService],
})
export class SettingsModule {}
