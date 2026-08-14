import React from 'react';
import { UserProfile } from '../types';
import { User, ShieldCheck, HeartPulse, Sparkles, Scale, Info, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface ProfileAndGuidelinesViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSaveProfile: () => void;
}

export const ProfileAndGuidelinesView: React.FC<ProfileAndGuidelinesViewProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfile,
}) => {
  const commonAllergies = ['Peanuts', 'Tree Nuts', 'Gluten', 'Dairy / Lactose', 'Soy', 'Sesame', 'Coconut'];

  const toggleAllergy = (allergy: string) => {
    setUserProfile((prev) => {
      const exists = prev.allergies.includes(allergy);
      return {
        ...prev,
        allergies: exists ? prev.allergies.filter((a) => a !== allergy) : [...prev.allergies, allergy],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">User Profile & Dietary Targets</h2>
            <p className="text-xs text-slate-500">
              Configure your body metrics, protein targets, budget bounds, and allergen restrictions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Age (Years)</label>
            <input
              type="number"
              value={userProfile.age}
              onChange={(e) => setUserProfile({ ...userProfile, age: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gender</label>
            <select
              value={userProfile.gender}
              onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              value={userProfile.weightKg}
              onChange={(e) => setUserProfile({ ...userProfile, weightKg: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
            <input
              type="number"
              value={userProfile.heightCm}
              onChange={(e) => setUserProfile({ ...userProfile, heightCm: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Activity Level</label>
            <select
              value={userProfile.activityLevel}
              onChange={(e) => setUserProfile({ ...userProfile, activityLevel: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            >
              <option value="sedentary">Sedentary (Desk Job)</option>
              <option value="lightly_active">Lightly Active (1-3 days exercise)</option>
              <option value="moderately_active">Moderately Active (3-5 days exercise)</option>
              <option value="very_active">Very Active (Heavy training)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Daily Protein Goal (g)</label>
            <input
              type="number"
              value={userProfile.proteinTargetGrams}
              onChange={(e) => setUserProfile({ ...userProfile, proteinTargetGrams: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Daily Calorie Target (kcal)</label>
            <input
              type="number"
              value={userProfile.calorieTargetKcal}
              onChange={(e) => setUserProfile({ ...userProfile, calorieTargetKcal: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Daily Budget Target (₹ INR)</label>
            <input
              type="number"
              value={userProfile.dailyBudgetInr}
              onChange={(e) => setUserProfile({ ...userProfile, dailyBudgetInr: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>
        </div>

        {/* Allergy Filter Toggles */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Food Allergens to Exclude:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map((allergy) => {
              const isSelected = userProfile.allergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all ${
                    isSelected
                      ? 'bg-red-50 text-red-700 border-red-300 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? `✓ Exclude ${allergy}` : `+ ${allergy}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onSaveProfile}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            Save Profile & Preferences
          </button>
        </div>
      </div>

      {/* ICMR / WHO Nutrition Guidelines Reference Card */}
      <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-xs rounded-xl flex items-center justify-center">
            <HeartPulse className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">ICMR / NIN (2024) & WHO Nutrition Guidelines</h2>
            <p className="text-xs text-slate-300">Scientific baseline for vegetarian zero-added-sugar meal planning</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
            <h3 className="font-bold text-emerald-300 flex items-center space-x-1.5">
              <Scale className="w-4 h-4" />
              <span>Macro Ratio (ICMR 2024)</span>
            </h3>
            <p className="text-slate-200 leading-relaxed">
              • Carbs: 50–60% of energy (whole wheat, unpolished rice)<br />
              • Protein: 10–15%+ of energy (dal + cereal combo)<br />
              • Healthy Fats: 20–30% (nuts, seeds, moderate oil)
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
            <h3 className="font-bold text-emerald-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>WHO Free Sugar Rule</span>
            </h3>
            <p className="text-slate-200 leading-relaxed">
              • Limit free sugars to &lt;10% energy (preferably &lt;5%).<br />
              • <strong>NutriPlan AI Rule:</strong> Zero added sugar. Only natural fruit sugars & unflavored dairy.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
            <h3 className="font-bold text-emerald-300 flex items-center space-x-1.5">
              <Info className="w-4 h-4" />
              <span>Fruit & Veg Servings</span>
            </h3>
            <p className="text-slate-200 leading-relaxed">
              • Minimum 5 servings (≥400g) of vegetables and fresh seasonal fruits daily to supply micronutrients & fiber.
            </p>
          </div>
        </div>

        {/* High Protein Staples Chart */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Key Non-Refrigerated Vegetarian Protein Sources (per 100g raw)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-200">
            <div className="bg-white/5 p-2 rounded-lg">Soya Chunks: <strong>52g Protein</strong></div>
            <div className="bg-white/5 p-2 rounded-lg">Roasted Chana: <strong>22g Protein</strong></div>
            <div className="bg-white/5 p-2 rounded-lg">Toor / Moong Dal: <strong>24g Protein</strong></div>
            <div className="bg-white/5 p-2 rounded-lg">Chia / Flax Seeds: <strong>18g Protein</strong></div>
          </div>
        </div>

        {/* Medical & Privacy Disclaimer */}
        <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
          <p>
            <strong>Regulatory & Privacy Disclaimer:</strong> NutriPlan AI provides general informational meal suggestions based on published dietary guidelines. It is not a licensed medical diagnosis tool. Users with clinical conditions (diabetes, chronic kidney disease, severe food allergies) should consult a registered dietitian or doctor.
          </p>
        </div>
      </div>
    </div>
  );
};
