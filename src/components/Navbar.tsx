import React from 'react';
import { Calendar, MessageSquare, ShoppingBag, UtensilsCrossed, User, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'planner' | 'chat' | 'pantry' | 'shopping' | 'profile';
  setActiveTab: (tab: 'planner' | 'chat' | 'pantry' | 'shopping' | 'profile') => void;
  onLoadPreset: (preset: 'full' | 'low' | 'high_protein') => void;
  isGeneratingPlan: boolean;
  onGeneratePlan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLoadPreset,
  isGeneratingPlan,
  onGeneratePlan,
}) => {
  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('planner')}>
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">NutriPlan AI</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ICMR & WHO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal hidden sm:block">
                Vegetarian • Zero Added Sugar • Pantry-Aware
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'planner'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden md:inline">7-Day Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden md:inline">AI Dietitian</span>
            </button>

            <button
              onClick={() => setActiveTab('pantry')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'pantry'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden md:inline">Pantry Stock</span>
            </button>

            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'shopping'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden md:inline">Grocery & Budget</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-emerald-50 text-emerald-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Profile & Rules</span>
            </button>
          </nav>

          {/* Quick Action */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onGeneratePlan}
              disabled={isGeneratingPlan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              {isGeneratingPlan ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate Meal Plan</span>
                  <span className="sm:hidden">Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Pantry Presets Bar */}
        <div className="py-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="font-medium text-slate-500 whitespace-nowrap">Load Preset Pantry:</span>
            <button
              onClick={() => onLoadPreset('full')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-md transition-colors text-slate-700 whitespace-nowrap"
            >
              🥬 Full Stock
            </button>
            <button
              onClick={() => onLoadPreset('low')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 rounded-md transition-colors text-slate-700 whitespace-nowrap"
            >
              📦 Low Stock (No Dairy)
            </button>
            <button
              onClick={() => onLoadPreset('high_protein')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 rounded-md transition-colors text-slate-700 whitespace-nowrap"
            >
              💪 High Protein (100g)
            </button>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-slate-500">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
            <span>Target Budget: ₹150–₹200/day</span>
          </div>
        </div>
      </div>
    </header>
  );
};
