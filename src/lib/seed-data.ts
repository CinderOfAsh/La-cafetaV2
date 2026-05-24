import data from "../../public/seed-data.json";

interface SeedData {
  Product: any[];
  Inventory: any[];
  ProductIngredient: any[];
  Shift: any[];
  User: any[];
}

const seed: SeedData = data as SeedData;

export const products = seed.Product || [];
export const inventory = seed.Inventory || [];
export const productIngredients = seed.ProductIngredient || [];
export const shifts = seed.Shift || [];

export default { products, inventory, productIngredients, shifts };
