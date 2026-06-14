import { Module } from '@nestjs/common';
import { VehicleTypeController } from './vehicle-type.controller';
import { VehicleTypeService } from './vehicle-type.service';

@Module({
  providers: [VehicleTypeService],
  controllers: [VehicleTypeController],
  exports: [VehicleTypeService],
})
export class VehicleTypeModule {}
