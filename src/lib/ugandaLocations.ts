// Uganda location data sourced from:
// Districts & Subcounties: https://github.com/Uganda-Open-Data/kalulu
// Parishes: https://github.com/emugabi/ug-district-data

export interface District {
  district_code: number;
  district_name: string;
  region_code: number;
  region_name: string;
}

export interface Subcounty {
  subcounty_code: number;
  subcounty_name: string;
  district_code: number;
  district_name: string;
  constituency_code: number;
  constituency_name: string;
}

export interface ParishEntry {
  DISTRICT: string;
  CONSTITUENCY: string;
  SUBCOUNTY: string;
  PARISH: string;
}

const DISTRICTS_URL =
  'https://raw.githubusercontent.com/Uganda-Open-Data/kalulu/master/district_lookup/uganda_districts_2020.json';
const SUBCOUNTIES_URL =
  'https://raw.githubusercontent.com/Uganda-Open-Data/kalulu/master/subcounty_lookup/uganda_subcounties_2020.json';
const PARISHES_URL =
  'https://raw.githubusercontent.com/emugabi/ug-district-data/master/data.json';

let cachedDistricts: District[] | null = null;
let cachedSubcounties: Subcounty[] | null = null;
let cachedParishes: ParishEntry[] | null = null;

export async function fetchDistricts(): Promise<District[]> {
  if (cachedDistricts) return cachedDistricts;
  const res = await fetch(DISTRICTS_URL);
  const data: District[] = await res.json();
  cachedDistricts = data.sort((a, b) =>
    a.district_name.localeCompare(b.district_name)
  );
  return cachedDistricts;
}

export async function fetchSubcounties(): Promise<Subcounty[]> {
  if (cachedSubcounties) return cachedSubcounties;
  const res = await fetch(SUBCOUNTIES_URL);
  const data: Subcounty[] = await res.json();
  cachedSubcounties = data;
  return cachedSubcounties;
}

export async function fetchSubcountiesForDistrict(
  districtCode: number
): Promise<Subcounty[]> {
  const all = await fetchSubcounties();
  return all
    .filter((s) => s.district_code === districtCode)
    .sort((a, b) => a.subcounty_name.localeCompare(b.subcounty_name));
}

async function fetchAllParishes(): Promise<ParishEntry[]> {
  if (cachedParishes) return cachedParishes;
  const res = await fetch(PARISHES_URL);
  const json = await res.json();
  cachedParishes = json.data || json;
  return cachedParishes!;
}

export async function fetchParishesForSubcounty(
  districtName: string,
  subcountyName: string
): Promise<string[]> {
  const all = await fetchAllParishes();
  const dNorm = districtName.toUpperCase().trim();
  const sNorm = subcountyName.toUpperCase().trim();
  const parishes = all
    .filter((p) => p.DISTRICT === dNorm && p.SUBCOUNTY === sNorm)
    .map((p) => p.PARISH);
  // deduplicate and sort
  return [...new Set(parishes)].sort();
}
