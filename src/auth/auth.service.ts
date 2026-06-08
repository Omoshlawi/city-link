import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMembershipDto } from './auth.dto';
import { AclResourcesResponseDto } from './auth.acl.dto';
import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '../common/query-builder';
import { type UserSession } from './auth.types';
import { organizationConfig } from './auth.org.acl';
import { adminConfig } from './auth.system.acl';

@Injectable()
export class ExtendedAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
  ) {}

  getAclResources(): AclResourcesResponseDto {
    return {
      organization: (organizationConfig?.ac?.statements ??
        {}) as unknown as Record<string, string[]>,
      system: (adminConfig?.ac?.statements ?? {}) as unknown as Record<
        string,
        string[]
      >,
    };
  }

  async listMemberships(
    query: QueryMembershipDto,
    originalUrl: string,
    user: UserSession['user'],
  ) {
    const dbQuery: Prisma.MemberWhereInput = {
      AND: [
        { organization: { name: query.organization }, userId: user.id },
        {
          OR: query.search
            ? [
                {
                  organization: {
                    name: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                },
              ]
            : undefined,
        },
      ],
    };
    const totalCount = await this.prismaService.member.count({
      where: dbQuery,
    });
    const data = await this.prismaService.member.findMany({
      where: dbQuery,
      ...this.paginationService.buildSafePaginationQuery(query, totalCount),
      ...this.representationService.buildCustomRepresentationQuery(query?.v),
      ...this.sortService.buildSortQuery(query?.orderBy),
    });

    return {
      results: data,
      ...this.paginationService.buildPaginationControls(
        totalCount,
        originalUrl,
        query,
      ),
    };
  }
}
