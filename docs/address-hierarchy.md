# Address Hierarchy

The address hierarchy provides a country-agnostic model for administrative geographic divisions. It replaces the original Kenya-specific county/subcounty/ward model with a generic tree structure that works for any country.

---

## The `AddressHierarchy` Model

```
AddressHierarchy
├── id          String @id        — UUID
├── country     String            — ISO 3166-1 alpha-2 country code e.g. "KE", "UG", "TZ"
├── level       Int               — depth in the hierarchy (1 = top, 5 = most granular)
├── parentId    String?           — FK to parent AddressHierarchy row (null = root)
├── code        String            — unique code within the country e.g. "KE-30"
├── name        String            — English display name e.g. "Nairobi"
├── nameLocal   String?           — local language name e.g. "Nairobi" (Swahili)
└── voided      Boolean
```

`@@unique([country, code])` — each administrative division has a unique code within its country.

---

## Tree Structure

The hierarchy is a self-referential tree:

```
AddressHierarchy (level=1, parentId=null)   ← Country
    └── AddressHierarchy (level=2)          ← State / County
            └── AddressHierarchy (level=3)  ← District / Sub-county
                    └── AddressHierarchy (level=4)  ← Division / Ward
                            └── AddressHierarchy (level=5)  ← Village / Sub-location
```

Root nodes have `parentId = null`. To trace a location up the hierarchy, follow `parentId` links until you reach `parentId = null`.

---

## Level Convention

Levels are integers (1–5). What each level represents depends on the country:

| Level | Kenya | Uganda | Tanzania |
|---|---|---|---|
| 1 | Country | Country | Country |
| 2 | County | District | Region |
| 3 | Sub-county | County | District |
| 4 | Ward | Sub-county | Ward |
| 5 | Village / Sublocation | Parish | Village |

The application enforces no specific meaning per level — the data defines what each level means for each country.

---

## Example: Kenya

```
KE (level=1, code="KE")
└── Nairobi (level=2, code="KE-30")
    ├── Westlands (level=3, code="KE-30-01")
    │   ├── Parklands (level=4, code="KE-30-01-01")
    │   └── Highridge (level=4, code="KE-30-01-02")
    └── Starehe (level=3, code="KE-30-02")
        ├── Nairobi Central (level=4, code="KE-30-02-01")
        └── Pangani (level=4, code="KE-30-02-02")
```

---

## How `Stage` Uses It

Every `Stage` has an `areaId` pointing to an `AddressHierarchy` row:

```prisma
model Stage {
    areaId String
    area   AddressHierarchy @relation(fields: [areaId], references: [id])
}
```

This means:
- A stage at "Westlands" roundabout → `areaId` = the Westlands `AddressHierarchy` row
- To know which county a stage is in → follow `stage.area.parent.parent` up the tree
- To list all stages in Nairobi → query `AddressHierarchy` for the Nairobi subtree, collect IDs, filter `Stage.areaId IN [...]`

**Consistency rule:** All stages should reference the same hierarchy level (e.g. always ward-level). The application layer enforces this — the schema allows any level but mixing levels breaks the `@@unique([areaId, name])` constraint's meaning.

---

## Seeding Address Hierarchies

Hierarchies are typically seeded from official government datasets (e.g. Kenya National Bureau of Statistics shapefiles, GADM data).

Add a seeder in `prisma/seed/scripts/seed-address-hierarchy.ts`:

```ts
import { PrismaClient } from '../../src/generated/prisma';

export default async function seedAddressHierarchy(prisma: PrismaClient): Promise<void> {
  // Upsert from your data source
  await prisma.addressHierarchy.upsert({
    where: { country_code: { country: 'KE', code: 'KE-30' } },
    create: {
      country: 'KE',
      level: 2,
      code: 'KE-30',
      name: 'Nairobi',
      nameLocal: 'Nairobi',
      parent: { connect: { country_code: { country: 'KE', code: 'KE' } } },
    },
    update: { name: 'Nairobi' },
  });
}
```

---

## AddressHierarchyModule

`src/address-hierarchy/` exposes CRUD endpoints for managing hierarchy data:

| Method | Path | Description |
|---|---|---|
| `GET` | `/address-hierarchy` | List nodes (filter by country, level, parentId) |
| `GET` | `/address-hierarchy/:id` | Get a single node |
| `POST` | `/address-hierarchy` | Create a node |
| `PATCH` | `/address-hierarchy/:id` | Update a node |
| `DELETE` | `/address-hierarchy/:id` | Void a node |
