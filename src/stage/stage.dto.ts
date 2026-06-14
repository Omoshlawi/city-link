import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QueryBuilderSchema } from '../common/query-builder';
import { PaginatedListBase } from '../common/query-builder/pagination.dto';

// ─── Stage ───────────────────────────────────────────────────────────────────

export const CreateStageSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  areaId: z.uuid(),
  latitude: z.number(),
  longitude: z.number(),
  radiusInMeters: z.number().int().positive(),
});
export class CreateStageDto extends createZodDto(CreateStageSchema) {}

export const UpdateStageSchema = CreateStageSchema.partial();
export class UpdateStageDto extends createZodDto(UpdateStageSchema) {}

export const QueryStageSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  areaId: z.uuid().optional(),
  code: z.string().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryStageDto extends createZodDto(QueryStageSchema) {}

export class GetStageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() areaId!: string;
  @ApiProperty() latitude!: string;
  @ApiProperty() longitude!: string;
  @ApiProperty() radiusInMeters!: number;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryStageResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetStageResponseDto })
  results!: GetStageResponseDto[];
}

// ─── StageLink ───────────────────────────────────────────────────────────────

export const StageLinkDirectionSchema = z.enum([
  'outgoing',
  'incoming',
  'both',
]);

export const CreateStageLinkSchema = z.object({
  toStageId: z.uuid(),
  approximateDistanceMeters: z.number().positive(),
  approximateTimeMinutes: z.number().int().positive(),
});
export class CreateStageLinkDto extends createZodDto(CreateStageLinkSchema) {}

export const UpdateStageLinkSchema = CreateStageLinkSchema.partial();
export class UpdateStageLinkDto extends createZodDto(UpdateStageLinkSchema) {}

export const QueryStageLinkSchema = z.object({
  ...QueryBuilderSchema.shape,
  toStageId: z
    .uuid()
    .optional()
    .describe(
      'Outgoing only. Filter results to links whose destination matches this stage ID.',
    ),
  fromStageId: z
    .uuid()
    .optional()
    .describe(
      'Incoming only. Filter results to links whose origin matches this stage ID.',
    ),
  direction: StageLinkDirectionSchema.optional()
    .default('outgoing')
    .describe(
      'outgoing (default) — links leaving this stage. incoming — links arriving at this stage. both — all adjacent edges (toStageId/fromStageId filters are ignored).',
    ),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryStageLinkDto extends createZodDto(QueryStageLinkSchema) {}

export class GetStageLinkResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() fromStageId!: string;
  @ApiProperty() toStageId!: string;
  @ApiProperty() approximateDistanceMeters!: string;
  @ApiProperty() approximateTimeMinutes!: number;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryStageLinkResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetStageLinkResponseDto })
  results!: GetStageLinkResponseDto[];
}

export class GetStageLinkResponseDtoWithStages extends GetStageLinkResponseDto {
  @ApiPropertyOptional({ type: GetStageResponseDto })
  fromStage?: GetStageResponseDto;

  @ApiPropertyOptional({ type: GetStageResponseDto })
  toStage?: GetStageResponseDto;
}
