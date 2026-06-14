import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QueryBuilderSchema } from '../common/query-builder';
import { PaginatedListBase } from '../common/query-builder/pagination.dto';

export const CreateServiceClassSchema = z.object({
  code: z
    .string()
    .min(1)
    .describe('Short unique identifier e.g. "EXPRESS", "LOCAL", "PEAK"'),
  name: z
    .string()
    .min(1)
    .describe('Human-readable display name e.g. "Express Service"'),
  description: z.string().optional(),
});
export class CreateServiceClassDto extends createZodDto(
  CreateServiceClassSchema,
) {}

export const UpdateServiceClassSchema = CreateServiceClassSchema.partial();
export class UpdateServiceClassDto extends createZodDto(
  UpdateServiceClassSchema,
) {}

export const QueryServiceClassSchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  includeVoided: z
    .stringbool({ truthy: ['true', '1'], falsy: ['false', '0'] })
    .optional()
    .default(false),
});
export class QueryServiceClassDto extends createZodDto(
  QueryServiceClassSchema,
) {}

export class GetServiceClassResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ nullable: true }) description!: string | null;
  @ApiProperty() voided!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class QueryServiceClassResponseDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetServiceClassResponseDto })
  results!: GetServiceClassResponseDto[];
}
