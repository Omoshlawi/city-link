/*
  Warnings:

  - You are about to drop the `Fleet` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FleetRoute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LinkPricing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Passenger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Route` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RouteLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StageLink` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Trip` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleType` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- DropForeignKey
ALTER TABLE "Fleet" DROP CONSTRAINT "Fleet_activeFleetRouteId_fkey";

-- DropForeignKey
ALTER TABLE "Fleet" DROP CONSTRAINT "Fleet_operatorId_fkey";

-- DropForeignKey
ALTER TABLE "Fleet" DROP CONSTRAINT "Fleet_vehicleTypeId_fkey";

-- DropForeignKey
ALTER TABLE "FleetRoute" DROP CONSTRAINT "FleetRoute_fleetId_fkey";

-- DropForeignKey
ALTER TABLE "FleetRoute" DROP CONSTRAINT "FleetRoute_routeId_fkey";

-- DropForeignKey
ALTER TABLE "LinkPricing" DROP CONSTRAINT "LinkPricing_operatorId_fkey";

-- DropForeignKey
ALTER TABLE "LinkPricing" DROP CONSTRAINT "LinkPricing_stageLinkId_fkey";

-- DropForeignKey
ALTER TABLE "Passenger" DROP CONSTRAINT "Passenger_userId_fkey";

-- DropForeignKey
ALTER TABLE "RouteLink" DROP CONSTRAINT "RouteLink_routeId_fkey";

-- DropForeignKey
ALTER TABLE "RouteLink" DROP CONSTRAINT "RouteLink_stageLinkId_fkey";

-- DropForeignKey
ALTER TABLE "Stage" DROP CONSTRAINT "Stage_areaId_fkey";

-- DropForeignKey
ALTER TABLE "StageLink" DROP CONSTRAINT "StageLink_fromStageId_fkey";

-- DropForeignKey
ALTER TABLE "StageLink" DROP CONSTRAINT "StageLink_toStageId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_fromStageId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_passengerId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_toStageId_fkey";

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_tripId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_endStageId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_fleetId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_routeId_fkey";

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_startStageId_fkey";

-- DropTable
DROP TABLE "Fleet";

-- DropTable
DROP TABLE "FleetRoute";

-- DropTable
DROP TABLE "LinkPricing";

-- DropTable
DROP TABLE "Passenger";

-- DropTable
DROP TABLE "Route";

-- DropTable
DROP TABLE "RouteLink";

-- DropTable
DROP TABLE "Stage";

-- DropTable
DROP TABLE "StageLink";

-- DropTable
DROP TABLE "Ticket";

-- DropTable
DROP TABLE "Trip";

-- DropTable
DROP TABLE "VehicleType";

-- CreateTable
CREATE TABLE "vehicle_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "FleetStatus" NOT NULL DEFAULT 'ACTIVE',
    "activeFleetRouteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fleets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fleet_routes" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fleet_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passengers" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "passengers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "seatNumber" INTEGER,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "latitude" DECIMAL(65,30) NOT NULL,
    "longitude" DECIMAL(65,30) NOT NULL,
    "radiusInMeters" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_links" (
    "id" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "approximateDistanceMeters" DECIMAL(65,30) NOT NULL,
    "approximateTimeMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stage_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_pricing" (
    "id" TEXT NOT NULL,
    "stageLinkId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "routeId" TEXT,
    "day" "DayOfWeek" NOT NULL,
    "timeStart" TEXT NOT NULL,
    "timeEnd" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "link_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_classes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "service_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceClassId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_links" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "stageLinkId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "route_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "fleetId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "startStageId" TEXT NOT NULL,
    "endStageId" TEXT,
    "direction" "TraversalDirection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "voided" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_code_key" ON "vehicle_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_types_name_key" ON "vehicle_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fleets_name_key" ON "fleets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "fleets_plateNumber_key" ON "fleets"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "fleets_activeFleetRouteId_key" ON "fleets"("activeFleetRouteId");

-- CreateIndex
CREATE INDEX "fleets_operatorId_idx" ON "fleets"("operatorId");

-- CreateIndex
CREATE INDEX "fleets_status_idx" ON "fleets"("status");

-- CreateIndex
CREATE INDEX "fleets_vehicleTypeId_idx" ON "fleets"("vehicleTypeId");

-- CreateIndex
CREATE INDEX "fleet_routes_fleetId_idx" ON "fleet_routes"("fleetId");

-- CreateIndex
CREATE INDEX "fleet_routes_routeId_idx" ON "fleet_routes"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "fleet_routes_routeId_fleetId_key" ON "fleet_routes"("routeId", "fleetId");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_userId_key" ON "passengers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "passengers_contact_key" ON "passengers"("contact");

-- CreateIndex
CREATE INDEX "passengers_userId_idx" ON "passengers"("userId");

-- CreateIndex
CREATE INDEX "tickets_passengerId_idx" ON "tickets"("passengerId");

-- CreateIndex
CREATE INDEX "tickets_tripId_idx" ON "tickets"("tripId");

-- CreateIndex
CREATE INDEX "tickets_fromStageId_toStageId_idx" ON "tickets"("fromStageId", "toStageId");

-- CreateIndex
CREATE UNIQUE INDEX "stages_code_key" ON "stages"("code");

-- CreateIndex
CREATE INDEX "stages_areaId_idx" ON "stages"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "stages_areaId_name_key" ON "stages"("areaId", "name");

-- CreateIndex
CREATE INDEX "stage_links_fromStageId_idx" ON "stage_links"("fromStageId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_links_fromStageId_toStageId_key" ON "stage_links"("fromStageId", "toStageId");

-- CreateIndex
CREATE INDEX "link_pricing_stageLinkId_day_idx" ON "link_pricing"("stageLinkId", "day");

-- CreateIndex
CREATE INDEX "link_pricing_operatorId_idx" ON "link_pricing"("operatorId");

-- CreateIndex
CREATE UNIQUE INDEX "link_pricing_stageLinkId_operatorId_routeId_day_timeStart_t_key" ON "link_pricing"("stageLinkId", "operatorId", "routeId", "day", "timeStart", "timeEnd");

-- CreateIndex
CREATE UNIQUE INDEX "service_classes_code_key" ON "service_classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_classes_name_key" ON "service_classes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "routes_code_key" ON "routes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "routes_name_key" ON "routes"("name");

-- CreateIndex
CREATE INDEX "routes_serviceClassId_idx" ON "routes"("serviceClassId");

-- CreateIndex
CREATE INDEX "route_links_routeId_idx" ON "route_links"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "route_links_routeId_stageLinkId_key" ON "route_links"("routeId", "stageLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "route_links_routeId_order_key" ON "route_links"("routeId", "order");

-- AddForeignKey
ALTER TABLE "fleets" ADD CONSTRAINT "fleets_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "vehicle_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleets" ADD CONSTRAINT "fleets_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleets" ADD CONSTRAINT "fleets_activeFleetRouteId_fkey" FOREIGN KEY ("activeFleetRouteId") REFERENCES "fleet_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_routes" ADD CONSTRAINT "fleet_routes_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fleet_routes" ADD CONSTRAINT "fleet_routes_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "fleets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passengers" ADD CONSTRAINT "passengers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "passengers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "address_hierarchy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_links" ADD CONSTRAINT "stage_links_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_links" ADD CONSTRAINT "stage_links_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_pricing" ADD CONSTRAINT "link_pricing_stageLinkId_fkey" FOREIGN KEY ("stageLinkId") REFERENCES "stage_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_pricing" ADD CONSTRAINT "link_pricing_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "link_pricing" ADD CONSTRAINT "link_pricing_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_serviceClassId_fkey" FOREIGN KEY ("serviceClassId") REFERENCES "service_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_links" ADD CONSTRAINT "route_links_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_links" ADD CONSTRAINT "route_links_stageLinkId_fkey" FOREIGN KEY ("stageLinkId") REFERENCES "stage_links"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_fleetId_fkey" FOREIGN KEY ("fleetId") REFERENCES "fleets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_startStageId_fkey" FOREIGN KEY ("startStageId") REFERENCES "stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_endStageId_fkey" FOREIGN KEY ("endStageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
