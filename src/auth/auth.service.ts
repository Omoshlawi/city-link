import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import capitalize from 'lodash/capitalize';
import {
  CustomRepresentationService,
  PaginationService,
  SortService,
} from '../common/query-builder';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AclResourcesResponseDto,
  CreateUserExtendedDto,
  QueryMembershipDto,
} from './auth.dto';
import { organizationConfig } from './auth.org.acl';
import { adminConfig, adminPluginRoles } from './auth.system.acl';
import { type UserSession, BetterAuthWithPlugins } from './auth.types';

@Injectable()
export class ExtendedAuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sortService: SortService,
    private readonly paginationService: PaginationService,
    private readonly representationService: CustomRepresentationService,
    private readonly authService: AuthService<BetterAuthWithPlugins>,
  ) {}

  listSystemRoles() {
    const now = new Date().toISOString();
    return Object.entries(adminPluginRoles).map(([roleKey, roleConfig]) => {
      const permission = roleConfig.statements as unknown as Record<
        string,
        string[]
      >;
      return {
        id: roleKey,
        role: roleKey,
        label: capitalize(roleKey),
        permission,
        inbuild: true,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  async createUser(dto: CreateUserExtendedDto) {
    if (dto.username) {
      const { available } = await this.authService.api.isUsernameAvailable({
        body: { username: dto.username },
      });
      if (!available)
        throw new BadRequestException('User exist with given username');
    }
    if (dto.phoneNumber) {
      const count = await this.prismaService.user.count({
        where: {
          phoneNumber: dto.phoneNumber,
        },
      });
      if (count > 0)
        throw new BadRequestException('User exist with given phone number');
    }

    const { user } = await this.authService.api.createUser({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      body: { ...dto, role: dto.role as any },
    });

    const updated = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        ...(dto.username ? { username: dto.username } : {}),
        ...(dto.phoneNumber ? { phoneNumber: dto.phoneNumber } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    return updated;
  }

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
