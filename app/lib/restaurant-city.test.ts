import { describe, expect, it } from "vitest";
import { FALLBACK_CITY_LABEL, inferRestaurantCity } from "./restaurant-city";

describe("inferRestaurantCity", () => {
  it("detects known market city from accented address", () => {
    expect(inferRestaurantCity("166 Ha Ky Ngo, Son Tra, Đà Nẵng, Việt Nam")).toBe("Da Nang");
  });

  it("detects Ho Chi Minh City from Saigon alias", () => {
    expect(inferRestaurantCity("District 1, Saigon, Vietnam")).toBe("Ho Chi Minh City");
  });

  it("falls back to second-to-last address segment when city is not in market aliases", () => {
    expect(inferRestaurantCity("123 Main Street, Riverside District, Atlantis, Vietnam")).toBe("Atlantis");
  });

  it("returns fallback label for empty address", () => {
    expect(inferRestaurantCity("")).toBe(FALLBACK_CITY_LABEL);
  });
});
