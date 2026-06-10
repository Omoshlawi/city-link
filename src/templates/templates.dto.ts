import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { PaginatedListBase, QueryBuilderSchema } from '../common/query-builder';
import {
  OrgTemplateOverride,
  OrgTemplateOverrideVersion,
  Prisma,
  Template,
  TemplateVersion,
} from '../generated/prisma/client';
import { TemplateEngine } from '../generated/prisma/enums';

// ── Query DTOs ────────────────────────────────────────────────────────────────

const QueryTemplatesSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  type: z.string().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryTemplatesDto extends createZodDto(QueryTemplatesSchema) {}

const QueryTemplateVersionsSchema = z.object({ ...QueryBuilderSchema.shape });
export class QueryTemplateVersionsDto extends createZodDto(
  QueryTemplateVersionsSchema,
) {}

const QueryOrgOverridesSchema = z.object({
  ...QueryBuilderSchema.shape,
  organizationId: z.uuid().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryOrgOverridesDto extends createZodDto(
  QueryOrgOverridesSchema,
) {}

const QueryOrgOverrideVersionsSchema = z.object({
  ...QueryBuilderSchema.shape,
});
export class QueryOrgOverrideVersionsDto extends createZodDto(
  QueryOrgOverrideVersionsSchema,
) {}

// ── Mutation DTOs ─────────────────────────────────────────────────────────────

const UpdateTemplateSlotsSchema = z.object({
  slots: z.record(z.string(), z.string()),
  schema: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  changeNote: z.string().optional(),
});
export class UpdateTemplateSlotsDto extends createZodDto(
  UpdateTemplateSlotsSchema,
) {}

const UpsertOrgOverrideSchema = z.object({
  slots: z.record(z.string(), z.string()),
  metadata: z.record(z.string(), z.unknown()).optional(),
  changeNote: z.string().optional(),
});
export class UpsertOrgOverrideDto extends createZodDto(
  UpsertOrgOverrideSchema,
) {}

const RestoreVersionSchema = z.object({
  changeNote: z.string().optional(),
  saveCurrentSnapshot: z.boolean().optional().default(false),
});
export class RestoreVersionDto extends createZodDto(RestoreVersionSchema) {}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export class TemplateResponseDto implements Template {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: TemplateEngine })
  engine!: TemplateEngine;

  @ApiProperty({ type: Object })
  slots!: Prisma.JsonValue;

  @ApiPropertyOptional({ type: Object, nullable: true })
  schema!: Prisma.JsonValue;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata!: Prisma.JsonValue;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  voided!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class QueryTemplatesResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: TemplateResponseDto })
  results!: TemplateResponseDto[];
}

export class TemplateVersionResponseDto implements TemplateVersion {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  templateId!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ type: Object })
  slots!: Prisma.JsonValue;

  @ApiPropertyOptional({ type: Object, nullable: true })
  schema!: Prisma.JsonValue;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata!: Prisma.JsonValue;

  @ApiPropertyOptional({ nullable: true })
  changedById!: string | null;

  @ApiPropertyOptional({ nullable: true })
  changeNote!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class QueryTemplateVersionsResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: TemplateVersionResponseDto })
  results!: TemplateVersionResponseDto[];
}

export class OrgTemplateOverrideResponseDto implements OrgTemplateOverride {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  templateKey!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty({ type: Object })
  slots!: Prisma.JsonValue;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata!: Prisma.JsonValue;

  @ApiProperty()
  version!: number;

  @ApiProperty()
  voided!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class QueryOrgOverridesResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: OrgTemplateOverrideResponseDto })
  results!: OrgTemplateOverrideResponseDto[];
}

export class OrgTemplateOverrideVersionResponseDto implements OrgTemplateOverrideVersion {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  overrideId!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ type: Object })
  slots!: Prisma.JsonValue;

  @ApiPropertyOptional({ type: Object, nullable: true })
  metadata!: Prisma.JsonValue;

  @ApiPropertyOptional({ nullable: true })
  changedById!: string | null;

  @ApiPropertyOptional({ nullable: true })
  changeNote!: string | null;

  @ApiProperty()
  createdAt!: Date;
}

export class QueryOrgOverrideVersionsResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: OrgTemplateOverrideVersionResponseDto })
  results!: OrgTemplateOverrideVersionResponseDto[];
}
