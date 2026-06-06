import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'csv-parse/sync';

/**
 * Reads and parses a CSV file from the seed data directory.
 * Pass the filename only (e.g. "templates.csv") — resolves to prisma/seed/data/<file>.
 */
export function readCsv<T extends Record<string, string>>(
  filename: string,
): T[] {
  const csvPath = path.join(__dirname, '..', 'data', filename);
  const content = fs.readFileSync(csvPath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  }) as T[];
}

/**
 * Resolves a cell value that may use a file: or text: directive.
 *
 *   file:<path>  — reads the file at <path> relative to prisma/seed/
 *   text:<value> — returns <value> as-is (strips the prefix)
 *   <bare value> — treated as plain text
 */
export function resolveRef(raw: string): string {
  if (!raw?.trim()) return '';

  if (raw.startsWith('file:')) {
    const filePath = path.join(__dirname, '..', raw.slice(5).trim());
    if (!fs.existsSync(filePath)) {
      throw new Error(`Seed file not found: ${filePath}`);
    }
    return fs.readFileSync(filePath, 'utf-8').trim();
  }

  if (raw.startsWith('text:')) {
    return raw.slice(5);
  }

  return raw;
}

/**
 * Collects all slot_* columns from a CSV row into a { slotName: value } map,
 * resolving any file:/text: directives in the process.
 */
export function buildSlots(
  row: Record<string, string>,
): Record<string, string> {
  const slots: Record<string, string> = {};
  for (const [col, value] of Object.entries(row)) {
    if (col.startsWith('slot_') && value?.trim()) {
      const resolved = resolveRef(value);
      if (resolved) slots[col.replace(/^slot_/, '')] = resolved;
    }
  }
  return slots;
}

/**
 * Safely parses a JSON string, returning fallback on empty input or parse failure.
 */
export function parseJsonField<T>(raw: string, fallback: T): T {
  if (!raw?.trim()) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    console.warn(`  ⚠ Invalid JSON (using fallback): ${raw.slice(0, 60)}...`);
    return fallback;
  }
}
