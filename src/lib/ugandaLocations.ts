// Uganda location data sourced from https://github.com/Uganda-Open-Data/kalulu
// Fetched dynamically from GitHub raw URLs

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

const DISTRICTS_URL =
  'https://raw.githubusercontent.com/Uganda-Open-Data/kalulu/master/district_lookup/uganda_districts_2020.json';
const SUBCOUNTIES_URL =
  'https://raw.githubusercontent.com/Uganda-Open-Data/kalulu/master/subcounty_lookup/uganda_subcounties_2020.json';

let cachedDistricts: District[] | null = null;
let cachedSubcounties: Subcounty[] | null = null;

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
