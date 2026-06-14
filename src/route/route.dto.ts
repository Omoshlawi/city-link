import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { DayOfWeek } from '../generated/prisma/enums';
import { QueryBuilderSchema } from '../common/query-builder';
import { PaginatedListBase } from '../common/query-builder/pagination.dto';

// ─── Route ───────────────────────────────────────────────────────────────────

export const CreateRouteSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
});
export class CreateRouteDto extends createZodDto(CreateRouteSchema) {}

export const UpdateRouteSchema = CreateRouteSchema.partial();
export class UpdateRouteDto extends createZodDto(UpdateRouteSchema) {}

export const QueryRouteSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  code: z.string().optional(),
  name: z.string().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryRouteDto extends createZodDto(QueryRouteSchema) {}

export class GetRouteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryRouteResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetRouteResponseDto })
  results!: GetRouteResponseDto[];
}

// ─── RouteLink ───────────────────────────────────────────────────────────────

export const RouteLinkItemSchema = z.object({
  stageLinkId: z.uuid(),
  order: z.number().int().positive(),
});

export const SetRouteLinksSchema = z.object({
  links: z.array(RouteLinkItemSchema).min(1),
});
export class SetRouteLinksDto extends createZodDto(SetRouteLinksSchema) {}

export class GetRouteLinkResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() routeId!: string;
  @ApiProperty() stageLinkId!: string;
  @ApiProperty() order!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── LinkPricing ─────────────────────────────────────────────────────────────

export const CreateLinkPricingSchema = z.object({
  stageLinkId: z.uuid(),
  routeId: z.uuid().optional(),
  day: z.nativeEnum(DayOfWeek),
  timeStart: z.string().regex(/^\d{2}:\d{2}$/),
  timeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  price: z.number().positive(),
});
export class CreateLinkPricingDto extends createZodDto(
  CreateLinkPricingSchema,
) {}

export const UpdateLinkPricingSchema = CreateLinkPricingSchema.partial();
export class UpdateLinkPricingDto extends createZodDto(
  UpdateLinkPricingSchema,
) {}

export const QueryLinkPricingSchema = z.object({
  ...QueryBuilderSchema.shape,
  stageLinkId: z.uuid().optional(),
  routeId: z.uuid().optional(),
  day: z.nativeEnum(DayOfWeek).optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryLinkPricingDto extends createZodDto(QueryLinkPricingSchema) {}

export class GetLinkPricingResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() stageLinkId!: string;
  @ApiProperty() operatorId!: string;
  @ApiProperty({ nullable: true }) routeId!: string | null;
  @ApiProperty() day!: DayOfWeek;
  @ApiProperty() timeStart!: string;
  @ApiProperty() timeEnd!: string;
  @ApiProperty() price!: string;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryLinkPricingResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetLinkPricingResponseDto })
  results!: GetLinkPricingResponseDto[];
}
