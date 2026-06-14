import { Module } from '@nestjs/common';
import { FleetLookupService } from './fleet-lookup.service';
import { FleetRouteService } from './fleet-route.service';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

@Module({
  providers: [FleetLookupService, FleetService, FleetRouteService],
  controllers: [FleetController],
  exports: [FleetService, FleetRouteService],
})
export class FleetModule {}
