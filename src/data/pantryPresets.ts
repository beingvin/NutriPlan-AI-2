import { PantryItem, UserProfile } from '../types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  age: 35,
  gender: 'male',
  heightCm: 168,
  weightKg: 72,
  activityLevel: 'sedentary',
  goal: 'fat_loss',
  proteinTargetGrams: 80,
  calorieTargetKcal: 1600,
  allergies: [],
  dietaryPreferences: 'Vegetarian, strict zero added sugar, high pulse/soya protein',
  dailyBudgetInr: 175, // ₹150 - ₹200 range
};

export const PRESET_FULL_PANTRY: PantryItem[] = [
  { id: '1', name: 'Onions', category: 'fresh_produce', quantity: 5, unit: 'pcs', isShelfStable: false },
  { id: '2', name: 'Tomatoes', category: 'fresh_produce', quantity: 4, unit: 'pcs', isShelfStable: false },
  { id: '3', name: 'Carrots', category: 'fresh_produce', quantity: 2, unit: 'pcs', isShelfStable: false },
  { id: '4', name: 'Cucumber', category: 'fresh_produce', quantity: 2, unit: 'pcs', isShelfStable: false },
  { id: '5', name: 'Sprouted Moong/Chana', category: 'pulses_legumes', quantity: 250, unit: 'g', isShelfStable: false },
  { id: '6', name: 'Soya Chunks', category: 'pulses_legumes', quantity: 500, unit: 'g', isShelfStable: true },
  { id: '7', name: 'Toor Dal (Arhar)', category: 'pulses_legumes', quantity: 500, unit: 'g', isShelfStable: true },
  { id: '8', name: 'Moong Dal (Yellow)', category: 'pulses_legumes', quantity: 500, unit: 'g', isShelfStable: true },
  { id: '9', name: 'Roasted Chana (Bhuna Chana)', category: 'pulses_legumes', quantity: 300, unit: 'g', isShelfStable: true },
  { id: '10', name: 'Muesli (Unsweetened)', category: 'grains_flours', quantity: 400, unit: 'g', isShelfStable: true },
  { id: '11', name: 'Rice (Basmati/Raw)', category: 'grains_flours', quantity: 2000, unit: 'g', isShelfStable: true },
  { id: '12', name: 'Wheat Atta (Whole Grain)', category: 'grains_flours', quantity: 1500, unit: 'g', isShelfStable: true },
  { id: '13', name: 'Chia Seeds', category: 'seeds_nuts', quantity: 100, unit: 'g', isShelfStable: true },
  { id: '14', name: 'Flax Seeds', category: 'seeds_nuts', quantity: 100, unit: 'g', isShelfStable: true },
  { id: '15', name: 'Almonds', category: 'seeds_nuts', quantity: 150, unit: 'g', isShelfStable: true },
  { id: '16', name: 'Bananas', category: 'fresh_produce', quantity: 6, unit: 'pcs', isShelfStable: false },
  { id: '17', name: 'Guava / Seasonal Fruit', category: 'fresh_produce', quantity: 4, unit: 'pcs', isShelfStable: false },
  { id: '18', name: 'Cow Milk / Toned Milk', category: 'dairy_alternatives', quantity: 1, unit: 'L', isShelfStable: false },
  { id: '19', name: 'Curd / Dahi', category: 'dairy_alternatives', quantity: 400, unit: 'g', isShelfStable: false },
  { id: '20', name: 'Besan (Gram Flour)', category: 'grains_flours', quantity: 300, unit: 'g', isShelfStable: true },
];

export const PRESET_LOW_STOCK: PantryItem[] = [
  { id: '1', name: 'Onions', category: 'fresh_produce', quantity: 2, unit: 'pcs', isShelfStable: false },
  { id: '2', name: 'Tomatoes', category: 'fresh_produce', quantity: 2, unit: 'pcs', isShelfStable: false },
  { id: '3', name: 'Soya Chunks', category: 'pulses_legumes', quantity: 200, unit: 'g', isShelfStable: true },
  { id: '4', name: 'Toor Dal', category: 'pulses_legumes', quantity: 300, unit: 'g', isShelfStable: true },
  { id: '5', name: 'Moong Dal', category: 'pulses_legumes', quantity: 200, unit: 'g', isShelfStable: true },
  { id: '6', name: 'Rice', category: 'grains_flours', quantity: 1000, unit: 'g', isShelfStable: true },
  { id: '7', name: 'Atta', category: 'grains_flours', quantity: 1000, unit: 'g', isShelfStable: true },
  { id: '8', name: 'Roasted Peanuts', category: 'seeds_nuts', quantity: 150, unit: 'g', isShelfStable: true },
  { id: '9', name: 'Muesli (Unsweetened)', category: 'grains_flours', quantity: 200, unit: 'g', isShelfStable: true },
  { id: '10', name: 'Chia Seeds', category: 'seeds_nuts', quantity: 50, unit: 'g', isShelfStable: true },
];

export const PRESET_HIGH_PROTEIN: PantryItem[] = [
  ...PRESET_FULL_PANTRY,
  { id: '21', name: 'Paneer / Tofu', category: 'dairy_alternatives', quantity: 250, unit: 'g', isShelfStable: false },
  { id: '22', name: 'Sprouted Kala Chana', category: 'pulses_legumes', quantity: 300, unit: 'g', isShelfStable: false },
  { id: '23', name: 'Plant Protein Powder (Unflavored)', category: 'pulses_legumes', quantity: 300, unit: 'g', isShelfStable: true },
];

export const BENCHMARK_PRICES_INR: Record<string, { pricePerKgOrL: number; defaultUnit: string }> = {
  'Rice': { pricePerKgOrL: 45, defaultUnit: 'kg' },
  'Atta': { pricePerKgOrL: 37, defaultUnit: 'kg' },
  'Toor Dal': { pricePerKgOrL: 122, defaultUnit: 'kg' },
  'Moong Dal': { pricePerKgOrL: 110, defaultUnit: 'kg' },
  'Gram Dal / Chana': { pricePerKgOrL: 86, defaultUnit: 'kg' },
  'Soya Chunks': { pricePerKgOrL: 110, defaultUnit: 'kg' },
  'Milk': { pricePerKgOrL: 61, defaultUnit: 'L' },
  'Onion': { pricePerKgOrL: 36, defaultUnit: 'kg' },
  'Tomato': { pricePerKgOrL: 38, defaultUnit: 'kg' },
  'Bananas': { pricePerKgOrL: 50, defaultUnit: 'dozen' },
  'Almonds': { pricePerKgOrL: 700, defaultUnit: 'kg' },
  'Chia Seeds': { pricePerKgOrL: 300, defaultUnit: 'kg' },
};
