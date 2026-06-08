import { ApiProperty } from '@nestjs/swagger';

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
