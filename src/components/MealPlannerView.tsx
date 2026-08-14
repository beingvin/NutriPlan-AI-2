import React, { useState } from 'react';
import { WeeklyMealPlan, Meal, PantryItem, UserProfile } from '../types';
import { SubstitutionModal } from './SubstitutionModal';
import { Sparkles, CheckCircle2, ShieldCheck, RefreshCw, Printer, AlertTriangle, ArrowRightLeft, Leaf, Flame, HeartPulse } from 'lucide-react';

interface MealPlannerViewProps {
  plan: WeeklyMealPlan | null;
  loading: boolean;
  onGeneratePlan: (customPrompt?: string) => void;
  inventory: PantryItem[];
  userProfile: UserProfile;
}

export const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  plan,
  loading,
  onGeneratePlan,
  inventory,
  userProfile,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [customInstruction, setCustomInstruction] = useState('');
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [subMealName, setSubMealName] = useState('');
  const [subIngredient, setSubIngredient] = useState('');

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

  const handleOpenSubstitution = (mealName: string, ingredient: string = '') => {
    setSubMealName(mealName);
    setSubIngredient(ingredient);
    setSubModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const renderMealCard = (meal: Meal, label: string) => {
    if (!meal) return null;
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-emerald-300 transition-all shadow-xs flex flex-col justify-between space-y-4">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              {label}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>{meal.caloriesKcal} kcal</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <HeartPulse className="w-3 h-3 text-emerald-600" />
                <span>{meal.proteinGrams}g Protein</span>
              </span>
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 mb-1">{meal.name}</h3>
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
                <span
                  key={i}
                  onClick={() => handleOpenSubstitution(meal.name, ing)}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-[11px] hover:border-emerald-400 hover:text-emerald-700 cursor-pointer transition-colors"
                  title="Click to substitute"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Preparation Notes */}
          <p className="text-xs text-slate-600 leading-relaxed italic bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50">
            "{meal.preparationNotes}"
          </p>
        </div>

        {/* Swap button */}
        <button
          onClick={() => handleOpenSubstitution(meal.name)}
          className="w-full text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 py-2 rounded-xl border border-slate-200 hover:border-emerald-200 flex items-center justify-center space-x-1.5 transition-all"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Substitute / Swap Item</span>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Plan Summary Bar */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>7-Day Vegetarian Meal Plan</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{plan.planTitle}</h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{plan.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-[10px] text-emerald-300 font-semibold uppercase">Daily Protein</span>
              <span className="text-base font-bold text-white">{plan.targetProteinGrams}g / day</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-[10px] text-emerald-300 font-semibold uppercase">Weekly Grocery</span>
              <span className="text-base font-bold text-white">₹{plan.totalWeeklyCostInr}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="block text-[10px] text-emerald-300 font-semibold uppercase">ICMR Score</span>
              <span className="text-base font-bold text-emerald-300">{plan.icmrComplianceScore}/100</span>
            </div>
            <button
              onClick={handlePrint}
              className="bg-white text-slate-900 hover:bg-emerald-50 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Print / Export</span>
            </button>
          </div>
        </div>

        {/* Allergen Warning Banner */}
        {plan.allergenWarnings && plan.allergenWarnings.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center space-x-2 text-xs text-amber-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Allergen Safety Status:</strong> {plan.allergenWarnings.join(' • ')}
            </span>
          </div>
        )}
      </div>

      {/* Days Tab Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
        {plan.days.map((day, index) => {
          const isActive = index === selectedDayIndex;
          return (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex flex-col items-center min-w-[100px] border ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <span>{day.dayName || `Day ${day.dayNumber}`}</span>
              <span className={`text-[10px] font-normal ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                {day.totalProteinGrams}g Protein • {day.totalCaloriesKcal} kcal
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Day Breakdown Header */}
      <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 p-4 rounded-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs">
            {currentDay.dayNumber}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{currentDay.dayName} Menu</h2>
            <p className="text-xs text-slate-600">
              Balanced vegetarian menu designed to hit <strong className="text-emerald-800">{currentDay.totalProteinGrams}g protein</strong> & <strong className="text-slate-800">{currentDay.totalCaloriesKcal} kcal</strong> with zero added sugar.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs">
          <span className="bg-white border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-semibold">
            ✓ 5+ Veg/Fruit Servings
          </span>
        </div>
      </div>

      {/* Meal Grid (4 Meals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {renderMealCard(currentDay.breakfast, 'Breakfast')}
        {renderMealCard(currentDay.lunch, 'Lunch')}
        {renderMealCard(currentDay.eveningSnack, 'Evening Snack')}
        {renderMealCard(currentDay.dinner, 'Dinner')}
      </div>

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

      {/* Customize / Regenerate Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <RefreshCw className="w-4 h-4 text-emerald-600" />
          <span>Regenerate or Fine-Tune Plan</span>
        </h3>
        <p className="text-xs text-slate-500">
          Want changes? Add specific constraints (e.g. "Include more sprouted moong for breakfast", "No dairy for dinner", "Increase budget to ₹200").
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

      {/* Substitution Modal */}
      <SubstitutionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        mealName={subMealName}
        ingredientToSubstitute={subIngredient}
        inventory={inventory}
        userProfile={userProfile}
      />
    </div>
  );
};
