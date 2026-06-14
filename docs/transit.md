# Transit Domain

The transit domain models the core business of City Link — physical stops, routes, fleets, pricing, trips, and ticketing. The schema is split across three domain files:

- `prisma/models/transit.prisma` — Stage, StageLink, LinkPricing, Route, RouteLink, Trip
- `prisma/models/fleet.prisma` — VehicleType, Fleet, FleetRoute
- `prisma/models/ticketing.prisma` — Passenger, Ticket

---

## Core Concept: Stage Network as a Directed Graph

The transit network is modelled as a **directed graph**:

- **Stages** (bus stops / matatu stages) are **nodes**
- **StageLinks** (connections between adjacent stops) are **directed edges**
- **Routes** are named paths through the graph — defined by an ordered sequence of StageLinks
- **Trips** are vehicle runs along a route

```
[CBD] ──► [University] ──► [GPO] ──► [Railways] ──► [Rongai]
  Stage        Stage         Stage       Stage          Stage
       StageLink   StageLink     StageLink    StageLink
```

Each `StageLink` is directional — A→B and B→A are separate records, allowing asymmetric distance and time estimates.

---

## Models

### Stage

A physical pickup/drop-off point. Exists independently of any route.

| Field | Type | Description |
|---|---|---|
| `code` | `String @unique` | Short operator-defined identifier e.g. `"CBD"`, `"RONGAI"`. Set by operator, no auto-generation. |
| `name` | `String` | Human-readable display name. Unique within the same area. |
| `areaId` | `String` | FK to `AddressHierarchy` — locates the stage in the geographic hierarchy |
| `latitude` | `Decimal` | GPS latitude |
| `longitude` | `Decimal` | GPS longitude |
| `radiusInMeters` | `Int` | Geofence radius — used to detect when a fleet vehicle is at this stage |

`@@unique([areaId, name])` — name is unique within an area. The application layer must ensure all stages use a consistent hierarchy level (e.g. always ward-level) to prevent ambiguity.

---

### StageLink

A directed edge between two adjacent stages.

| Field | Type | Description |
|---|---|---|
| `fromStageId` | `String` | Origin stage |
| `toStageId` | `String` | Destination stage |
| `approximateDistanceMeters` | `Decimal` | Estimated road distance |
| `approximateTimeMinutes` | `Int` | Estimated travel time |

`@@unique([fromStageId, toStageId])` — one directed connection per pair.

A→B and B→A are stored as separate `StageLink` rows. This allows different distance/time values in each direction (one-way roads, traffic patterns).

#### REST API — `GET /stages/:id/links`

Query params:

| Param | Type | Default | Description |
|---|---|---|---|
| `direction` | `outgoing \| incoming \| both` | `outgoing` | Which edges to return relative to stage `:id` |
| `toStageId` | UUID | — | **`outgoing` only.** Filter by destination stage |
| `fromStageId` | UUID | — | **`incoming` only.** Filter by source stage |
| `includeVoided` | boolean | `false` | Include soft-deleted links |

When `direction=both` the `toStageId` and `fromStageId` params are ignored — the full neighbourhood is returned.

**Examples:**

```
# All links leaving CBD
GET /stages/cbd-id/links

# The direct link from CBD to University
GET /stages/cbd-id/links?toStageId=university-id

# All links arriving at CBD
GET /stages/cbd-id/links?direction=incoming

# The specific link arriving at CBD that originates from Railways
GET /stages/cbd-id/links?direction=incoming&fromStageId=railways-id

# All links in either direction from/to CBD
GET /stages/cbd-id/links?direction=both
```

---

### ServiceClass

Extensible Quality-of-Service classification for routes. Operators define their own classes
at runtime — no schema migration needed for new service types.

| Field | Type | Description |
|---|---|---|
| `code` | `String @unique` | Short identifier e.g. `"EXPRESS"`, `"LOCAL"`, `"PEAK"` |
| `name` | `String @unique` | Display name e.g. `"Express Service"` |
| `description` | `String?` | Optional explanation of what this service class means |

Managed at `GET/POST/PATCH/DELETE /service-classes` — requires `network: manage` permission to write, public to read.

---

### Route

A named licensed transit route. Identity only — the actual path is defined by its `RouteLinks`.

| Field | Type | Description |
|---|---|---|
| `code` | `String @unique` | Short operator code e.g. `"34"`, `"CBD-RONGAI"` |
| `name` | `String @unique` | Full display name e.g. `"CBD - Rongai"`. Globally unique. |
| `serviceClassId` | `String?` | Optional FK to `ServiceClass` — QoS level for this route |

Route has no `startStageId`/`endStageId` — those are derivable from the first and last `RouteLink`. This avoids redundant denormalized data.

#### QoS and service variants (express / local)

Express and local services on the same corridor traverse different `StageLink` sequences,
so they are modelled as separate `Route` records — each with its own `RouteLink` sequence
and a `serviceClassId` pointing to the appropriate `ServiceClass`:

```
ServiceClass "EXPRESS" → Route "34-EXPRESS"  RouteLinks: [CBD→Railways, Railways→Rongai]
ServiceClass "LOCAL"   → Route "34-LOCAL"    RouteLinks: [CBD→Univ, Univ→GPO, GPO→Railways, Railways→Rongai]
```

Benefits of this approach:
- Pricing varies by route naturally via `LinkPricing.routeId` — express can carry a higher fare
- `GET /routes?serviceClassId=<id>` retrieves all express (or local, peak, etc.) routes
- Adding a new service type in future = one `POST /service-classes`, no migration

---

### RouteLink

Ordered directed `StageLinks` that define a route's path through the network. Replaces the old `RouteStage` approach.

| Field | Type | Description |
|---|---|---|
| `routeId` | `String` | Parent route |
| `stageLinkId` | `String` | The edge used at this position |
| `order` | `Int` | 1-based position in the route sequence |

`@@unique([routeId, stageLinkId])` — a link can only appear once in a route.
`@@unique([routeId, order])` — no two positions can share the same order value.

**Why RouteLink instead of RouteStage?** Ordering at the edge level rather than the node level captures the traversal direction of each segment explicitly. Two routes can share the same stages but use different directed links between them.

#### Example: Route CBD → Rongai

```
RouteLink order=1 → StageLink [CBD → University]
RouteLink order=2 → StageLink [University → GPO]
RouteLink order=3 → StageLink [GPO → Railways]
RouteLink order=4 → StageLink [Railways → Rongai]
```

---

### LinkPricing

Fare for traversing a `StageLink`, scoped per operator, route, day, and time window.

| Field | Type | Description |
|---|---|---|
| `stageLinkId` | `String` | The link this price applies to |
| `operatorId` | `String` | FK to `Organization` — the operating company |
| `routeId` | `String?` | Optional FK to `Route` — `null` = default for all this operator's routes on this link |
| `day` | `DayOfWeek` | The day this pricing row applies to |
| `timeStart` | `String` | 24h time string e.g. `"06:00"` |
| `timeEnd` | `String` | 24h time string e.g. `"20:00"` |
| `price` | `Decimal` | Fare amount |

**One row per day.** Everyday pricing = 7 rows (one per `DayOfWeek` value). This makes the unique constraint clean and queries simple.

**Route-specific overrides.** When `routeId` is `null`, the price is the operator's default for that link. When `routeId` is set, it overrides the default for that specific route. Lookup logic:
1. Query for `stageLinkId + operatorId + routeId + day + time` (route-specific)
2. Fall back to `stageLinkId + operatorId + NULL + day + time` (operator default)

**Example — Sunday pricing vs weekday:**

```
stageLinkId=X  operatorId=Y  routeId=null  day=MONDAY     timeStart=06:00  timeEnd=20:00  price=50
stageLinkId=X  operatorId=Y  routeId=null  day=TUESDAY    timeStart=06:00  timeEnd=20:00  price=50
...
stageLinkId=X  operatorId=Y  routeId=null  day=SUNDAY     timeStart=06:00  timeEnd=20:00  price=40
```

**Example — route-specific override:**

```
stageLinkId=X  operatorId=Y  routeId=null   day=MONDAY  timeStart=06:00  timeEnd=20:00  price=50  ← default
stageLinkId=X  operatorId=Y  routeId=R33    day=MONDAY  timeStart=06:00  timeEnd=20:00  price=60  ← Route 33 override
```

---

### VehicleType

Extensible registry of vehicle types. Stored as a model (not an enum) so operators can add new types at runtime without schema migrations.

| Field | Type | Description |
|---|---|---|
| `code` | `String @unique` | Short identifier e.g. `"MATATU"`, `"BUS"` |
| `name` | `String @unique` | Display name e.g. `"Matatu"`, `"Bus"` |

Seed with common types at startup. System admins add custom types via API.

#### REST API — `/vehicle-types`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/vehicle-types` | Public | List vehicle types (paginated, searchable) |
| `GET` | `/vehicle-types/:id` | Public | Get a single vehicle type |
| `POST` | `/vehicle-types` | `network: manage` | Create a vehicle type |
| `PATCH` | `/vehicle-types/:id` | `network: manage` | Update a vehicle type |
| `DELETE` | `/vehicle-types/:id` | `network: manage` | Soft-delete (or purge with `?purge=true`) |
| `POST` | `/vehicle-types/:id/restore` | `network: manage` | Restore a soft-deleted vehicle type |

---

### Fleet

A vehicle registered on the transit network, owned by an operator organisation.

| Field | Type | Description |
|---|---|---|
| `name` | `String @unique` | Vehicle name |
| `vehicleTypeId` | `String` | FK to `VehicleType` |
| `capacity` | `Int` | Passenger capacity |
| `plateNumber` | `String @unique` | License plate |
| `operatorId` | `String` | FK to `Organization` — owning company |
| `status` | `FleetStatus` | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| `activeFleetRouteId` | `String? @unique` | FK to `FleetRoute` — the currently active route assignment |

**Active route enforcement:** `activeFleetRouteId` is `@unique`, which means at the DB level only one `FleetRoute` can be the active assignment for any fleet vehicle. Changing a vehicle's active route = one update to `Fleet.activeFleetRouteId`.

---

### FleetRoute

Assignment of a fleet vehicle to a route.

| Field | Type | Description |
|---|---|---|
| `routeId` | `String` | The route |
| `fleetId` | `String` | The vehicle |

`@@unique([routeId, fleetId])` — a vehicle can only be assigned to a route once. The active assignment is tracked on `Fleet.activeFleetRouteId`, not on `FleetRoute` itself (no `isActive` field).

---

### Trip

A single vehicle run along a route.

| Field | Type | Description |
|---|---|---|
| `fleetId` | `String` | The vehicle |
| `routeId` | `String` | The route being served |
| `startStageId` | `String` | Where the trip began — may be mid-route, not necessarily the terminal |
| `endStageId` | `String?` | Populated when the trip ends |
| `direction` | `TraversalDirection` | `FORWARD` or `BACKWARD` along the route's ordered links |
| `endedAt` | `DateTime?` | Populated when the trip ends |

A trip is open (active) when `endedAt` is `null`.

---

### Passenger

Represents someone who boards a vehicle. May or may not be a registered user.

| Field | Type | Description |
|---|---|---|
| `userId` | `String? @unique` | FK to `User` — present when the passenger has an account |
| `name` | `String` | Display name |
| `contact` | `String @unique` | Phone or email — used to identify walk-in passengers |

A registered user's passenger profile is linked via `userId`. Anonymous or walk-in passengers have `userId = null` and are identified by `contact`.

---

### Ticket

A passenger's fare record for a trip segment between two stages.

| Field | Type | Description |
|---|---|---|
| `passengerId` | `String` | FK to `Passenger` |
| `tripId` | `String` | FK to `Trip` |
| `fromStageId` | `String` | Where the passenger boarded |
| `toStageId` | `String` | Where the passenger alighted (or intends to) |
| `price` | `Decimal` | Fare charged |
| `seatNumber` | `Int?` | Optional fixed seat assignment |
| `paymentStatus` | `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |

---

## Enum Reference

| Enum | Values |
|---|---|
| `TraversalDirection` | `FORWARD`, `BACKWARD` |
| `DayOfWeek` | `MONDAY` → `SUNDAY` |
| `FleetStatus` | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` |

---

## Key Relationships

```
Organization
    ├── Fleet (operatorId)
    │     ├── FleetRoute (fleetId)    ←── Route
    │     │     └── Trip (routeId)
    │     │           └── Ticket (tripId)
    │     │                 └── Passenger (passengerId)
    │     └── LinkPricing (operatorId)
    │
Route
    ├── RouteLink (routeId)  ──►  StageLink  ──►  Stage
    └── LinkPricing (routeId, optional)

Stage
    ├── StageLink "from" (fromStageId)
    ├── StageLink "to" (toStageId)
    ├── Trip.startStage / Trip.endStage
    └── Ticket.fromStage / Ticket.toStage
```
