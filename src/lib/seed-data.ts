import data from "../../public/seed-data.json";

interface SeedData {
  Product: any[];
  Inventory: any[];
  Shift: any[];
  User: any[];
}

const seed: SeedData = data as SeedData;

// Re-map to match tables
export const products = seed.Product || [];
export const inventory = seed.Inventory || [];
export const shifts = seed.Shift || [];

export default { products, inventory, shifts };
