// Uganda location data stored locally from:
// Districts & Subcounties: https://github.com/Uganda-Open-Data/kalulu
// Parishes: https://github.com/emugabi/ug-district-data

import districtsData from "@/data/uganda_districts.json";
import subcountiesData from "@/data/uganda_subcounties.json";
import parishesData from "@/data/uganda_parishes.json";

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

const districts: District[] = (districtsData as District[]).sort((a, b) =>
  a.district_name.localeCompare(b.district_name)
);

const subcounties: Subcounty[] = subcountiesData as Subcounty[];

const parishes: ParishEntry[] = (parishesData as any).data || parishesData;

export function fetchDistricts(): Promise<District[]> {
  return Promise.resolve(districts);
}

export function fetchSubcounties(): Promise<Subcounty[]> {
  return Promise.resolve(subcounties);
}

export function fetchSubcountiesForDistrict(
  districtCode: number
): Promise<Subcounty[]> {
  const filtered = subcounties
    .filter((s) => s.district_code === districtCode)
    .sort((a, b) => a.subcounty_name.localeCompare(b.subcounty_name));
  return Promise.resolve(filtered);
}

export function fetchParishesForSubcounty(
  districtName: string,
  subcountyName: string
): Promise<string[]> {
  const dNorm = districtName.toUpperCase().trim();
  const sNorm = subcountyName.toUpperCase().trim();
  const result = parishes
    .filter((p) => p.DISTRICT === dNorm && p.SUBCOUNTY === sNorm)
    .map((p) => p.PARISH);
  return Promise.resolve([...new Set(result)].sort());
}
