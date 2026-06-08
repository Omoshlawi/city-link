import { createZodDto } from 'nestjs-zod';
import {
  PaginatedListBase,
  QueryBuilderSchema,
} from 'src/common/query-builder';
import z from 'zod';
import { Member } from '../generated/prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export const QueryMembershipSchema = QueryBuilderSchema.extend({
  search: z.string().optional(),
  organization: z.string().optional(),
  //   userId: z.string().optional().describe('Admin only'),
});

export class QueryMembershipDto extends createZodDto(QueryMembershipSchema) {}

export class GetMembershipResponseDto implements Member {
  @ApiProperty()
  userId!: string;
  @ApiProperty()
  id!: string;
  @ApiProperty()
  organizationId!: string;
  @ApiProperty()
  role!: string;
  @ApiProperty()
  createdAt!: Date;
}

export class ListMembershipDto extends PaginatedListBase {
  @ApiProperty({ isArray: true, type: GetMembershipResponseDto })
  results!: Array<GetMembershipResponseDto>;
}
