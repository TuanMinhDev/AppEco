import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const PROVINCES_OPEN_API = 'https://provinces.open-api.vn/api';

export interface LocationItem {
  code: number;
  name: string;
}

export const vietnamLocationKeys = {
  provinces: ['vietnam-locations', 'provinces'] as const,
  districts: (provinceCode: number) =>
    ['vietnam-locations', 'districts', provinceCode] as const,
  wards: (districtCode: number) => ['vietnam-locations', 'wards', districtCode] as const,
};

async function fetchProvinces(): Promise<LocationItem[]> {
  const { data } = await axios.get<LocationItem[]>(
    `${PROVINCES_OPEN_API}/?depth=1`,
  );
  return data;
}

async function fetchDistricts(provinceCode: number): Promise<LocationItem[]> {
  const { data } = await axios.get<{ districts: LocationItem[] }>(
    `${PROVINCES_OPEN_API}/p/${provinceCode}?depth=2`,
  );
  return data.districts;
}

async function fetchWards(districtCode: number): Promise<LocationItem[]> {
  const { data } = await axios.get<{ wards: LocationItem[] }>(
    `${PROVINCES_OPEN_API}/d/${districtCode}?depth=2`,
  );
  return data.wards;
}

export function useProvincesQuery() {
  return useQuery({
    queryKey: vietnamLocationKeys.provinces,
    queryFn: fetchProvinces,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

export function useDistrictsQuery(provinceCode: number | null | undefined) {
  return useQuery({
    queryKey: vietnamLocationKeys.districts(provinceCode ?? 0),
    queryFn: () => fetchDistricts(provinceCode!),
    enabled: typeof provinceCode === 'number' && provinceCode > 0,
  });
}

export function useWardsQuery(districtCode: number | null | undefined) {
  return useQuery({
    queryKey: vietnamLocationKeys.wards(districtCode ?? 0),
    queryFn: () => fetchWards(districtCode!),
    enabled: typeof districtCode === 'number' && districtCode > 0,
  });
}
