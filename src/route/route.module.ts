import { Module } from '@nestjs/common';
import { LinkPricingService } from './link-pricing.service';
import { RouteController } from './route.controller';
import { RouteLinkService } from './route-link.service';
import { RouteService } from './route.service';

@Module({
  providers: [RouteService, RouteLinkService, LinkPricingService],
  controllers: [RouteController],
  exports: [RouteService],
})
export class RouteModule {}
