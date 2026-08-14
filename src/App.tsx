import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MealPlannerView } from './components/MealPlannerView';
import { ChatAssistantView } from './components/ChatAssistantView';
import { PantryManagerView } from './components/PantryManagerView';
import { ShoppingTrackerView } from './components/ShoppingTrackerView';
import { ProfileAndGuidelinesView } from './components/ProfileAndGuidelinesView';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { apiFetch } from './lib/api';

import { UserProfile, PantryItem, WeeklyMealPlan } from './types';
import {
  DEFAULT_USER_PROFILE,
  PRESET_FULL_PANTRY,
  PRESET_LOW_STOCK,
  PRESET_HIGH_PROTEIN,
} from './data/pantryPresets';
import {
  saveUserProfileStorage,
  loadUserProfileStorage,
  saveMealPlanStorage,
  loadMealPlanStorage,
  saveInventoryStorage,
  loadInventoryStorage,
  addPlanToHistory,
} from './lib/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'planner' | 'chat' | 'pantry' | 'shopping' | 'profile'>('planner');

  // Load initial state from Cookies / LocalStorage persistence
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    return loadUserProfileStorage() || DEFAULT_USER_PROFILE;
  });

  const [inventory, setInventory] = useState<PantryItem[]>(() => {
    return loadInventoryStorage() || PRESET_FULL_PANTRY;
  });

  const [plan, setPlan] = useState<WeeklyMealPlan | null>(() => {
    return loadMealPlanStorage();
  });

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);

  // Sync user profile & inventory changes to persistent storage
  useEffect(() => {
    saveUserProfileStorage(userProfile);
  }, [userProfile]);

  useEffect(() => {
    saveInventoryStorage(inventory);
  }, [inventory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleLoadPreset = (preset: 'full' | 'low' | 'high_protein') => {
    let newInventory = inventory;
    if (preset === 'full') {
      newInventory = PRESET_FULL_PANTRY;
      setUserProfile((prev) => ({ ...prev, proteinTargetGrams: 80, dailyBudgetInr: 175 }));
      showToast('Loaded Full Stock Pantry (Dals, Rice, Soya, Fruits, Dairy)');
    } else if (preset === 'low') {
      newInventory = PRESET_LOW_STOCK;
      setUserProfile((prev) => ({ ...prev, proteinTargetGrams: 75, dailyBudgetInr: 150 }));
      showToast('Loaded Low Stock Pantry (No Dairy, No Fresh Sprouts)');
    } else if (preset === 'high_protein') {
      newInventory = PRESET_HIGH_PROTEIN;
      setUserProfile((prev) => ({ ...prev, proteinTargetGrams: 100, dailyBudgetInr: 195 }));
      showToast('Loaded High Protein Pantry (100g Target with extra Soya & Kala Chana)');
    }
    setInventory(newInventory);
    saveInventoryStorage(newInventory);
  };

  const handleGeneratePlan = async (customPrompt?: string) => {
    setLoadingPlan(true);
    try {
      const data = await apiFetch('/api/generate-meal-plan', {
        method: 'POST',
        body: JSON.stringify({
          userProfile,
          inventory,
          customPrompt,
        }),
      });

      setPlan(data);
      saveMealPlanStorage(data);
      addPlanToHistory(data, userProfile.name);
      setActiveTab('planner');
      showToast('Successfully generated 7-Day Vegetarian Meal Plan!');
    } catch (err: any) {
      console.error('Plan generation error:', err);
      showToast(`Generation Error: ${err.message || 'Server error'}`);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleUpdatePlan = (updatedPlan: WeeklyMealPlan) => {
    setPlan(updatedPlan);
    saveMealPlanStorage(updatedPlan);
  };

  // Auto generate initial plan on mount ONLY if no saved plan exists
  useEffect(() => {
    const savedPlan = loadMealPlanStorage();
    if (!savedPlan && !plan && !loadingPlan) {
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
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
      />

      {/* Google Drive Integration Modal */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        inventory={inventory}
        setInventory={setInventory}
        plan={plan}
        setPlan={(newPlan) => setPlan(newPlan)}
        showToast={showToast}
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
            onUpdatePlan={handleUpdatePlan}
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
