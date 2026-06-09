import { ApiProperty } from '@nestjs/swagger';
import { SettingScope, SettingType } from '../generated/prisma/enums';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QueryBuilderSchema } from '../common/query-builder';

export const QuerySettingsSchema = z.object({
  ...QueryBuilderSchema.shape,
  namespace: z.string().optional(),
  key: z.string().optional(),
  valueType: z.enum(SettingType).optional(),
  search: z.string().optional(),
  includeDeleted: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});

export const UpsertSettingSchema = z.object({
  value: z.string(),
  valueType: z.enum(SettingType).optional().default(SettingType.STRING),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

export class QuerySettingsDto extends createZodDto(QuerySettingsSchema) {}
export class UpsertSettingDto extends createZodDto(UpsertSettingSchema) {}

export class SettingResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: SettingScope })
  scope!: SettingScope;

  @ApiProperty()
  namespace!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty({ nullable: true })
  userId!: string | null;

  @ApiProperty({ nullable: true })
  organizationId!: string | null;

  @ApiProperty()
  value!: string;

  @ApiProperty({ enum: SettingType })
  valueType!: SettingType;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  updatedBy!: string | null;

  @ApiProperty({ nullable: true })
  deletedAt!: Date | null;
}

export class QuerySettingsResponseDto {
  @ApiProperty({ isArray: true, type: SettingResponseDto })
  results!: SettingResponseDto[];

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  currentPage!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty({ nullable: true })
  next!: string | null;

  @ApiProperty({ nullable: true })
  prev!: string | null;
}
