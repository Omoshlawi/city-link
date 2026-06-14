import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QueryBuilderSchema } from '../common/query-builder';
import { PaginatedListBase } from '../common/query-builder/pagination.dto';
import { FleetStatus } from '../generated/prisma/client';

// ─── Fleet ───────────────────────────────────────────────────────────────────

export const CreateFleetSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  vehicleTypeId: z.string().uuid(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  plateNumber: z.string().min(1, 'Plate number is required'),
});
export class CreateFleetDto extends createZodDto(CreateFleetSchema) {}

export const UpdateFleetSchema = CreateFleetSchema.partial().extend({
  status: z.nativeEnum(FleetStatus).optional(),
  activeFleetRouteId: z.string().uuid().nullable().optional(),
});
export class UpdateFleetDto extends createZodDto(UpdateFleetSchema) {}

export const QueryFleetSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  status: z.nativeEnum(FleetStatus).optional(),
  vehicleTypeId: z.string().uuid().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryFleetDto extends createZodDto(QueryFleetSchema) {}

export class GetFleetResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() operatorId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() plateNumber!: string;
  @ApiProperty() capacity!: number;
  @ApiProperty() vehicleTypeId!: string;
  @ApiProperty({ enum: FleetStatus }) status!: FleetStatus;
  @ApiProperty({ nullable: true }) activeFleetRouteId!: string | null;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryFleetResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetFleetResponseDto })
  results!: GetFleetResponseDto[];
}

// ─── Fleet Route ──────────────────────────────────────────────────────────────

export const CreateFleetRouteSchema = z.object({
  routeId: z.string().uuid(),
});
export class CreateFleetRouteDto extends createZodDto(CreateFleetRouteSchema) {}

export class QueryFleetRouteDto extends createZodDto(QueryBuilderSchema) {}

export class GetFleetRouteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() fleetId!: string;
  @ApiProperty() routeId!: string;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryFleetRouteResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetFleetRouteResponseDto })
  results!: GetFleetRouteResponseDto[];
}
