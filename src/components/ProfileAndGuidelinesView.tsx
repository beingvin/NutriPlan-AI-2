import React, { useState } from 'react';
import { UserProfile, FamilyMemberProfile } from '../types';
import {
  User, ShieldCheck, HeartPulse, Sparkles, Scale, Info, CheckCircle2,
  AlertCircle, FileText, Users, Plus, Trash2, Check, RefreshCw
} from 'lucide-react';
import {
  saveFamilyProfilesStorage,
  loadFamilyProfilesStorage,
  saveActiveMemberIdStorage,
  loadActiveMemberIdStorage
} from '../lib/storage';

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

  // Multi-Member Profiles State
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberProfile[]>(() => {
    const saved = loadFamilyProfilesStorage();
    if (saved && saved.length > 0) return saved;
    return [
      {
        ...userProfile,
        id: 'member_self',
        name: userProfile.name || 'Self (Primary)',
        isDefault: true,
        avatarColor: 'bg-emerald-600',
      },
    ];
  });

  const [activeMemberId, setActiveMemberId] = useState<string>(() => {
    return loadActiveMemberIdStorage() || 'member_self';
  });

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Spouse' | 'Parent' | 'Child' | 'Sibling' | 'Roommate'>('Spouse');
  const [newMemberGoal, setNewMemberGoal] = useState<'fat_loss' | 'muscle_gain' | 'maintenance' | 'budget_planning'>('maintenance');

  // Handle switching active family member
  const handleSelectMember = (member: FamilyMemberProfile) => {
    setActiveMemberId(member.id);
    saveActiveMemberIdStorage(member.id);
    setUserProfile({
      ...member,
    });
  };

  // Add new family member
  const handleAddNewMember = () => {
    if (!newMemberName.trim()) return;

    let defaultProtein = 70;
    let defaultCalories = 1800;
    if (newMemberGoal === 'muscle_gain') {
      defaultProtein = 95;
      defaultCalories = 2200;
    } else if (newMemberGoal === 'fat_loss') {
      defaultProtein = 80;
      defaultCalories = 1600;
    }

    const newMember: FamilyMemberProfile = {
      id: `member_${Date.now()}`,
      name: `${newMemberName.trim()} (${newMemberRole})`,
      age: newMemberRole === 'Parent' ? 58 : newMemberRole === 'Child' ? 14 : 28,
      gender: newMemberRole === 'Child' ? 'other' : 'female',
      heightCm: 165,
      weightKg: 62,
      activityLevel: 'moderately_active',
      goal: newMemberGoal,
      proteinTargetGrams: defaultProtein,
      calorieTargetKcal: defaultCalories,
      allergies: [],
      dietaryPreferences: 'Pure Vegetarian, Low Oil',
      dailyBudgetInr: 160,
      avatarColor: newMemberRole === 'Parent' ? 'bg-amber-600' : newMemberRole === 'Spouse' ? 'bg-sky-600' : 'bg-purple-600',
    };

    const updatedList = [...familyMembers, newMember];
    setFamilyMembers(updatedList);
    saveFamilyProfilesStorage(updatedList);
    handleSelectMember(newMember);
    setNewMemberName('');
    setShowAddMemberModal(false);
  };

  const handleDeleteMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (familyMembers.length <= 1) return;
    const filtered = familyMembers.filter((m) => m.id !== id);
    setFamilyMembers(filtered);
    saveFamilyProfilesStorage(filtered);
    if (activeMemberId === id) {
      handleSelectMember(filtered[0]);
    }
  };

  const toggleAllergy = (allergy: string) => {
    setUserProfile((prev) => {
      const exists = prev.allergies.includes(allergy);
      const updated = {
        ...prev,
        allergies: exists ? prev.allergies.filter((a) => a !== allergy) : [...prev.allergies, allergy],
      };
      // Also update in family list
      const updatedList = familyMembers.map((m) => (m.id === activeMemberId ? { ...m, ...updated } : m));
      setFamilyMembers(updatedList);
      saveFamilyProfilesStorage(updatedList);
      return updated;
    });
  };

  const handleSaveAndSync = () => {
    const updatedList = familyMembers.map((m) => (m.id === activeMemberId ? { ...m, ...userProfile } : m));
    setFamilyMembers(updatedList);
    saveFamilyProfilesStorage(updatedList);
    onSaveProfile();
  };

  // Recommended protein calculator based on ICMR 2024
  const recommendedProteinMin = Math.round(userProfile.weightKg * 0.83); // ICMR RDA Baseline
  const recommendedProteinActive = Math.round(userProfile.weightKg * 1.2); // Active Fitness Target

  return (
    <div className="space-y-6">
      
      {/* 1. Multi-Member / Family Profile Switcher Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Multi-Member & Household Profiles</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Manage Family Diets Under One Pantry</h2>
            <p className="text-xs text-slate-500">
              Switch profiles to tailor separate protein goals and diet charts for each member while sharing household pantry stock.
            </p>
          </div>

          <button
            onClick={() => setShowAddMemberModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Family Member</span>
          </button>
        </div>

        {/* Member Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {familyMembers.map((member) => {
            const isActive = member.id === activeMemberId;
            return (
              <div
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/30 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className={`w-9 h-9 rounded-xl ${member.avatarColor || 'bg-emerald-600'} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                    {(member.name || 'Member').charAt(0).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-xs text-slate-900 truncate">{member.name || 'Family Member'}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {member.proteinTargetGrams}g Protein • {member.calorieTargetKcal} kcal
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {isActive ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : familyMembers.length > 1 ? (
                    <button
                      onClick={(e) => handleDeleteMember(member.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Active Member Profile Form */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Editing Profile: <span className="text-emerald-700">{userProfile.name || 'Active Member'}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Configure body metrics, daily protein goals, and allergen restrictions for this profile.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="sm:col-span-2 lg:col-span-4 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="block font-bold text-slate-800 mb-1 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profile / Member Name</span>
              </label>
              <input
                type="text"
                value={userProfile.name || ''}
                placeholder="e.g. Vini, Priya, Dad"
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 text-xs shadow-2xs"
              />
            </div>
            <div className="text-[11px] text-slate-600 sm:max-w-xs space-y-0.5">
              <span className="font-bold text-emerald-900 block">ICMR Protein Benchmark:</span>
              <span>Sedentary RDA: ~<strong>{recommendedProteinMin}g</strong> • Active Goal: ~<strong>{recommendedProteinActive}g</strong></span>
            </div>
          </div>

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
            <label className="block font-semibold text-slate-700 mb-1">Dietary Focus / Goal</label>
            <select
              value={userProfile.goal}
              onChange={(e) => setUserProfile({ ...userProfile, goal: e.target.value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="maintenance">General Maintenance (Health)</option>
              <option value="muscle_gain">Muscle Building / Hypertrophy</option>
              <option value="fat_loss">Fat Loss & Caloric Deficit</option>
              <option value="budget_planning">Budget Planning (Staples Focus)</option>
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
            <span>Food Allergens to Exclude for {userProfile.name}:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map((allergy) => {
              const isSelected = userProfile.allergies.includes(allergy);
              return (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
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
            onClick={handleSaveAndSync}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Profile & Sync Meal Plan</span>
          </button>
        </div>
      </div>

      {/* 3. Add Family Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>Add Household Member</span>
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Member Name</label>
                <input
                  type="text"
                  placeholder="e.g. Priya, Rahul, Mom"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Relationship</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Parent">Parent / Senior</option>
                  <option value="Child">Child / Teenager</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Roommate">Roommate</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Primary Fitness / Health Goal</label>
                <select
                  value={newMemberGoal}
                  onChange={(e) => setNewMemberGoal(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="maintenance">General Maintenance (Health & Energy)</option>
                  <option value="muscle_gain">Muscle Building (High Protein ~95g)</option>
                  <option value="fat_loss">Fat Loss (Deficit with ~80g Protein)</option>
                  <option value="budget_planning">Budget Planning (Staples Focus)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewMember}
                disabled={!newMemberName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Create Member Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ICMR / WHO Nutrition Guidelines Reference Card */}
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
              • <strong>DietPlan AI Rule:</strong> Zero added sugar. Only natural fruit sugars & unflavored dairy.
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
            <strong>Regulatory & Privacy Disclaimer:</strong> DietPlan AI provides general informational meal suggestions based on published dietary guidelines. It is not a licensed medical diagnosis tool. Users with clinical conditions (diabetes, chronic kidney disease, severe food allergies) should consult a registered dietitian or doctor.
          </p>
        </div>
      </div>
    </div>
  );
};
