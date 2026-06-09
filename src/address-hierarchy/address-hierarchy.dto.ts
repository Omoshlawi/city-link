import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';
import { QueryBuilderSchema } from '../common/query-builder';
import { AddressHierarchy } from '../generated/prisma/client';

export const QueryAddressHierarchySchema = z.object({
  ...QueryBuilderSchema.shape,
  search: z.string().optional(),
  country: z.string().optional(),
  level: z.coerce.number().int().nonnegative().min(1).max(5).optional(),
  code: z.string().optional(),
  parentId: z.uuid().optional(),
  name: z.string().optional(),
  nameLocal: z.string().optional(),
  parentCountry: z.string().optional(),
  parentLevel: z.coerce.number().int().nonnegative().min(1).max(5).optional(),
  parentCode: z.string().optional(),
  parentName: z.string().optional(),
  parentNameLocal: z.string().optional(),
  includeVoided: z
    .stringbool({
      truthy: ['true', '1'],
      falsy: ['false', '0'],
    })
    .optional()
    .default(false),
});

export class QueryAddressHierarchyDto extends createZodDto(
  QueryAddressHierarchySchema,
) {}

export class GetAddressHierarchyResponseDto implements AddressHierarchy {
  @ApiProperty()
  country!: string;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  parentId!: string;

  @ApiProperty({ type: GetAddressHierarchyResponseDto })
  parent?: GetAddressHierarchyResponseDto | undefined;

  @ApiProperty({ isArray: true, type: GetAddressHierarchyResponseDto })
  children!: GetAddressHierarchyResponseDto[];

  @ApiProperty()
  code!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  nameLocal!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  voided!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

const AddressLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const CreateAddressHierarchySchema = z.object({
  country: z.string().min(2),
  level: AddressLevelSchema,
  parentId: z.uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  nameLocal: z.string().optional(),
});

export class CreateAddressHierarchyDto extends createZodDto(
  CreateAddressHierarchySchema,
) {}

export const UpdateAddressHierarchySchema = CreateAddressHierarchySchema.partial();

export class UpdateAddressHierarchyDto extends createZodDto(
  UpdateAddressHierarchySchema,
) {}

export class QueryAddressHierarchyResponseDto {
  @ApiProperty({ isArray: true, type: GetAddressHierarchyResponseDto })
  results!: GetAddressHierarchyResponseDto[];

  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  currentPage!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  next!: string | null;

  @ApiProperty()
  prev!: string | null;
}
