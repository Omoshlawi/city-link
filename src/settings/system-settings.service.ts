import { Injectable } from '@nestjs/common';
import { SettingScope, SettingType } from '../generated/prisma/client';
import { DeleteQueryDto } from '../common/query-builder';
import { QuerySettingsDto, UpsertSettingDto } from './settings.dto';
import { SettingsQueryService } from './settings-query.service';

@Injectable()
export class SystemSettingsService {
  private readonly scope = SettingScope.SYSTEM;

  constructor(private readonly query: SettingsQueryService) {}

  // ── Controller-facing ────────────────────────────────────────────────────

  getAll(queryDto: QuerySettingsDto, originalUrl: string) {
    return this.query.findMany({ scope: this.scope }, queryDto, originalUrl);
  }

  getOne(namespace: string, key: string) {
    return this.query.findOne({ scope: this.scope, namespace, key });
  }

  upsert(
    namespace: string,
    key: string,
    dto: UpsertSettingDto,
    updatedBy: string,
  ) {
    return this.query.upsert({
      scope: this.scope,
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

  getValue(namespace: string, key: string): Promise<string | null> {
    return this.query.getRawValue({ scope: this.scope, namespace, key });
  }

  async setValue(
    namespace: string,
    key: string,
    value: string,
    valueType?: SettingType,
  ): Promise<void> {
    await this.query.upsert({
      scope: this.scope,
      namespace,
      key,
      value,
      valueType,
    });
  }

  getNamespace(namespace: string): Promise<Record<string, string>> {
    return this.query.getNamespaceValues({ scope: this.scope }, namespace);
  }
}
