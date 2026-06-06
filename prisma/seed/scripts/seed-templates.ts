/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaClient } from 'src/generated/prisma/client';
import { readCsv, buildSlots, parseJsonField } from '../utils/csv';

interface CsvRow {
  key: string;
  type: string;
  name: string;
  description: string;
  engine: string;
  schema: string;
  metadata: string;
  [slotCol: string]: string;
}

export default async function seedTemplates(
  prisma: PrismaClient,
): Promise<void> {
  const rows = readCsv<CsvRow>('templates.csv');

  console.log(`Seeding ${rows.length} system templates from CSV...`);

  for (const row of rows) {
    if (!row.key) {
      console.warn('  ⚠ Skipping row with empty key');
      continue;
    }

    const slots = buildSlots(row);
    const schema = parseJsonField<object | null>(row.schema, null);
    const metadata = parseJsonField<object | null>(row.metadata, null);

    const jsonField = (v: object | null): any => v;

    await prisma.template.upsert({
      where: { key: row.key },
      update: {
        name: row.name,
        description: row.description || null,
        slots,
        schema: jsonField(schema),
        metadata: jsonField(metadata),
      },
      create: {
        key: row.key,
        type: row.type,
        name: row.name,
        description: row.description || null,
        engine: (row.engine as 'HANDLEBARS') || 'HANDLEBARS',
        slots,
        schema: jsonField(schema),
        metadata: jsonField(metadata),
      },
    });

    console.log(`  ✓ ${row.key} (${Object.keys(slots).join(', ')})`);
  }

  console.log('🎉 Templates Seed Completed!');
}
