export interface PantryItem {
  id: string;
  name: string;
  category: 'pulses_legumes' | 'grains_flours' | 'seeds_nuts' | 'fresh_produce' | 'dairy_alternatives' | 'spices_others';
  quantity: number;
  unit: string;
  isShelfStable: boolean;
  notes?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
  goal: 'fat_loss' | 'muscle_gain' | 'maintenance' | 'budget_planning';
  proteinTargetGrams: number;
  calorieTargetKcal: number;
  allergies: string[];
  dietaryPreferences: string;
  dailyBudgetInr: number;
}

export interface FamilyMemberProfile extends UserProfile {
  id: string;
  isDefault?: boolean;
  avatarColor?: string;
}

export interface EatenDayRecord {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  memberId: string;
  mealsEaten: {
    breakfast: boolean;
    lunch: boolean;
    eveningSnack: boolean;
    dinner: boolean;
  };
  pantryDeducted: boolean;
}

export type PricingTier = 'mandi' | 'quick_commerce' | 'supermarket';

export interface Meal {
  id: string;
  name: string;
  type: 'Breakfast' | 'Lunch' | 'Evening Snack' | 'Dinner';
  portion: string;
  caloriesKcal: number;
  proteinGrams: number;
  fiberGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  ingredients: string[];
  preparationNotes: string;
  isZeroAddedSugar: boolean;
  usesPantryStock: boolean;
}

export interface DayPlan {
  dayNumber: number;
  dayName: string;
  breakfast: Meal;
  lunch: Meal;
  eveningSnack: Meal;
  dinner: Meal;
  totalProteinGrams: number;
  totalCaloriesKcal: number;
  totalFiberGrams?: number;
}

export interface ShoppingListItem {
  item: string;
  quantityNeeded: string;
  estimatedCostInr: number;
  category: string;
  reason: string;
}

export interface WeeklyMealPlan {
  planTitle: string;
  summary: string;
  generatedAt?: string;
  targetProteinGrams: number;
  targetCaloriesKcal: number;
  dailyBudgetInr: number;
  totalWeeklyCostInr: number;
  days: DayPlan[];
  shoppingList: ShoppingListItem[];
  nutritionistNotes: string;
  allergenWarnings: string[];
  icmrComplianceScore: number; // 0-100
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickAction?: string;
}

export interface SubstitutionResult {
  originalItem: string;
  substituteItem: string;
  portionAdjustment: string;
  recipeAdjustment: string;
  nutritionalImpact: string;
  allergenSafetyCheck: string;
}
