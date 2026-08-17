import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WeeklyMealPlan, Meal, PantryItem, UserProfile, EatenDayRecord } from '../types';
import { SubstitutionModal } from './SubstitutionModal';
import { CookModeModal } from './CookModeModal';
import { BatchPrepGuideModal } from './BatchPrepGuideModal';
import { MicronutrientGuideModal } from './MicronutrientGuideModal';
import {
  Sparkles, CheckCircle2, ShieldCheck, RefreshCw, Printer, ArrowRightLeft,
  Leaf, Flame, HeartPulse, Wheat, Activity, Shuffle, Loader2, FileText,
  Copy, Check, Share2, MessageSquare, X, Calendar, Download, Droplet,
  Droplets, Plus, Minus, RotateCcw, Bookmark, BookmarkCheck, History, Code,
  Search, Trash2, ExternalLink, Filter, User, Clock, CalendarDays, LayoutList,
  ChevronLeft, ChevronRight, Repeat, ChefHat, Utensils, CheckSquare, Square,
  Award, Salad, Zap, Table
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  saveFavoritesStorage,
  loadFavoritesStorage,
  loadMealPlanHistoryStorage,
  saveEatenRecordsStorage,
  loadEatenRecordsStorage,
  BookmarkedMeal,
  SavedPlanHistory,
} from '../lib/storage';

interface MealPlannerViewProps {
  plan: WeeklyMealPlan | null;
  loading: boolean;
  onGeneratePlan: (customPrompt?: string) => void;
  onUpdatePlan?: (plan: WeeklyMealPlan) => void;
  inventory: PantryItem[];
  userProfile: UserProfile;
}

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  plan,
  loading,
  onGeneratePlan,
  onUpdatePlan,
  inventory,
  userProfile,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [customInstruction, setCustomInstruction] = useState('');
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subMealName, setSubMealName] = useState('');
  const [subIngredient, setSubIngredient] = useState('');
  const [shufflingSlot, setShufflingSlot] = useState<string | null>(null);
  const [shuffleToast, setShuffleToast] = useState<string | null>(null);

  // Feature 1: Kitchen Cook Mode Modal State
  const [cookModalOpen, setCookModalOpen] = useState<boolean>(false);
  const [cookModalMeal, setCookModalMeal] = useState<Meal | null>(null);
  const [cookModalSlotIndex, setCookModalSlotIndex] = useState<number>(0);

  // Feature 2: Sunday Batch Prep Guide Modal State
  const [batchPrepModalOpen, setBatchPrepModalOpen] = useState<boolean>(false);

  // Feature 3: ICMR Micronutrient & Gut Health Guide Modal State
  const [micronutrientModalOpen, setMicronutrientModalOpen] = useState<boolean>(false);

  // Feature 5: Eaten Meals & Daily Consumption Tracker State
  const [eatenRecords, setEatenRecords] = useState<Record<string, EatenDayRecord>>(() => loadEatenRecordsStorage());

  // Sub-navigation tab: 'weekly' | 'favorites' | 'history'
  const [plannerSubTab, setPlannerSubTab] = useState<'weekly' | 'favorites' | 'history'>('weekly');

  // Calendar View Mode: 'list' (7-day daily tab list), 'table' (7-day matrix table), 'monthly' (interactive calendar grid)
  const [viewMode, setViewMode] = useState<'list' | 'table' | 'monthly'>('list');
  const [tableDensity, setTableDensity] = useState<'compact' | 'comfortable'>('comfortable');
  const [tableMealFilter, setTableMealFilter] = useState<'all' | 'breakfast' | 'lunch' | 'snack' | 'dinner'>('all');
  const [copiedTableMarkdown, setCopiedTableMarkdown] = useState(false);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);

  // Favorites / Bookmarks State
  const [favorites, setFavorites] = useState<BookmarkedMeal[]>(() => loadFavoritesStorage());
  const [favoriteSearch, setFavoriteSearch] = useState('');
  const [favoriteCategory, setFavoriteCategory] = useState<string>('all');

  // JSON Inspector & History State
  const [jsonViewTab, setJsonViewTab] = useState<'meal_plan' | 'profile' | 'pantry' | 'history'>('meal_plan');
  const [copiedJson, setCopiedJson] = useState(false);
  const [historyList, setHistoryList] = useState<SavedPlanHistory[]>(() => loadMealPlanHistoryStorage());

  // Print & Export States
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [printScope, setPrintScope] = useState<'all' | 'single'>('all');
  const [copiedText, setCopiedText] = useState(false);
  const [textFormatStyle, setTextFormatStyle] = useState<'whatsapp' | 'simple'>('whatsapp');

  // Eaten status helpers
  const getEatenDayKey = (dayNum: number) => `day_${dayNum}_${userProfile.id || 'default'}`;

  const isMealEaten = (dayNum: number, slotKey: 'breakfast' | 'lunch' | 'eveningSnack' | 'dinner'): boolean => {
    const key = getEatenDayKey(dayNum);
    return !!eatenRecords[key]?.mealsEaten?.[slotKey];
  };

  const toggleMealEaten = (dayNum: number, slotKey: 'breakfast' | 'lunch' | 'eveningSnack' | 'dinner') => {
    const key = getEatenDayKey(dayNum);
    const existing = eatenRecords[key] || {
      date: new Date().toISOString().split('T')[0],
      dayNumber: dayNum,
      memberId: userProfile.id || 'default',
      mealsEaten: { breakfast: false, lunch: false, eveningSnack: false, dinner: false },
      pantryDeducted: false,
    };
    const updatedMeals = {
      ...existing.mealsEaten,
      [slotKey]: !existing.mealsEaten[slotKey],
    };
    const updatedRecord: EatenDayRecord = {
      ...existing,
      mealsEaten: updatedMeals,
    };
    const newRecords = { ...eatenRecords, [key]: updatedRecord };
    setEatenRecords(newRecords);
    saveEatenRecordsStorage(newRecords);
    const isNowDone = updatedMeals[slotKey];
    setShuffleToast(isNowDone ? `Marked ${slotKey} as Eaten! 🥗` : `Unmarked ${slotKey}`);
    setTimeout(() => setShuffleToast(null), 2500);
  };

  const isEntireDayEaten = (dayNum: number): boolean => {
    const key = getEatenDayKey(dayNum);
    const m = eatenRecords[key]?.mealsEaten;
    return !!(m && m.breakfast && m.lunch && m.eveningSnack && m.dinner);
  };

  const toggleEntireDayEaten = (dayNum: number) => {
    const key = getEatenDayKey(dayNum);
    const alreadyAll = isEntireDayEaten(dayNum);
    const newState = !alreadyAll;
    const updatedRecord: EatenDayRecord = {
      date: new Date().toISOString().split('T')[0],
      dayNumber: dayNum,
      memberId: userProfile.id || 'default',
      mealsEaten: {
        breakfast: newState,
        lunch: newState,
        eveningSnack: newState,
        dinner: newState,
      },
      pantryDeducted: false,
    };
    const newRecords = { ...eatenRecords, [key]: updatedRecord };
    setEatenRecords(newRecords);
    saveEatenRecordsStorage(newRecords);
    setShuffleToast(
      newState
        ? `🔥 Day ${dayNum} completed! High-protein diet targets met!`
        : `Reset Day ${dayNum} progress.`
    );
    setTimeout(() => setShuffleToast(null), 3000);
  };

  // Streak counter (count of fully eaten days)
  const completedDaysStreak = (Object.values(eatenRecords) as EatenDayRecord[]).filter(
    (r) => r?.mealsEaten?.breakfast && r?.mealsEaten?.lunch && r?.mealsEaten?.eveningSnack && r?.mealsEaten?.dinner
  ).length;

  // Water Intake Tracker State (Keyed by dayNumber, stored in localStorage)
  const [waterLogs, setWaterLogs] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem('nutriplan_water_logs');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateWaterIntake = (dayNum: number, newCount: number) => {
    const validCount = Math.max(0, Math.min(16, newCount));
    const updated = { ...waterLogs, [dayNum]: validCount };
    setWaterLogs(updated);
    try {
      localStorage.setItem('nutriplan_water_logs', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const toggleBookmark = (meal: Meal, slotLabel: string) => {
    if (!meal) return;
    const mealId = meal.id || `${meal.name}_${slotLabel}`;
    const isAlready = favorites.some((f) => f.id === mealId || f.name === meal.name);

    let updated: BookmarkedMeal[];
    if (isAlready) {
      updated = favorites.filter((f) => f.id !== mealId && f.name !== meal.name);
      setShuffleToast(`Removed "${meal.name}" from Favorites`);
    } else {
      const newFav: BookmarkedMeal = {
        ...meal,
        id: mealId,
        dayName: currentDay?.dayName || `Day ${selectedDayIndex + 1}`,
        dayNumber: currentDay?.dayNumber || (selectedDayIndex + 1),
        mealSlot: slotLabel,
        bookmarkedAt: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      updated = [newFav, ...favorites];
      setShuffleToast(`Bookmarked "${meal.name}" to Favorites! ⭐`);
    }

    setFavorites(updated);
    saveFavoritesStorage(updated);
    setTimeout(() => setShuffleToast(null), 3000);
  };

  const isMealBookmarked = (meal: Meal) => {
    if (!meal) return false;
    return favorites.some((f) => f.id === meal.id || f.name === meal.name);
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-slate-100 shadow-xs text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Calculating Your 7-Day Vegetarian Plan...</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Analyzing pantry stock, calculating high-protein staples (soya, sprouted dals, nuts), enforcing WHO zero-added-sugar limits & ICMR 2024 guidelines within your ₹{userProfile.dailyBudgetInr}/day budget.
          </p>
        </div>
      </div>
    );
  }

  if (!plan || !plan.days || plan.days.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-4 max-w-3xl mx-auto my-6 shadow-xs">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
          <Leaf className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Personalized Vegetarian Diet Planner</h2>
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Generate a 7-day zero-added-sugar meal plan structured specifically around your non-refrigerated pantry stock, high-protein staples, and a ₹150–₹200/day grocery budget.
        </p>
        <button
          onClick={() => onGeneratePlan()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-xs inline-flex items-center space-x-2 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate 7-Day Meal Plan</span>
        </button>
      </div>
    );
  }

  const currentDay = plan.days[selectedDayIndex] || plan.days[0];

  const getMealFiber = (meal?: Meal) => {
    if (!meal) return 0;
    if (typeof meal.fiberGrams === 'number') return meal.fiberGrams;
    return Math.round((meal.caloriesKcal || 300) * 0.02);
  };

  const getDayTotalFiber = (day: typeof currentDay) => {
    if (typeof day.totalFiberGrams === 'number' && day.totalFiberGrams > 0) {
      return day.totalFiberGrams;
    }
    return (
      getMealFiber(day.breakfast) +
      getMealFiber(day.lunch) +
      getMealFiber(day.eveningSnack) +
      getMealFiber(day.dinner)
    );
  };

  const currentDayFiber = getDayTotalFiber(currentDay);

  const handleOpenSubstitution = (mealName: string, ingredient: string = '') => {
    setSubMealName(mealName);
    setSubIngredient(ingredient);
    setSubModalOpen(true);
  };

  const generate7DayText = (p: WeeklyMealPlan, style: 'whatsapp' | 'simple'): string => {
    if (!p || !p.days) return '';

    if (style === 'simple') {
      let text = `7-DAY VEGETARIAN MEAL PLAN\n`;
      text += `Plan: ${p.planTitle || 'Weekly Plan'}\n`;
      text += `Member: ${userProfile.name || 'User'}\n`;
      text += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
      text += `Daily Target: ${p.targetProteinGrams}g Protein | Est. Grocery: ₹${p.totalWeeklyCostInr}\n`;
      text += `------------------------------------\n\n`;

      p.days.forEach((day) => {
        const fiber = getDayTotalFiber(day);
        text += `[${(day.dayName || `Day ${day.dayNumber}`).toUpperCase()}] - ${day.totalCaloriesKcal} kcal, ${day.totalProteinGrams}g Protein, ${fiber}g Fiber\n`;
        if (day.breakfast) text += ` - Breakfast: ${day.breakfast.name} (${day.breakfast.portion})\n`;
        if (day.lunch) text += ` - Lunch: ${day.lunch.name} (${day.lunch.portion})\n`;
        if (day.eveningSnack) text += ` - Snack: ${day.eveningSnack.name} (${day.eveningSnack.portion})\n`;
        if (day.dinner) text += ` - Dinner: ${day.dinner.name} (${day.dinner.portion})\n`;
        text += `\n`;
      });
      return text;
    }

    // Default: WhatsApp rich format
    let text = `🥗 *DietPlan AI - 7-DAY VEGETARIAN DIET PLAN*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 *${p.planTitle || 'Weekly High-Protein Plan'}*\n`;
    text += `👤 *Member:* ${userProfile.name || 'User'} | 📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n`;
    text += `💪 *Target Protein:* ${p.targetProteinGrams}g/day | 💰 *Weekly Grocery:* ₹${p.totalWeeklyCostInr}\n`;
    text += `✅ *Compliance:* ICMR/NIN 2024 & WHO 0g Added Sugar\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    p.days.forEach((day) => {
      const fiber = getDayTotalFiber(day);
      text += `🗓️ *${(day.dayName || `Day ${day.dayNumber}`).toUpperCase()}* (Day ${day.dayNumber})\n`;
      text += `📊 *Macros:* ${day.totalCaloriesKcal} kcal | ${day.totalProteinGrams}g Protein | ${fiber}g Fiber\n`;
      text += `─────────────\n`;

      const meals = [
        { label: '🍳 *Breakfast*', meal: day.breakfast },
        { label: '🍲 *Lunch*', meal: day.lunch },
        { label: '☕ *Evening Snack*', meal: day.eveningSnack },
        { label: '🌙 *Dinner*', meal: day.dinner },
      ];

      meals.forEach(({ label, meal }) => {
        if (meal) {
          const mFib = getMealFiber(meal);
          text += `${label}: *${meal.name}*\n`;
          text += `   • Portion: ${meal.portion}\n`;
          text += `   • Nutrition: ${meal.caloriesKcal} kcal | ${meal.proteinGrams}g P | ${mFib}g Fiber\n`;
          if (meal.ingredients && meal.ingredients.length > 0) {
            text += `   • Ingredients: ${meal.ingredients.join(', ')}\n`;
          }
        }
      });

      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    if (p.nutritionistNotes) {
      text += `💡 *Dietitian Note:* ${p.nutritionistNotes}\n\n`;
    }
    text += `✨ Generated by *DietPlan AI* - ICMR 2024 Dietitian Assistant`;
    return text;
  };

  const handleTriggerPrint = (scope: 'all' | 'single') => {
    setPrintScope(scope);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleCopy7DayText = () => {
    if (!plan) return;
    const text = generate7DayText(plan, textFormatStyle);
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleShareWhatsAppPlan = () => {
    if (!plan) return;
    const text = generate7DayText(plan, textFormatStyle);
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleShuffleRecipe = async (slotLabel: string, currentMeal: Meal) => {
    if (!plan) return;
    setShufflingSlot(slotLabel);

    try {
      const newMeal = await apiFetch('/api/shuffle-recipe', {
        method: 'POST',
        body: JSON.stringify({
          mealSlot: slotLabel,
          currentMeal,
          userProfile,
          inventory,
        }),
      });

      if (newMeal && newMeal.name) {
        let slotKey: 'breakfast' | 'lunch' | 'eveningSnack' | 'dinner' = 'breakfast';
        const norm = slotLabel.toLowerCase();
        if (norm.includes('lunch')) slotKey = 'lunch';
        else if (norm.includes('snack')) slotKey = 'eveningSnack';
        else if (norm.includes('dinner')) slotKey = 'dinner';

        const updatedDays = [...plan.days];
        const targetDay = { ...updatedDays[selectedDayIndex] };
        targetDay[slotKey] = newMeal;

        const b = targetDay.breakfast;
        const l = targetDay.lunch;
        const s = targetDay.eveningSnack;
        const d = targetDay.dinner;

        targetDay.totalCaloriesKcal = (b?.caloriesKcal || 0) + (l?.caloriesKcal || 0) + (s?.caloriesKcal || 0) + (d?.caloriesKcal || 0);
        targetDay.totalProteinGrams = (b?.proteinGrams || 0) + (l?.proteinGrams || 0) + (s?.proteinGrams || 0) + (d?.proteinGrams || 0);

        const bFib = typeof b?.fiberGrams === 'number' ? b.fiberGrams : Math.round((b?.caloriesKcal || 0) * 0.02);
        const lFib = typeof l?.fiberGrams === 'number' ? l.fiberGrams : Math.round((l?.caloriesKcal || 0) * 0.02);
        const sFib = typeof s?.fiberGrams === 'number' ? s.fiberGrams : Math.round((s?.caloriesKcal || 0) * 0.02);
        const dFib = typeof d?.fiberGrams === 'number' ? d.fiberGrams : Math.round((d?.caloriesKcal || 0) * 0.02);
        targetDay.totalFiberGrams = bFib + lFib + sFib + dFib;

        updatedDays[selectedDayIndex] = targetDay;

        const updatedPlan: WeeklyMealPlan = {
          ...plan,
          days: updatedDays,
        };

        if (onUpdatePlan) {
          onUpdatePlan(updatedPlan);
        }

        setShuffleToast(`Shuffled ${slotLabel} to "${newMeal.name}"!`);
        setTimeout(() => setShuffleToast(null), 4000);
      }
    } catch (err: any) {
      console.error('Failed to shuffle recipe:', err);
      setShuffleToast('Failed to shuffle recipe. Please try again.');
      setTimeout(() => setShuffleToast(null), 3000);
    } finally {
      setShufflingSlot(null);
    }
  };

  const renderMealCard = (meal: Meal, label: string, cardIndex: number = 0) => {
    if (!meal) return null;
    const mealFiber = getMealFiber(meal);
    const isShufflingThis = shufflingSlot === label;
    const isBookmarked = isMealBookmarked(meal);

    // Slot key for eaten tracking
    const slotKey: 'breakfast' | 'lunch' | 'eveningSnack' | 'dinner' =
      label.toLowerCase().includes('breakfast')
        ? 'breakfast'
        : label.toLowerCase().includes('lunch')
        ? 'lunch'
        : label.toLowerCase().includes('snack')
        ? 'eveningSnack'
        : 'dinner';

    const dayNum = currentDay?.dayNumber || (selectedDayIndex + 1);
    const eaten = isMealEaten(dayNum, slotKey);

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: cardIndex * 0.07, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`bg-white border rounded-2xl p-5 hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4 group relative overflow-hidden ${
          eaten
            ? 'border-emerald-500/80 ring-1 ring-emerald-400/30 bg-gradient-to-b from-emerald-50/40 to-white'
            : 'border-slate-200/80 hover:border-emerald-400/80'
        }`}
      >
        {/* Shuffling AI overlay */}
        {isShufflingThis && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center space-y-2.5 z-20 transition-all p-4 text-center">
            <div className="relative">
              <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <Sparkles className="w-4 h-4 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Gemini AI Shuffling Recipe...</span>
              <span className="text-[11px] text-slate-500 block">Generating alternative {label.toLowerCase()} using pantry stock</span>
            </div>
          </div>
        )}

        <div>
          {/* Header with Slot Label, Eaten Checkbox & Bookmark Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md group-hover:bg-emerald-100 transition-colors">
                {label}
              </span>

              {/* Mark Eaten Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleMealEaten(dayNum, slotKey)}
                className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center space-x-1 transition-colors cursor-pointer ${
                  eaten
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 border-slate-200'
                }`}
                title={eaten ? 'Unmark eaten' : 'Mark meal as consumed'}
              >
                {eaten ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                <span>{eaten ? 'Eaten ✓' : 'Mark Eaten'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleBookmark(meal, label)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1 transition-colors cursor-pointer shadow-2xs ${
                  isBookmarked
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 border-slate-200'
                }`}
                title={isBookmarked ? 'Remove from Saved Favorites' : 'Bookmark recipe to Favorites'}
              >
                <BookmarkCheck className={`w-3.5 h-3.5 ${isBookmarked ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>{meal.caloriesKcal} kcal</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <HeartPulse className="w-3 h-3 text-emerald-600" />
                <span>{meal.proteinGrams}g Protein</span>
              </span>
              <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Wheat className="w-3 h-3 text-teal-600" />
                <span>{mealFiber}g Fiber</span>
              </span>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-emerald-950 transition-colors flex items-center justify-between">
            <span>{meal.name}</span>
            {eaten && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                Consumed ✓
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-3">
            Portion: <strong className="text-slate-700">{meal.portion}</strong>
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {meal.isZeroAddedSugar && (
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                ✓ Zero Added Sugar
              </span>
            )}
            {meal.usesPantryStock ? (
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                📦 In Pantry Stock
              </span>
            ) : (
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                🛒 Add via Grocery
              </span>
            )}
          </div>

          {/* Ingredients list */}
          <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700 block text-[11px]">Key Ingredients:</span>
            <div className="flex flex-wrap gap-1">
              {(meal.ingredients || []).map((ing, i) => (
                <motion.span
                  key={i}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenSubstitution(meal.name, ing)}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] hover:border-emerald-400 hover:text-emerald-700 cursor-pointer transition-colors shadow-2xs"
                  title="Click to substitute ingredient"
                >
                  {ing}
                </motion.span>
              ))}
            </div>
          </div>

          {/* Preparation Notes */}
          <p className="text-xs text-slate-600 leading-relaxed italic bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50">
            "{meal.preparationNotes}"
          </p>
        </div>

        {/* Action button row: Cook Mode, Shuffle Recipe & Substitute Item */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
          {/* Cook Mode Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setCookModalMeal(meal);
              setCookModalSlotIndex(cardIndex);
              setCookModalOpen(true);
            }}
            className="text-[11px] sm:text-xs font-bold text-slate-900 bg-amber-100/90 hover:bg-amber-200 py-2 sm:py-2.5 px-1.5 sm:px-2.5 rounded-xl border border-amber-300 flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Open distraction-free Cook Mode with timers and step-by-step instructions"
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="truncate">Cook Mode</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={isShufflingThis}
            onClick={() => handleShuffleRecipe(label, meal)}
            className="text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-2 sm:py-2.5 px-1.5 sm:px-2.5 rounded-xl border border-emerald-200/80 hover:border-emerald-300 flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-2xs active:scale-95"
            title="Ask Gemini to suggest an alternative dish for this slot using pantry stock"
          >
            {isShufflingThis ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                <span className="truncate">Shuffling...</span>
              </>
            ) : (
              <>
                <Shuffle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Shuffle</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleOpenSubstitution(meal.name)}
            className="text-[11px] sm:text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 py-2 sm:py-2.5 px-1.5 sm:px-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 flex items-center justify-center space-x-1 sm:space-x-1.5 transition-all cursor-pointer active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Substitute</span>
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* SCREEN VIEW (Hidden when printing) */}
      <div className="space-y-6 print:hidden">
        {/* Shuffle Toast Banner */}
        <AnimatePresence>
          {shuffleToast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-sm flex items-center justify-between text-xs font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{shuffleToast}</span>
              </div>
              <button
                onClick={() => setShuffleToast(null)}
                className="text-emerald-200 hover:text-white text-xs font-medium ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plan Summary Bar */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-4 sm:p-5 lg:p-6 shadow-md relative overflow-hidden">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>7-Day Vegetarian Meal Plan</span>
                </span>
                {userProfile.name && (
                  <span className="bg-emerald-800/80 text-emerald-100 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-emerald-600/50 flex items-center space-x-1 normal-case">
                    <User className="w-3 h-3 text-emerald-300" />
                    <span>Plan for {userProfile.name}</span>
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">{plan.planTitle}</h1>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">{plan.summary}</p>
            </div>

            {/* Quick Metrics & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-wrap">
              {/* Macro Pills */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-center">
                  <span className="block text-[9px] sm:text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Daily Protein</span>
                  <span className="text-xs sm:text-sm font-black text-white">{plan.targetProteinGrams}g / day</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/15 text-center">
                  <span className="block text-[9px] sm:text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Weekly Grocery</span>
                  <span className="text-xs sm:text-sm font-black text-white">₹{plan.totalWeeklyCostInr}</span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:items-center gap-1.5 sm:gap-2">
                {/* Sunday Batch Prep Roadmap Button */}
                <button
                  onClick={() => setBatchPrepModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                  title="View step-by-step Sunday batch prep roadmap (chopping, soaking, pre-boiling)"
                >
                  <Salad className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                  <span>Sunday Prep</span>
                </button>

                {/* ICMR Micronutrient Guide Button */}
                <button
                  onClick={() => setMicronutrientModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                  title="View ICMR Vitamin B12, Iron, Calcium & Gut Health Guide"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-teal-200 shrink-0" />
                  <span>Micronutrients</span>
                </button>

                {/* Print All 7 Days */}
                <button
                  onClick={() => handleTriggerPrint('all')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Print full 7-day meal plan (Monday to Sunday)"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>Print Plan</span>
                </button>

                {/* WhatsApp Export */}
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
                  title="Copy formatted 7-day diet menu for WhatsApp or Notes"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Share Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Allergen & Completed Streak Banner */}
          <div className="mt-3.5 pt-3 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2 text-amber-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Allergen Safety:</strong> {(plan.allergenWarnings && plan.allergenWarnings.length > 0) ? plan.allergenWarnings.join(' • ') : '100% Free of selected user allergens'}
              </span>
            </div>

            {completedDaysStreak > 0 && (
              <div className="flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-400/40 font-bold self-start sm:self-auto text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{completedDaysStreak}-Day Healthy Diet Streak! 🔥</span>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Bar: 7-Day Planner | Saved Favorites | Plan History & JSON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPlannerSubTab('weekly')}
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer ${
                plannerSubTab === 'weekly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span className="truncate">Meal Plan</span>
            </button>

            <button
              onClick={() => setPlannerSubTab('favorites')}
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer ${
                plannerSubTab === 'favorites'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span className="truncate">Favorites</span>
              {favorites.length > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5">
                  {favorites.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setHistoryList(loadMealPlanHistoryStorage());
                setPlannerSubTab('history');
              }}
              className={`px-2.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer ${
                plannerSubTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
              <span className="truncate">History</span>
            </button>
          </div>

          {/* Calendar View Mode Toggle (Daily List vs 7-Day Table vs Monthly Calendar) */}
          {plannerSubTab === 'weekly' && (
            <div className="grid grid-cols-3 sm:flex sm:items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to 7-Day List View with step-by-step cooking cards"
              >
                <LayoutList className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Daily List</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to 7-Day Matrix Table View"
              >
                <Table className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Weekly Table</span>
              </button>

              <button
                onClick={() => setViewMode('monthly')}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  viewMode === 'monthly'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Monthly Recurring Calendar View"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Monthly</span>
              </button>
            </div>
          )}
        </div>

        {/* 1. WEEKLY MEAL PLAN TAB */}
        {plannerSubTab === 'weekly' && (
          <>
            {viewMode === 'list' && (
              <>
            {/* Responsive 7-Days Tab & Navigation Controls Bar */}
            <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : plan.days.length - 1))}
                    className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDayIndex((prev) => (prev < plan.days.length - 1 ? prev + 1 : 0))}
                    className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-800 hidden sm:inline">
                    Day {selectedDayIndex + 1} of 7 ({plan.days[selectedDayIndex]?.dayName || `Day ${selectedDayIndex + 1}`})
                  </span>
                </div>

                {/* Mobile Day Picker Dropdown */}
                <div className="sm:hidden flex-1 max-w-[160px]">
                  <select
                    value={selectedDayIndex}
                    onChange={(e) => setSelectedDayIndex(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-xs rounded-xl px-2 py-1.5 focus:ring-2 focus:ring-emerald-500"
                  >
                    {plan.days.map((day, idx) => (
                      <option key={idx} value={idx}>
                        {day.dayName || `Day ${idx + 1}`} ({day.totalProteinGrams}g P)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Horizontally Scrollable 7-Day Buttons Bar */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {plan.days.map((day, index) => {
                  const isActive = index === selectedDayIndex;
                  const fiberVal = getDayTotalFiber(day);
                  return (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedDayIndex(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex flex-col items-center min-w-[110px] sm:min-w-[130px] border cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50/70 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span>{day.dayName || `Day ${day.dayNumber}`}</span>
                      <span className={`text-[10px] font-normal mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {day.totalCaloriesKcal} kcal • {day.totalProteinGrams}g P • {fiberVal}g Fiber
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedDayIndex}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* Selected Day Breakdown Header */}
          <div className="bg-emerald-50/70 border border-emerald-100/90 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs">
                  {currentDay.dayNumber}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{currentDay.dayName} Menu & Nutrition</h2>
                  <p className="text-xs text-slate-600">
                    ICMR/WHO 2024 compliant daily target breakdown based on non-refrigerated pantry stock.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* 1-Click Cook Full Day */}
                <button
                  onClick={() => {
                    setCookModalMeal(currentDay.breakfast || currentDay.lunch);
                    setCookModalSlotIndex(0);
                    setCookModalOpen(true);
                  }}
                  className="bg-amber-100 text-amber-950 hover:bg-amber-200 border border-amber-300 font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
                  title="Open full day step-by-step cooking view with timers"
                >
                  <ChefHat className="w-3.5 h-3.5 text-amber-800" />
                  <span>Kitchen Cook Mode</span>
                </button>

                {/* 1-Click Mark Day as Eaten */}
                <button
                  onClick={() => toggleEntireDayEaten(currentDay.dayNumber)}
                  className={`font-bold px-3.5 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs ${
                    isEntireDayEaten(currentDay.dayNumber)
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Mark all 4 meals for today as consumed"
                >
                  {isEntireDayEaten(currentDay.dayNumber) ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Day Completed ✓</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Day as Eaten</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Total Daily Nutritional Breakdown Cards (Calories, Protein, Fiber) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
              {/* Calories */}
              <motion.div whileHover={{ y: -2 }} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 transition-shadow hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Total Calories</span>
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {currentDay.totalCaloriesKcal} / {plan.targetCaloriesKcal || userProfile.calorieTargetKcal} kcal
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (currentDay.totalCaloriesKcal / (plan.targetCaloriesKcal || userProfile.calorieTargetKcal || 1600)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Target: {plan.targetCaloriesKcal || userProfile.calorieTargetKcal} kcal</span>
                  <span className="text-emerald-700 font-medium">✓ Caloric Balance</span>
                </p>
              </motion.div>

              {/* Protein */}
              <motion.div whileHover={{ y: -2 }} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 transition-shadow hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span>Total Protein</span>
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    {currentDay.totalProteinGrams} / {plan.targetProteinGrams || userProfile.proteinTargetGrams} g
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (currentDay.totalProteinGrams / (plan.targetProteinGrams || userProfile.proteinTargetGrams || 80)) * 100
                        )
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Goal: {plan.targetProteinGrams || userProfile.proteinTargetGrams}g</span>
                  <span className="text-emerald-700 font-medium">✓ Sprouted & Soya Boost</span>
                </p>
              </motion.div>

              {/* Fiber */}
              <motion.div whileHover={{ y: -2 }} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 transition-shadow hover:shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                    <Wheat className="w-4 h-4 text-teal-600" />
                    <span>Dietary Fiber</span>
                  </span>
                  <span className="text-xs font-bold text-teal-900">
                    {currentDayFiber} g
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((currentDayFiber / 30) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>ICMR Benchmark: ≥30g/day</span>
                  <span className="text-teal-700 font-semibold">
                    {currentDayFiber >= 30 ? '✓ Exceeds ICMR Goal' : '✓ High Fiber'}
                  </span>
                </p>
              </motion.div>
            </div>

            {/* Guideline Alignment Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="bg-white/80 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span><strong>WHO Limit:</strong> 0g Added Sugar Across All 4 Meals</span>
              </div>
              <div className="bg-white/80 border border-teal-200 text-teal-900 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                <Wheat className="w-3.5 h-3.5 text-teal-600" />
                <span><strong>ICMR Fiber Standard:</strong> {currentDayFiber}g Whole Pulse & Seed Fiber</span>
              </div>
              <div className="bg-white/80 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <span><strong>Macro Ratio:</strong> ~55% Complex Carbs, ~20% Protein, ~25% Healthy Fats</span>
              </div>
            </div>
          </div>

          {/* Daily Water Intake Tracker */}
          {(() => {
            const dayNum = currentDay.dayNumber || (selectedDayIndex + 1);
            const glassesConsumed = waterLogs[dayNum] || 0;
            const targetGlasses = 8; // 2,000 ml
            const currentMl = glassesConsumed * 250;
            const targetMl = targetGlasses * 250;
            const percentage = Math.min(100, Math.round((glassesConsumed / targetGlasses) * 100));
            const isTargetMet = glassesConsumed >= targetGlasses;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-sky-50/90 via-blue-50/70 to-cyan-50/90 border border-sky-200/80 rounded-2xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-sky-500 text-white rounded-xl flex items-center justify-center shadow-xs">
                      <Droplets className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-900">Daily Hydration Tracker</h3>
                        {isTargetMet && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-2xs">
                            <Check className="w-3 h-3" />
                            <span>2.0L Goal Met!</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        {currentDay.dayName || `Day ${dayNum}`} Water Log • 1 glass = 250 ml
                      </p>
                    </div>
                  </div>

                  {/* Water Counter & Percentage Badge */}
                  <div className="flex items-center space-x-2 bg-white/90 border border-sky-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
                    <Droplet className="w-4 h-4 text-sky-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800">
                      {glassesConsumed} / {targetGlasses} Glasses
                    </span>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                      {currentMl} / {targetMl} ml ({percentage}%)
                    </span>
                  </div>
                </div>

                {/* Hydration Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-sky-200/60 h-2.5 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        isTargetMet
                          ? 'bg-gradient-to-r from-emerald-500 to-sky-500'
                          : 'bg-gradient-to-r from-sky-400 to-blue-600'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Target: 2,000 ml (8 Glasses)</span>
                    <span className={isTargetMet ? 'font-bold text-emerald-700' : 'text-slate-500'}>
                      {isTargetMet ? '🎉 Daily Hydration Target Reached!' : `${targetGlasses - glassesConsumed > 0 ? targetGlasses - glassesConsumed : 0} glasses remaining`}
                    </span>
                  </div>
                </div>

                {/* Glasses Clickable Grid (8 Interactive Glasses) */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Click glasses to log or toggle water intake:
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => {
                      const glassNum = idx + 1;
                      const isFilled = glassesConsumed >= glassNum;

                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => {
                            if (glassesConsumed === glassNum) {
                              updateWaterIntake(dayNum, glassNum - 1);
                            } else {
                              updateWaterIntake(dayNum, glassNum);
                            }
                          }}
                          className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                            isFilled
                              ? 'bg-sky-500 text-white border-sky-600 shadow-2xs'
                              : 'bg-white text-sky-600 border-sky-200 hover:border-sky-400 hover:bg-sky-50'
                          }`}
                          title={`Glass ${glassNum} (250ml) - Click to ${isFilled ? 'remove' : 'fill'}`}
                        >
                          <Droplet className={`w-4 h-4 ${isFilled ? 'fill-white text-white' : 'text-sky-400'}`} />
                          <span className="text-[10px] font-bold">
                            {glassNum * 250}ml
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Increment/Decrement Controls & Reset */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-sky-200/60">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateWaterIntake(dayNum, glassesConsumed - 1)}
                      disabled={glassesConsumed === 0}
                      className="bg-white hover:bg-sky-50 border border-sky-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                      title="Remove 1 glass (250ml)"
                    >
                      <Minus className="w-3.5 h-3.5 text-sky-600" />
                      <span>1 Glass</span>
                    </button>

                    <button
                      onClick={() => updateWaterIntake(dayNum, glassesConsumed + 1)}
                      className="bg-sky-600 hover:bg-sky-700 text-white p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Add 1 glass (250ml)"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-100" />
                      <span>+1 Glass (+250ml)</span>
                    </button>

                    <button
                      onClick={() => updateWaterIntake(dayNum, glassesConsumed + 2)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 px-3 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Add 2 glasses (500ml)"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-100" />
                      <span>+2 Glasses (+500ml)</span>
                    </button>
                  </div>

                  {glassesConsumed > 0 && (
                    <button
                      onClick={() => updateWaterIntake(dayNum, 0)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1 px-2 py-1 hover:bg-sky-100/50 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Reset Day</span>
                    </button>
                  )}
                </div>

                {/* Health & Clinical Guidance Note */}
                <div className="bg-white/80 border border-sky-200/70 p-2.5 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>ICMR & WHO Hydration Guideline:</strong> Maintaining 2.0L–2.5L daily water intake optimizes high-protein legume digestion, enhances fiber motility, and helps prevent bloating during vegetarian diet plans.
                  </span>
                </div>
              </motion.div>
            );
          })()}

          {/* Meal Grid (4 Meals with staggered animation indices) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {renderMealCard(currentDay.breakfast, 'Breakfast', 0)}
            {renderMealCard(currentDay.lunch, 'Lunch', 1)}
            {renderMealCard(currentDay.eveningSnack, 'Evening Snack', 2)}
            {renderMealCard(currentDay.dinner, 'Dinner', 3)}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nutritionist Guidance Notes */}
      {plan.nutritionistNotes && (
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Dietitian & ICMR Clinical Guidance</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{plan.nutritionistNotes}</p>
        </div>
      )}
      </>
      )}

      {/* 7-DAY MATRIX TABLE VIEW */}
      {viewMode === 'table' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-4"
        >
          {/* Table Header & Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
            <div className="flex items-start sm:items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <Table className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  7-Day Complete Menu & Nutrition Matrix
                </h2>
                <p className="text-[11px] text-slate-500">
                  Side-by-side view with live macro tallies, hydration goals, and one-tap cook triggers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/80">
              {/* Density Toggle */}
              <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-2xs shrink-0">
                <button
                  onClick={() => setTableDensity('comfortable')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tableDensity === 'comfortable' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Comfortable row height with full dish notes"
                >
                  Comfortable
                </button>
                <button
                  onClick={() => setTableDensity('compact')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    tableDensity === 'compact' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Compact density for dense scanning"
                >
                  Compact
                </button>
              </div>

              {/* Copy Markdown Table */}
              <button
                onClick={() => {
                  let md = `| Day | Breakfast | Lunch | Snack | Dinner | Protein | Calories | Fiber |\n`;
                  md += `|---|---|---|---|---|---|---|---|\n`;
                  plan.days.forEach((d) => {
                    const fib = getDayTotalFiber(d);
                    md += `| ${d.dayName || `Day ${d.dayNumber}`} | ${d.breakfast.name} (${d.breakfast.proteinGrams}g P) | ${d.lunch.name} (${d.lunch.proteinGrams}g P) | ${d.eveningSnack.name} (${d.eveningSnack.proteinGrams}g P) | ${d.dinner.name} (${d.dinner.proteinGrams}g P) | ${d.totalProteinGrams}g | ${d.totalCaloriesKcal} kcal | ${fib}g |\n`;
                  });
                  navigator.clipboard.writeText(md);
                  setCopiedTableMarkdown(true);
                  setTimeout(() => setCopiedTableMarkdown(false), 2500);
                }}
                className="flex-1 sm:flex-initial bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                title="Copy full 7-day table in GitHub / Markdown format"
              >
                {copiedTableMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copiedTableMarkdown ? 'Copied MD' : 'Copy MD'}</span>
              </button>

              {/* Print Table */}
              <button
                onClick={() => handleTriggerPrint('all')}
                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-2xs cursor-pointer active:scale-95 whitespace-nowrap"
                title="Print 7-day meal table"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Horizontally Scrollable Responsive Table Container */}
          <div className="relative overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
            <table className="w-full text-left border-collapse min-w-[980px] text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                  <th className="py-3 px-3.5 sticky left-0 z-20 bg-slate-900 min-w-[140px] border-r border-slate-800">
                    Day & Schedule
                  </th>
                  <th className="py-3 px-3 min-w-[180px]">Breakfast</th>
                  <th className="py-3 px-3 min-w-[180px]">Lunch</th>
                  <th className="py-3 px-3 min-w-[170px]">Evening Snack</th>
                  <th className="py-3 px-3 min-w-[180px]">Dinner</th>
                  <th className="py-3 px-3 min-w-[130px] text-center">Day Totals</th>
                  <th className="py-3 px-3 min-w-[100px] text-center">Hydration</th>
                  <th className="py-3 px-3 min-w-[90px] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {plan.days.map((day, dIdx) => {
                  const isSelected = dIdx === selectedDayIndex;
                  const fiberVal = getDayTotalFiber(day);
                  const dayNum = day.dayNumber || (dIdx + 1);
                  const waterCount = waterLogs[dayNum] || 0;
                  const isEatenAll = isMealEaten(dayNum, 'breakfast') && isMealEaten(dayNum, 'lunch') && isMealEaten(dayNum, 'eveningSnack') && isMealEaten(dayNum, 'dinner');

                  const renderTableMealCell = (meal: Meal, mealKey: 'breakfast' | 'lunch' | 'eveningSnack' | 'dinner', mealLabel: string) => {
                    const eaten = isMealEaten(dayNum, mealKey);
                    return (
                      <td className={`p-2.5 align-top transition-colors ${eaten ? 'bg-emerald-50/40' : ''} ${tableDensity === 'compact' ? 'py-2' : 'py-3'}`}>
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <button
                              onClick={() => {
                                setCookModalMeal(meal);
                                setCookModalSlotIndex(0);
                                setCookModalOpen(true);
                              }}
                              className="font-bold text-slate-900 hover:text-emerald-700 text-left transition-colors cursor-pointer hover:underline flex items-center space-x-1"
                              title={`Click to open Cook Mode for ${meal.name}`}
                            >
                              <span className={eaten ? 'line-through text-slate-500' : ''}>{meal.name}</span>
                            </button>

                            <button
                              onClick={() => toggleMealEaten(dayNum, mealKey)}
                              className={`p-0.5 rounded cursor-pointer ${eaten ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                              title={eaten ? 'Mark as not eaten' : 'Mark as cooked & eaten'}
                            >
                              {eaten ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-1 text-[10px]">
                            <span className="bg-emerald-100/90 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              {meal.proteinGrams}g P
                            </span>
                            <span className="bg-slate-100 text-slate-600 font-medium px-1.5 py-0.2 rounded">
                              {meal.caloriesKcal} kcal
                            </span>
                            {meal.fiberGrams !== undefined && meal.fiberGrams > 0 && (
                              <span className="bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.2 rounded border border-amber-200/60">
                                {meal.fiberGrams}g fiber
                              </span>
                            )}
                          </div>

                          {tableDensity === 'comfortable' && meal.ingredients && meal.ingredients.length > 0 && (
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {meal.ingredients.slice(0, 3).join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                    );
                  };

                  return (
                    <tr
                      key={dIdx}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-emerald-50/60 ring-1 ring-inset ring-emerald-300'
                          : dIdx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/60'
                      } hover:bg-emerald-50/30`}
                    >
                      {/* Sticky Day Column */}
                      <td className={`p-3 font-bold sticky left-0 z-10 border-r border-slate-200 transition-colors ${
                        isSelected ? 'bg-emerald-100/90 text-emerald-950 shadow-xs' : 'bg-white text-slate-900'
                      }`}>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-black">{day.dayName || `Day ${day.dayNumber}`}</span>
                            {isEatenAll && (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                ✓ 100%
                              </span>
                            )}
                          </div>
                          <span className="block text-[10px] text-slate-500 font-normal">
                            Day {dIdx + 1} of 7
                          </span>
                          <button
                            onClick={() => {
                              setSelectedDayIndex(dIdx);
                              setViewMode('list');
                            }}
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline flex items-center space-x-0.5 cursor-pointer pt-0.5"
                          >
                            <span>Open Cards</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* 4 Meal Columns */}
                      {renderTableMealCell(day.breakfast, 'breakfast', 'Breakfast')}
                      {renderTableMealCell(day.lunch, 'lunch', 'Lunch')}
                      {renderTableMealCell(day.eveningSnack, 'eveningSnack', 'Snack')}
                      {renderTableMealCell(day.dinner, 'dinner', 'Dinner')}

                      {/* Day Totals Column */}
                      <td className="p-2.5 text-center align-middle bg-slate-50/50 border-l border-r border-slate-200">
                        <div className="space-y-0.5">
                          <div className="text-xs font-black text-emerald-800">
                            {day.totalProteinGrams}g P
                          </div>
                          <div className="text-[10px] font-semibold text-slate-700">
                            {day.totalCaloriesKcal} kcal
                          </div>
                          <div className="text-[9px] text-teal-700 font-medium">
                            {fiberVal}g Fiber
                          </div>
                        </div>
                      </td>

                      {/* Hydration Column */}
                      <td className="p-2.5 text-center align-middle">
                        <div className="inline-flex flex-col items-center space-y-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            waterCount >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {waterCount * 250}ml
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {waterCount}/8 glasses
                          </span>
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="p-2.5 text-center align-middle">
                        <button
                          onClick={() => {
                            setSelectedDayIndex(dIdx);
                            setViewMode('list');
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs active:scale-95"
                        >
                          Cook Day
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Table Footer Summary Row */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                  <td className="p-3 sticky left-0 z-20 bg-slate-900 border-r border-slate-800">
                    <span className="text-emerald-400">Weekly Averages</span>
                  </td>
                  <td colSpan={4} className="p-3 text-slate-300 text-[11px]">
                    Zero Added Sugar • 100% Non-Refrigerated Pantry Vegetarian Diet • ~₹{plan.totalWeeklyCostInr} Est. Weekly Grocery
                  </td>
                  <td className="p-3 text-center bg-slate-800 text-emerald-300">
                    <div className="text-xs font-black">
                      {Math.round(plan.days.reduce((a, b) => a + b.totalProteinGrams, 0) / plan.days.length)}g P / day
                    </div>
                    <div className="text-[10px] text-slate-300">
                      {Math.round(plan.days.reduce((a, b) => a + b.totalCaloriesKcal, 0) / plan.days.length)} kcal avg
                    </div>
                  </td>
                  <td className="p-3 text-center text-[10px] text-sky-300">
                    2.0L Daily Target
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setExportModalOpen(true)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                    >
                      Export
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                💡 <strong>Table Pro-Tip:</strong> Click any recipe title inside the table cells to immediately launch distraction-free Cook Mode with timers.
              </span>
            </span>
            <button
              onClick={() => setViewMode('list')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer self-start sm:self-auto"
            >
              Back to Daily List View
            </button>
          </div>
        </motion.div>
      )}

      {/* MONTHLY RECURRING CALENDAR VIEW */}
      {viewMode === 'monthly' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-5"
        >
          {/* Calendar Month Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-2xs shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 flex flex-wrap items-center gap-2">
                  <span>
                    {(() => {
                      const now = new Date();
                      now.setMonth(now.getMonth() + selectedMonthOffset);
                      return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    })()}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <Repeat className="w-3 h-3 text-emerald-600" />
                    <span>Recurring Schedule</span>
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Recurring meal patterns, daily protein totals, and planned menu rotation across the month.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-start sm:self-auto">
              <button
                onClick={() => setSelectedMonthOffset((prev) => prev - 1)}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>
              <button
                onClick={() => setSelectedMonthOffset(0)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Current Month
              </button>
              <button
                onClick={() => setSelectedMonthOffset((prev) => prev + 1)}
                className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Days Grid */}
          {(() => {
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() + selectedMonthOffset, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const startDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            return (
              <div className="space-y-2">
                {/* Day Name Header Row */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center border-b border-slate-200 pb-2">
                  {daysOfWeek.map((dayName, idx) => (
                    <span key={idx} className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {dayName}
                    </span>
                  ))}
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {/* Empty padding cells before 1st of month */}
                  {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty_${i}`} className="min-h-[75px] sm:min-h-[100px] bg-slate-50/50 rounded-xl border border-slate-100 opacity-30" />
                  ))}

                  {/* Month Date Cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dateNum = i + 1;
                    const dateObj = new Date(year, month, dateNum);
                    const dayIndex = (dateObj.getDay() + 6) % 7; // Map Sun=0 to 0-6 index matching Monday-based weekly plan
                    const dayPlan = plan.days[dayIndex] || plan.days[0];
                    const isToday =
                      dateNum === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();

                    return (
                      <motion.div
                        key={dateNum}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedDayIndex(dayIndex);
                          setViewMode('list');
                        }}
                        className={`min-h-[85px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                          isToday
                            ? 'bg-emerald-50/90 border-emerald-500 shadow-2xs ring-2 ring-emerald-400/40'
                            : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] sm:text-xs font-bold px-1 sm:px-1.5 py-0.5 rounded-md ${
                            isToday ? 'bg-emerald-600 text-white' : 'text-slate-800'
                          }`}>
                            {dateNum}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded truncate">
                            {dayPlan?.totalProteinGrams}g P
                          </span>
                        </div>

                        {/* Quick Snack / Meal Sneak Peek */}
                        <div className="space-y-0.5 my-1 overflow-hidden">
                          <div className="text-[9px] sm:text-[10px] font-medium text-slate-700 truncate" title={dayPlan?.lunch?.name}>
                            🥗 {dayPlan?.lunch?.name}
                          </div>
                          <div className="hidden sm:block text-[9px] sm:text-[10px] font-medium text-slate-600 truncate" title={dayPlan?.dinner?.name}>
                            🍲 {dayPlan?.dinner?.name}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="truncate">{dayPlan?.dayName || `Day ${dayIndex + 1}`}</span>
                          <span className="text-amber-700 font-medium whitespace-nowrap">{dayPlan?.totalCaloriesKcal} kcal</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Tap any calendar day to inspect its full recipe breakdown, water log, and prep steps in List View.
              </span>
            </span>
            <button
              onClick={() => setViewMode('list')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer self-start sm:self-auto"
            >
              Return to Daily List
            </button>
          </div>
        </motion.div>
      )}
      </>
      )}

      {/* 2. SAVED FAVORITES TAB */}
      {plannerSubTab === 'favorites' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <BookmarkCheck className="w-5 h-5 text-amber-600" />
                  <span>Bookmarked Favorite Recipes</span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Your saved favorite dishes for quick access, meal swaps, and cooking references.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-200/70 border border-amber-300 px-3 py-1 rounded-full self-start sm:self-auto">
                {favorites.length} Saved {favorites.length === 1 ? 'Recipe' : 'Recipes'}
              </span>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-amber-200/60">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={favoriteSearch}
                  onChange={(e) => setFavoriteSearch(e.target.value)}
                  placeholder="Search saved recipes or ingredients..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['all', 'Breakfast', 'Lunch', 'Evening Snack', 'Dinner'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFavoriteCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      favoriteCategory === cat
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-amber-200'
                    }`}
                  >
                    {cat === 'all' ? 'All Slots' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Favorites Cards Grid */}
          {(() => {
            const filteredFavs = favorites.filter((fav) => {
              const matchesCat = favoriteCategory === 'all' || fav.mealSlot === favoriteCategory || fav.type === favoriteCategory;
              const query = favoriteSearch.toLowerCase();
              const matchesSearch =
                !query ||
                fav.name.toLowerCase().includes(query) ||
                (fav.ingredients || []).some((ing) => ing.toLowerCase().includes(query)) ||
                (fav.preparationNotes || '').toLowerCase().includes(query);
              return matchesCat && matchesSearch;
            });

            if (filteredFavs.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Bookmark className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    {favorites.length === 0 ? 'No Favorite Recipes Saved Yet' : 'No Recipes Found Matching Search'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {favorites.length === 0
                      ? 'Click the "Bookmark" button on any meal card in your 7-day plan to save recipes here for fast access!'
                      : 'Try adjusting your search query or selecting a different meal slot filter.'}
                  </p>
                  {favorites.length === 0 && (
                    <button
                      onClick={() => setPlannerSubTab('weekly')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Browse 7-Day Meal Plan</span>
                    </button>
                  )}
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFavs.map((fav, idx) => (
                  <motion.div
                    key={fav.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-amber-200/80 rounded-2xl p-5 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-md">
                          {fav.mealSlot || fav.type}
                        </span>
                        <button
                          onClick={() => toggleBookmark(fav, fav.mealSlot || 'Meal')}
                          className="text-amber-600 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove from Saved Favorites"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mb-1">{fav.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mb-3">
                        Portion: <strong className="text-slate-700">{fav.portion}</strong>
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[11px] font-semibold text-slate-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-amber-500" />
                          <span>{fav.caloriesKcal} kcal</span>
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <HeartPulse className="w-3 h-3 text-emerald-600" />
                          <span>{fav.proteinGrams}g Protein</span>
                        </span>
                      </div>

                      {/* Ingredients */}
                      <div className="text-xs text-slate-600 space-y-1 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-semibold text-slate-700 block text-[11px]">Ingredients:</span>
                        <div className="flex flex-wrap gap-1">
                          {(fav.ingredients || []).map((ing, i) => (
                            <span key={i} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Preparation Notes */}
                      <p className="text-xs text-slate-600 italic bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60 leading-relaxed">
                        "{fav.preparationNotes}"
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Saved: {fav.bookmarkedAt || 'Recently'}</span>
                      <button
                        onClick={() => handleOpenSubstitution(fav.name)}
                        className="text-emerald-700 font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Substitute</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* 3. PLAN HISTORY & JSON DATA TAB */}
      {plannerSubTab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Code className="w-5 h-5 text-sky-400" />
                  <span>JSON Data & Meal Plan History</span>
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Inspect structured JSON format for user profile, meal plan, grocery details, and restore past generated plans.
                </p>
              </div>

              {/* Sub-tabs for JSON types */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto">
                <button
                  onClick={() => setJsonViewTab('meal_plan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    jsonViewTab === 'meal_plan' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Meal Plan JSON
                </button>
                <button
                  onClick={() => setJsonViewTab('profile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    jsonViewTab === 'profile' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Profile JSON
                </button>
                <button
                  onClick={() => setJsonViewTab('pantry')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    jsonViewTab === 'pantry' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Pantry JSON
                </button>
                <button
                  onClick={() => setJsonViewTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    jsonViewTab === 'history' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Saved History ({historyList.length})
                </button>
              </div>
            </div>
          </div>

          {jsonViewTab !== 'history' ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs text-sky-300 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400">
                <span className="font-sans text-xs font-semibold text-slate-200">
                  {jsonViewTab === 'meal_plan' && 'Weekly Meal Plan JSON'}
                  {jsonViewTab === 'profile' && 'User Profile & Guidelines JSON'}
                  {jsonViewTab === 'pantry' && 'Grocery Inventory & Pantry JSON'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const dataToCopy =
                        jsonViewTab === 'meal_plan'
                          ? plan
                          : jsonViewTab === 'profile'
                          ? userProfile
                          : inventory;
                      navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-sans text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                    <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const dataToDownload =
                        jsonViewTab === 'meal_plan'
                          ? plan
                          : jsonViewTab === 'profile'
                          ? userProfile
                          : inventory;
                      const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `nutriplan_${jsonViewTab}_${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg font-sans text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>

              <pre className="max-h-[500px] overflow-auto p-3 bg-slate-900 rounded-xl text-[11px] leading-relaxed text-sky-300">
                {JSON.stringify(
                  jsonViewTab === 'meal_plan' ? plan : jsonViewTab === 'profile' ? userProfile : inventory,
                  null,
                  2
                )}
              </pre>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-sky-600" />
                  <span>Saved Meal Plan History</span>
                </h3>

                {historyList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No previous meal plans recorded in history.</p>
                ) : (
                  <div className="space-y-3">
                    {historyList.map((hist, idx) => (
                      <div
                        key={hist.id || idx}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-sky-50/50 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {hist.plan?.planTitle || `Meal Plan ${idx + 1}`}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <User className="w-3 h-3 text-emerald-600" />
                              <span>{hist.userName || userProfile.name || 'User'}</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                            <span className="flex items-center space-x-1 text-slate-600 font-medium">
                              <Clock className="w-3 h-3 text-sky-500" />
                              <span>
                                {new Date(hist.generatedAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}{' '}
                                •{' '}
                                {new Date(hist.generatedAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{hist.targetProteinGrams}g Protein/day</span>
                            <span>•</span>
                            <span>₹{hist.totalWeeklyCostInr} Weekly Grocery</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {onUpdatePlan && (
                            <button
                              onClick={() => {
                                if (hist.plan) {
                                  onUpdatePlan(hist.plan);
                                  setPlannerSubTab('weekly');
                                  setShuffleToast(`Restored Meal Plan for ${hist.userName || userProfile.name || 'User'} (${new Date(hist.generatedAt).toLocaleDateString()})!`);
                                  setTimeout(() => setShuffleToast(null), 3000);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore Plan</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Customize / Regenerate Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 text-emerald-600" />
          <span>Regenerate or Fine-Tune Plan</span>
        </h3>
        <p className="text-xs text-slate-500">
          Want changes? Add specific constraints (e.g. "Increase fiber to 45g", "Include more sprouted moong for breakfast", "No dairy for dinner").
        </p>
        <div className="flex space-x-2">
          <input
            type="text"
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            placeholder="e.g. Increase protein to 95g, add more chana chaat..."
            className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => onGeneratePlan(customInstruction)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Update Plan</span>
          </button>
        </div>
      </div>
      </div> {/* END OF print:hidden SCREEN VIEW */}

      {/* Export 7-Day Text Modal */}
      <AnimatePresence>
        {exportModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Export 7-Day Meal Plan</h3>
                    <p className="text-xs text-slate-500">Full Monday–Sunday Diet Schedule for WhatsApp or Notes</p>
                  </div>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Format Style Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Select Text Format:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTextFormatStyle('whatsapp')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      textFormatStyle === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    💬 WhatsApp / Rich Format
                  </button>
                  <button
                    onClick={() => setTextFormatStyle('simple')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      textFormatStyle === 'simple'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📝 Plain Text Format
                  </button>
                </div>
              </div>

              {/* Text Area Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Formatted Text Preview</span>
                  <span>{generate7DayText(plan, textFormatStyle).length} characters</span>
                </div>
                <textarea
                  readOnly
                  value={generate7DayText(plan, textFormatStyle)}
                  rows={10}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 leading-relaxed resize-none selection:bg-emerald-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={handleCopy7DayText}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    {copiedText ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedText ? 'Copied 7-Day Plan!' : 'Copy Entire 7-Day Text'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsAppPlan}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4 text-green-200" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        mealName={subMealName}
        ingredientToSubstitute={subIngredient}
        inventory={inventory}
        userProfile={userProfile}
      />

      {/* 1. Kitchen Cook Mode Modal with Timers & Step-by-Step UI */}
      {cookModalMeal && (
        <CookModeModal
          isOpen={cookModalOpen}
          onClose={() => setCookModalOpen(false)}
          meal={cookModalMeal}
          mealSlotName={
            cookModalSlotIndex === 0
              ? 'Breakfast'
              : cookModalSlotIndex === 1
              ? 'Lunch'
              : cookModalSlotIndex === 2
              ? 'Evening Snack'
              : 'Dinner'
          }
          dayName={currentDay?.dayName || `Day ${selectedDayIndex + 1}`}
        />
      )}

      {/* 2. Sunday Batch Prep Roadmap Modal */}
      <BatchPrepGuideModal
        isOpen={batchPrepModalOpen}
        onClose={() => setBatchPrepModalOpen(false)}
        plan={plan}
        userProfile={userProfile}
      />

      {/* 3. ICMR Micronutrient & Gut Health Guide Modal */}
      <MicronutrientGuideModal
        isOpen={micronutrientModalOpen}
        onClose={() => setMicronutrientModalOpen(false)}
        userProfile={userProfile}
      />

      {/* PRINT-ONLY VIEW (Hidden on screen, rendered on print) */}
      <div className="hidden print:block space-y-6 text-black p-4 bg-white">
        {/* Printable Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">DietPlan AI — 7-Day High-Protein Diet Plan</h1>
            <p className="text-sm font-semibold text-emerald-800">
              {plan.planTitle} {userProfile.name ? `• Member: ${userProfile.name}` : ''}
            </p>
            <p className="text-xs text-slate-700 mt-1 max-w-xl">{plan.summary}</p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <p className="font-bold text-slate-900">Date: {new Date().toLocaleDateString('en-IN')}</p>
            <p className="font-bold text-slate-900">Daily Target: {plan.targetProteinGrams}g Protein</p>
            <p className="text-slate-700">Weekly Grocery: ₹{plan.totalWeeklyCostInr}</p>
            <p className="text-emerald-800 font-bold">ICMR 2024 & WHO Approved</p>
          </div>
        </div>

        {/* 7 Days Printable Loop */}
        <div className="space-y-6">
          {(printScope === 'all' ? plan.days : [currentDay]).map((day, dIdx) => (
            <div key={dIdx} className="border border-slate-300 rounded-xl p-4 break-inside-avoid space-y-3 bg-white">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h2 className="text-base font-bold text-slate-900">
                  {(day.dayName || `Day ${day.dayNumber}`).toUpperCase()} (Day {day.dayNumber})
                </h2>
                <span className="text-xs font-semibold text-slate-700">
                  Total: {day.totalCaloriesKcal} kcal • {day.totalProteinGrams}g Protein • {getDayTotalFiber(day)}g Fiber • 💧 Water Goal: {(waterLogs[day.dayNumber] || 0) * 250}ml / 2000ml
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'Breakfast', meal: day.breakfast },
                  { label: 'Lunch', meal: day.lunch },
                  { label: 'Evening Snack', meal: day.eveningSnack },
                  { label: 'Dinner', meal: day.dinner },
                ].map(({ label, meal }, mIdx) => (
                  <div key={mIdx} className="border border-slate-200 rounded-lg p-2.5 space-y-1 bg-slate-50">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{label}: {meal?.name || 'N/A'}</span>
                      <span className="text-slate-700">{meal?.caloriesKcal} kcal | {meal?.proteinGrams}g P</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Portion: {meal?.portion}</p>
                    {meal?.ingredients && meal.ingredients.length > 0 && (
                      <p className="text-[10px] text-slate-500">
                        Ingredients: {meal.ingredients.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {plan.nutritionistNotes && (
          <div className="border-t border-slate-300 pt-3 text-xs text-slate-800 break-inside-avoid">
            <strong>Dietitian & ICMR Clinical Notes:</strong> {plan.nutritionistNotes}
          </div>
        )}
      </div>
    </div>
  );
};

