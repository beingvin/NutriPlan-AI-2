import React, { useState } from 'react';
import {
  Calendar, MessageSquare, ShoppingBag, UtensilsCrossed, User,
  ShieldAlert, Sparkles, RefreshCw, HardDrive, Menu, X, ChevronRight,
  Flame, Salad, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  activeTab: 'planner' | 'chat' | 'pantry' | 'shopping' | 'profile';
  setActiveTab: (tab: 'planner' | 'chat' | 'pantry' | 'shopping' | 'profile') => void;
  onLoadPreset: (preset: 'full' | 'low' | 'high_protein') => void;
  isGeneratingPlan: boolean;
  onGeneratePlan: () => void;
  onOpenDriveModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onLoadPreset,
  isGeneratingPlan,
  onGeneratePlan,
  onOpenDriveModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'planner', label: '7-Day Plan', shortLabel: 'Plan', icon: Calendar, desc: 'Daily menus & macros' },
    { id: 'chat', label: 'AI Dietitian', shortLabel: 'Dietitian', icon: MessageSquare, desc: 'ICMR nutrition chat' },
    { id: 'pantry', label: 'Pantry Stock', shortLabel: 'Pantry', icon: UtensilsCrossed, desc: 'Manage ingredients' },
    { id: 'shopping', label: 'Grocery & Budget', shortLabel: 'Groceries', icon: ShoppingBag, desc: 'Price monitoring & list' },
    { id: 'profile', label: 'Profile & Rules', shortLabel: 'Profile', icon: User, desc: 'Family members & goals' },
  ];

  return (
    <>
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo */}
            <div
              className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer shrink-0"
              onClick={() => {
                setActiveTab('planner');
                setMobileMenuOpen(false);
              }}
            >
              <div className="bg-emerald-600 text-white p-2 sm:p-2.5 rounded-xl shadow-xs flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-black text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight">DietPlan AI</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider hidden sm:inline-block">
                    ICMR 2024
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden xl:block">
                  Vegetarian • Zero Added Sugar • Pantry-Aware
                </p>
              </div>
            </div>

            {/* Desktop & Tablet Navigation Tabs (md and above) */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`flex items-center space-x-1 lg:space-x-1.5 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="whitespace-nowrap hidden lg:inline">{item.label}</span>
                    <span className="whitespace-nowrap lg:hidden">{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Action Buttons & Mobile Hamburger */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <button
                onClick={onOpenDriveModal}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2 sm:px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl shadow-2xs flex items-center space-x-1.5 transition-all border border-blue-200 cursor-pointer"
                title="Google Drive Sync & Backup"
              >
                <HardDrive className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-blue-600 shrink-0" />
                <span className="hidden xl:inline">Google Drive</span>
                <span className="hidden sm:inline xl:hidden">Drive</span>
              </button>

              <button
                onClick={onGeneratePlan}
                disabled={isGeneratingPlan}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs lg:text-sm font-bold px-2.5 sm:px-3 lg:px-3.5 py-1.5 lg:py-2 rounded-xl shadow-xs flex items-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 lg:w-4 lg:h-4 animate-spin shrink-0" />
                    <span className="hidden sm:inline">Planning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
                    <span className="hidden xl:inline">Generate Plan</span>
                    <span className="hidden sm:inline xl:hidden">Generate</span>
                    <span className="sm:hidden">Plan</span>
                  </>
                )}
              </button>

              {/* Mobile Menu Hamburger Button (shown on mobile/tablet < md) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Quick Pantry Presets Bar - Horizontally Scrollable on All Screen Sizes */}
          <div className="py-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 gap-2 overflow-hidden">
            <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <span className="font-bold text-slate-500 whitespace-nowrap text-[11px] shrink-0">
                Pantry Presets:
              </span>
              <button
                onClick={() => onLoadPreset('full')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg transition-colors text-slate-700 whitespace-nowrap text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                🥬 Full Stock
              </button>
              <button
                onClick={() => onLoadPreset('low')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-800 rounded-lg transition-colors text-slate-700 whitespace-nowrap text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                📦 Low Stock
              </button>
              <button
                onClick={() => onLoadPreset('high_protein')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 rounded-lg transition-colors text-slate-700 whitespace-nowrap text-[11px] font-semibold shrink-0 cursor-pointer"
              >
                💪 High Protein (100g)
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-500 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              <span>₹150–₹200/day</span>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 space-y-1 shadow-lg overflow-hidden"
            >
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 px-2 pb-1">
                Navigation Menu
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">{item.label}</span>
                        <span className="text-xs text-slate-500 font-normal">{item.desc}</span>
                      </div>
                    </div>
                    {isActive ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Fixed Navigation Bar (Visible only on < md screens for ergonomic thumb access) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-emerald-700 font-black scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100' : 'bg-transparent'}`}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-none whitespace-nowrap">
                {item.id === 'planner'
                  ? '7-Day Plan'
                  : item.id === 'chat'
                  ? 'Dietitian'
                  : item.id === 'pantry'
                  ? 'Pantry'
                  : item.id === 'shopping'
                  ? 'Groceries'
                  : 'Profile'}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

