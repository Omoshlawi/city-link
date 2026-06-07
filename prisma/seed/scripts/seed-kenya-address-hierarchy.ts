import { PrismaClient } from 'src/generated/prisma/client';
import { readCsv } from '../utils/csv';

const COUNTRY = 'KE';

interface CountyRow extends Record<string, string> {
  code: string;
  name: string;
  capital: string;
}

interface SubCountyRow extends Record<string, string> {
  code: string;
  name: string;
  county_code: string;
}

interface WardRow extends Record<string, string> {
  code: string;
  name: string;
  subcounty_code: string;
  county_code: string;
}

export default async function seedKenyaAddressHierarchy(
  prisma: PrismaClient,
): Promise<void> {
  console.log('🌍 Seeding Kenya Address Hierarchy...');

  const counties = readCsv<CountyRow>('ke-counties.csv');
  const subcounties = readCsv<SubCountyRow>('ke-subcounties.csv');
  const wards = readCsv<WardRow>('ke-wards.csv');

  // Level 1: Counties
  const countyIdByCode = new Map<string, string>();
  for (const county of counties) {
    const compositeCode = `${COUNTRY}-${county.code}`;
    const record = await prisma.addressHierarchy.upsert({
      where: { country_code: { country: COUNTRY, code: compositeCode } },
      update: { name: county.name },
      create: {
        country: COUNTRY,
        level: 1,
        code: compositeCode,
        name: county.name,
      },
    });
    countyIdByCode.set(county.code, record.id);
    console.log(`  ✓ County: ${county.name}`);
  }

  // Level 2: Sub-counties
  const subcountyIdByCode = new Map<string, string>();
  for (const sub of subcounties) {
    const compositeCode = `${COUNTRY}-${sub.county_code}-${sub.code}`;
    const parentId = countyIdByCode.get(sub.county_code)!;
    const record = await prisma.addressHierarchy.upsert({
      where: { country_code: { country: COUNTRY, code: compositeCode } },
      update: { name: sub.name, parentId },
      create: {
        country: COUNTRY,
        level: 2,
        code: compositeCode,
        name: sub.name,
        parentId,
      },
    });
    subcountyIdByCode.set(`${sub.county_code}-${sub.code}`, record.id);
  }
  console.log(`  ✓ ${subcounties.length} sub-counties seeded`);

  // Level 3: Wards
  for (const ward of wards) {
    const compositeCode = `${COUNTRY}-${ward.county_code}-${ward.subcounty_code}-${ward.code}`;
    const parentId = subcountyIdByCode.get(
      `${ward.county_code}-${ward.subcounty_code}`,
    )!;
    await prisma.addressHierarchy.upsert({
      where: { country_code: { country: COUNTRY, code: compositeCode } },
      update: { name: ward.name, parentId },
      create: {
        country: COUNTRY,
        level: 3,
        code: compositeCode,
        name: ward.name,
        parentId,
      },
    });
  }
  console.log(`  ✓ ${wards.length} wards seeded`);

  console.log('🎉 Kenya Address Hierarchy Seed Completed!');
}
