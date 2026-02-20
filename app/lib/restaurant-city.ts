import { MARKET_CITIES } from "@/lib/market-cities";

export const FALLBACK_CITY_LABEL = "Other locations";

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function inferRestaurantCity(address?: string | null): string {
  const normalizedAddress = normalizeText(address || "");

  if (normalizedAddress) {
    for (const city of MARKET_CITIES) {
      if (city.aliases.some((alias) => normalizedAddress.includes(normalizeText(alias)))) {
        return city.name;
      }
    }
  }

  const addressParts = (address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (addressParts.length >= 2) {
    return addressParts[addressParts.length - 2];
  }

  if (addressParts.length === 1) {
    return addressParts[0];
  }

  return FALLBACK_CITY_LABEL;
}
