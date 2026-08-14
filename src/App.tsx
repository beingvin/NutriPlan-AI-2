import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MealPlannerView } from './components/MealPlannerView';
import { ChatAssistantView } from './components/ChatAssistantView';
import { PantryManagerView } from './components/PantryManagerView';
import { ShoppingTrackerView } from './components/ShoppingTrackerView';
import { ProfileAndGuidelinesView } from './components/ProfileAndGuidelinesView';

import { UserProfile, PantryItem, WeeklyMealPlan } from './types';
import {
  DEFAULT_USER_PROFILE,
  PRESET_FULL_PANTRY,
  PRESET_LOW_STOCK,
  PRESET_HIGH_PROTEIN,
} from './data/pantryPresets';

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'chat' | 'pantry' | 'shopping' | 'profile'>('planner');
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [inventory, setInventory] = useState<PantryItem[]>(PRESET_FULL_PANTRY);
  const [plan, setPlan] = useState<WeeklyMealPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoadPreset = (preset: 'full' | 'low' | 'high_protein') => {
    if (preset === 'full') {
      setInventory(PRESET_FULL_PANTRY);
      setUserProfile((prev) => ({ ...prev, proteinTargetGrams: 80, dailyBudgetInr: 175 }));
      showToast('Loaded Full Stock Pantry (Dals, Rice, Soya, Fruits, Dairy)');
    } else if (preset === 'low') {
      setInventory(PRESET_LOW_STOCK);
      setUserProfile((prev) => ({ ...prev, proteinTargetGrams: 75, dailyBudgetInr: 150 }));
      showToast('Loaded Low Stock Pantry (No Dairy, No Fresh Sprouts)');
    } else if (preset === 'high_protein') {
      setInventory(PRESET_HIGH_PROTEIN);
      setUserProfile((prev) => ({ ...prev, proteinTargetGrams: 100, dailyBudgetInr: 195 }));
      showToast('Loaded High Protein Pantry (100g Target with extra Soya & Kala Chana)');
    }
  };

  const handleGeneratePlan = async (customPrompt?: string) => {
    setLoadingPlan(true);
    try {
      const response = await fetch('/api/generate-meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          inventory,
          customPrompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate 7-day meal plan');
      const data = await response.json();
      setPlan(data);
      setActiveTab('planner');
      showToast('Successfully generated 7-Day Vegetarian Meal Plan!');
    } catch (err: any) {
      console.error('Plan generation error:', err);
      showToast(`Generation Error: ${err.message || 'Server error'}`);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Auto generate initial plan on mount if not available
  useEffect(() => {
    if (!plan && !loadingPlan) {
      handleGeneratePlan();
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLoadPreset={handleLoadPreset}
        isGeneratingPlan={loadingPlan}
        onGeneratePlan={() => handleGeneratePlan()}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg border border-slate-700 animate-bounce flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'planner' && (
          <MealPlannerView
            plan={plan}
            loading={loadingPlan}
            onGeneratePlan={handleGeneratePlan}
            inventory={inventory}
            userProfile={userProfile}
          />
        )}

        {activeTab === 'chat' && (
          <ChatAssistantView inventory={inventory} userProfile={userProfile} />
        )}

        {activeTab === 'pantry' && (
          <PantryManagerView
            inventory={inventory}
            setInventory={setInventory}
            onLoadPreset={handleLoadPreset}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingTrackerView plan={plan} dailyBudgetInr={userProfile.dailyBudgetInr} />
        )}

        {activeTab === 'profile' && (
          <ProfileAndGuidelinesView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            onSaveProfile={() => {
              showToast('Saved user profile & nutrition parameters!');
              handleGeneratePlan();
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-500 py-4 text-center text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>NutriPlan AI</strong> • Personalized Vegetarian & Zero-Added-Sugar Diet Planner
          </span>
          <span>Aligned with ICMR/NIN (2024), WHO Free Sugar Rules & Indian Price Monitoring Data</span>
        </div>
      </footer>
    </div>
  );
}
