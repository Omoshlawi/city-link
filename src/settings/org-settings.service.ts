import { Injectable } from '@nestjs/common';
import { SettingScope, SettingType } from '../generated/prisma/client';
import { DeleteQueryDto } from '../common/query-builder';
import { QuerySettingsDto, UpsertSettingDto } from './settings.dto';
import { SettingsQueryService } from './settings-query.service';

@Injectable()
export class OrgSettingsService {
  private readonly scope = SettingScope.ORGANIZATION;

  constructor(private readonly query: SettingsQueryService) {}

  // ── Controller-facing ────────────────────────────────────────────────────

  getAll(orgId: string, queryDto: QuerySettingsDto, originalUrl: string) {
    return this.query.findMany(
      { scope: this.scope, organizationId: orgId },
      queryDto,
      originalUrl,
    );
  }

  getOne(orgId: string, namespace: string, key: string) {
    return this.query.findOne({
      scope: this.scope,
      organizationId: orgId,
      namespace,
      key,
    });
  }

  upsert(
    orgId: string,
    namespace: string,
    key: string,
    dto: UpsertSettingDto,
    updatedBy: string,
  ) {
    return this.query.upsert({
      scope: this.scope,
      organizationId: orgId,
      namespace,
      key,
      value: dto.value,
      valueType: dto.valueType,
      description: dto.description,
      isPublic: dto.isPublic,
      updatedBy,
    });
  }

  delete(id: string, queryDto: DeleteQueryDto) {
    return queryDto.purge
      ? this.query.hardDelete(id)
      : this.query.softDelete(id);
  }

  restore(id: string) {
    return this.query.restore(id);
  }

  // ── Internal (module-to-module) ───────────────────────────────────────────

  getValue(
    orgId: string,
    namespace: string,
    key: string,
  ): Promise<string | null> {
    return this.query.getRawValue({
      scope: this.scope,
      organizationId: orgId,
      namespace,
      key,
    });
  }

  async setValue(
    orgId: string,
    namespace: string,
    key: string,
    value: string,
    valueType?: SettingType,
  ): Promise<void> {
    await this.query.upsert({
      scope: this.scope,
      organizationId: orgId,
      namespace,
      key,
      value,
      valueType,
    });
  }

  getNamespace(
    orgId: string,
    namespace: string,
  ): Promise<Record<string, string>> {
    return this.query.getNamespaceValues(
      { scope: this.scope, organizationId: orgId },
      namespace,
    );
  }
}
