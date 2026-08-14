import { UserProfile, PantryItem, WeeklyMealPlan, Meal } from '../types';

export interface BookmarkedMeal extends Meal {
  id: string;
  dayName?: string;
  dayNumber?: number;
  mealSlot: string; // e.g., 'Breakfast', 'Lunch', 'Snack', 'Dinner'
  bookmarkedAt: string;
}

export interface SavedPlanHistory {
  id: string;
  userName?: string;
  generatedAt: string;
  targetCaloriesKcal: number;
  targetProteinGrams: number;
  totalWeeklyCostInr: number;
  plan: WeeklyMealPlan;
}

// --- Cookie Helper Utilities ---
export function setCookie(name: string, value: string, days: number = 30) {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  } catch (err) {
    console.warn('[Storage] Cookie write error:', err);
  }
}

export function getCookie(name: string): string | null {
  try {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  } catch (err) {
    console.warn('[Storage] Cookie read error:', err);
  }
  return null;
}

// --- Dual Persistence Layer (Cookies + localStorage) ---

// 1. User Profile
export function saveUserProfileStorage(profile: UserProfile): void {
  const jsonStr = JSON.stringify(profile);
  setCookie('nutriplan_profile', jsonStr, 30);
  try {
    localStorage.setItem('nutriplan_profile', jsonStr);
  } catch (e) {
    console.warn('localStorage error', e);
  }
}

export function loadUserProfileStorage(): UserProfile | null {
  try {
    const cookieData = getCookie('nutriplan_profile');
    if (cookieData) return JSON.parse(cookieData);
    const localData = localStorage.getItem('nutriplan_profile');
    if (localData) return JSON.parse(localData);
  } catch (err) {
    console.warn('[Storage] Error loading profile:', err);
  }
  return null;
}

// 2. Weekly Meal Plan
export function saveMealPlanStorage(plan: WeeklyMealPlan): void {
  const jsonStr = JSON.stringify(plan);
  // Store full plan in localStorage
  try {
    localStorage.setItem('nutriplan_meal_plan', jsonStr);
  } catch (e) {
    console.warn('localStorage error', e);
  }

  // Store metadata / compressed summary in cookie to fit within cookie size limits
  const summary = {
    generatedAt: plan.generatedAt || new Date().toISOString(),
    daysCount: plan.days?.length || 0,
    targetCaloriesKcal: plan.targetCaloriesKcal,
    targetProteinGrams: plan.targetProteinGrams,
    totalWeeklyCostInr: plan.totalWeeklyCostInr,
  };
  setCookie('nutriplan_meal_plan_meta', JSON.stringify(summary), 30);
  // Try storing full plan in cookie if short enough
  if (jsonStr.length < 3800) {
    setCookie('nutriplan_meal_plan', jsonStr, 30);
  }
}

export function loadMealPlanStorage(): WeeklyMealPlan | null {
  try {
    const localData = localStorage.getItem('nutriplan_meal_plan');
    if (localData) return JSON.parse(localData);

    const cookieData = getCookie('nutriplan_meal_plan');
    if (cookieData) return JSON.parse(cookieData);
  } catch (err) {
    console.warn('[Storage] Error loading meal plan:', err);
  }
  return null;
}

// 3. Pantry Inventory / Grocery Details
export function saveInventoryStorage(inventory: PantryItem[]): void {
  const jsonStr = JSON.stringify(inventory);
  setCookie('nutriplan_inventory', jsonStr, 30);
  try {
    localStorage.setItem('nutriplan_inventory', jsonStr);
  } catch (e) {
    console.warn('localStorage error', e);
  }
}

export function loadInventoryStorage(): PantryItem[] | null {
  try {
    const cookieData = getCookie('nutriplan_inventory');
    if (cookieData) return JSON.parse(cookieData);
    const localData = localStorage.getItem('nutriplan_inventory');
    if (localData) return JSON.parse(localData);
  } catch (err) {
    console.warn('[Storage] Error loading inventory:', err);
  }
  return null;
}

// 4. Bookmarked / Favorite Meals
export function saveFavoritesStorage(favorites: BookmarkedMeal[]): void {
  const jsonStr = JSON.stringify(favorites);
  setCookie('nutriplan_favorites', jsonStr, 30);
  try {
    localStorage.setItem('nutriplan_favorites', jsonStr);
  } catch (e) {
    console.warn('localStorage error', e);
  }
}

export function loadFavoritesStorage(): BookmarkedMeal[] {
  try {
    const cookieData = getCookie('nutriplan_favorites');
    if (cookieData) return JSON.parse(cookieData);
    const localData = localStorage.getItem('nutriplan_favorites');
    if (localData) return JSON.parse(localData);
  } catch (err) {
    console.warn('[Storage] Error loading favorites:', err);
  }
  return [];
}

// 5. Meal Plan History (JSON Format)
export function saveMealPlanHistoryStorage(history: SavedPlanHistory[]): void {
  const jsonStr = JSON.stringify(history);
  try {
    localStorage.setItem('nutriplan_plan_history', jsonStr);
  } catch (e) {
    console.warn('localStorage error', e);
  }
  // Store history count in cookie
  setCookie('nutriplan_history_count', String(history.length), 30);
}

export function loadMealPlanHistoryStorage(): SavedPlanHistory[] {
  try {
    const localData = localStorage.getItem('nutriplan_plan_history');
    if (localData) return JSON.parse(localData);
  } catch (err) {
    console.warn('[Storage] Error loading plan history:', err);
  }
  return [];
}

export function addPlanToHistory(plan: WeeklyMealPlan, userName?: string): SavedPlanHistory[] {
  const currentHistory = loadMealPlanHistoryStorage();
  const newEntry: SavedPlanHistory = {
    id: `plan_${Date.now()}`,
    userName: userName?.trim() || 'User',
    generatedAt: plan.generatedAt || new Date().toISOString(),
    targetCaloriesKcal: plan.targetCaloriesKcal,
    targetProteinGrams: plan.targetProteinGrams,
    totalWeeklyCostInr: plan.totalWeeklyCostInr,
    plan,
  };
  // Keep last 10 generated plans in history
  const updatedHistory = [newEntry, ...currentHistory.filter(h => h.id !== newEntry.id)].slice(0, 10);
  saveMealPlanHistoryStorage(updatedHistory);
  return updatedHistory;
}
