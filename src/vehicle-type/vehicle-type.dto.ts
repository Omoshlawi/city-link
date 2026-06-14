import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QueryBuilderSchema } from '../common/query-builder';
import { PaginatedListBase } from '../common/query-builder/pagination.dto';

export const CreateVehicleTypeSchema = z.object({
  code: z
    .string()
    .min(1)
    .describe('Short unique identifier e.g. "MATATU", "BUS", "MINIBUS"'),
  name: z
    .string()
    .min(1)
    .describe('Human-readable display name e.g. "Matatu", "Bus"'),
});
export class CreateVehicleTypeDto extends createZodDto(CreateVehicleTypeSchema) {}

export const UpdateVehicleTypeSchema = CreateVehicleTypeSchema.partial();
export class UpdateVehicleTypeDto extends createZodDto(UpdateVehicleTypeSchema) {}

export const QueryVehicleTypeSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryVehicleTypeDto extends createZodDto(QueryVehicleTypeSchema) {}

export class GetVehicleTypeResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryVehicleTypeResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetVehicleTypeResponseDto })
  results!: GetVehicleTypeResponseDto[];
}
