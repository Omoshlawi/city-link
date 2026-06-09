import { createZodDto } from 'nestjs-zod';
import {
  PaginatedListBase,
  QueryBuilderSchema,
} from 'src/common/query-builder';
import z from 'zod';
import { Member } from '../generated/prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const CreateUserExtendedSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().optional(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\d{6,12}$/, 'Enter subscriber digits only (e.g. 712345678)')
    .optional(),
});

export class CreateUserExtendedDto extends createZodDto(
  CreateUserExtendedSchema,
) {}

export class CreatedUserResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() email!: string;
  @ApiPropertyOptional({ nullable: true }) username?: string | null;
  @ApiPropertyOptional({ nullable: true }) phoneNumber?: string | null;
  @ApiProperty() createdAt!: Date;
}
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

export class AclResourcesResponseDto {
  @ApiProperty({
    description: 'Organization-scoped ACL resources and their allowed actions',
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: {
      organization: ['update', 'delete'],
      member: ['create', 'update', 'delete'],
      invitation: ['create', 'cancel'],
      team: ['create', 'update', 'delete'],
      ac: ['create', 'read', 'update', 'delete'],
      orgTemplates: ['create', 'update', 'delete', 'restore'],
    },
  })
  organization!: Record<string, string[]>;

  @ApiProperty({
    description: 'System-scoped ACL resources and their allowed actions',
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: {
      user: [
        'create',
        'list',
        'ban',
        'impersonate',
        'revoke',
        'delete',
        'set-role',
      ],
      session: ['list', 'revoke'],
      adrressHierArchy: ['create', 'update', 'delete', 'restore'],
      templates: ['create', 'update', 'delete', 'restore'],
    },
  })
  system!: Record<string, string[]>;
}
