import { ForbiddenException, Injectable } from '@nestjs/common';
import { SettingScope, SettingType } from '../generated/prisma/client';
import { DeleteQueryDto } from '../common/query-builder';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySettingsDto, UpsertSettingDto } from './settings.dto';
import { SettingsQueryService } from './settings-query.service';

@Injectable()
export class UserSettingsService {
  private readonly scope = SettingScope.USER;

  constructor(
    private readonly query: SettingsQueryService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Controller-facing ────────────────────────────────────────────────────

  getAll(userId: string, queryDto: QuerySettingsDto, originalUrl: string) {
    return this.query.findMany(
      { scope: this.scope, userId },
      queryDto,
      originalUrl,
    );
  }

  getOne(userId: string, namespace: string, key: string) {
    return this.query.findOne({ scope: this.scope, userId, namespace, key });
  }

  upsert(
    userId: string,
    namespace: string,
    key: string,
    dto: UpsertSettingDto,
  ) {
    return this.query.upsert({
      scope: this.scope,
      userId,
      namespace,
      key,
      value: dto.value,
      valueType: dto.valueType,
      description: dto.description,
      isPublic: dto.isPublic,
      updatedBy: userId,
    });
  }

  async delete(userId: string, id: string, queryDto: DeleteQueryDto) {
    await this.assertOwnership(userId, id);
    return queryDto.purge
      ? this.query.hardDelete(id)
      : this.query.softDelete(id);
  }

  async restore(userId: string, id: string) {
    await this.assertOwnership(userId, id);
    return this.query.restore(id);
  }

  // ── Internal (module-to-module) ───────────────────────────────────────────

  getValue(
    userId: string,
    namespace: string,
    key: string,
  ): Promise<string | null> {
    return this.query.getRawValue({
      scope: this.scope,
      userId,
      namespace,
      key,
    });
  }

  async setValue(
    userId: string,
    namespace: string,
    key: string,
    value: string,
    valueType?: SettingType,
  ): Promise<void> {
    await this.query.upsert({
      scope: this.scope,
      userId,
      namespace,
      key,
      value,
      valueType,
      updatedBy: userId,
    });
  }

  getNamespace(
    userId: string,
    namespace: string,
  ): Promise<Record<string, string>> {
    return this.query.getNamespaceValues(
      { scope: this.scope, userId },
      namespace,
    );
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private async assertOwnership(userId: string, id: string): Promise<void> {
    const record = await this.prisma.setting.findFirst({
      where: { id, scope: this.scope },
      select: { userId: true },
    });
    if (!record || record.userId !== userId) {
      throw new ForbiddenException('You do not own this setting');
    }
  }
}
