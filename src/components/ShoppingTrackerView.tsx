import React, { useState } from 'react';
import { WeeklyMealPlan, ShoppingListItem, PricingTier } from '../types';
import {
  ShoppingBag, IndianRupee, Printer, CheckCircle2, AlertCircle, Sparkles,
  Tag, ShieldCheck, Copy, Check, Share2, FileText, X, MessageSquare,
  Store, Smartphone, Leaf, Table, LayoutGrid, CheckSquare, Square,
  Search, ArrowUpDown, Filter, ChevronDown
} from 'lucide-react';
import { BENCHMARK_PRICES_INR } from '../data/pantryPresets';
import { savePricingTierStorage, loadPricingTierStorage } from '../lib/storage';
import { motion, AnimatePresence } from 'motion/react';

interface ShoppingTrackerViewProps {
  plan: WeeklyMealPlan | null;
  dailyBudgetInr: number;
}

export const ShoppingTrackerView: React.FC<ShoppingTrackerViewProps> = ({
  plan,
  dailyBudgetInr,
}) => {
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [formatStyle, setFormatStyle] = useState<'whatsapp' | 'simple' | 'categorized'>('whatsapp');
  
  // View mode: 'table' vs 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost_asc' | 'cost_desc' | 'category'>('category');
  
  // Purchased tracking state
  const [purchasedMap, setPurchasedMap] = useState<Record<string, boolean>>({});

  const togglePurchased = (itemName: string) => {
    setPurchasedMap(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Pricing Mode State
  const [pricingTier, setPricingTier] = useState<PricingTier>(() => loadPricingTierStorage());

  const handlePricingTierChange = (tier: PricingTier) => {
    setPricingTier(tier);
    savePricingTierStorage(tier);
  };

  const getTierMultiplier = (tier: PricingTier): number => {
    switch (tier) {
      case 'mandi': return 1.0;
      case 'quick_commerce': return 1.28;
      case 'supermarket': return 1.60;
      default: return 1.0;
    }
  };

  const currentMultiplier = getTierMultiplier(pricingTier);

  const targetWeeklyBudgetMin = dailyBudgetInr * 7; // e.g. 150 * 7 = 1050
  const targetWeeklyBudgetMax = 200 * 7; // 1400

  const rawShoppingList: ShoppingListItem[] = plan?.shoppingList || [
    { item: 'Toor Dal (Arhar)', quantityNeeded: '500g', estimatedCostInr: 61, category: 'Pulses', reason: 'To hit 80g daily protein' },
    { item: 'Soya Chunks', quantityNeeded: '300g', estimatedCostInr: 33, category: 'Pulses', reason: 'High protein staple for dinner' },
    { item: 'Onions & Tomatoes', quantityNeeded: '1kg each', estimatedCostInr: 74, category: 'Produce', reason: 'Base gravy & salads' },
    { item: 'Unsweetened Muesli', quantityNeeded: '400g', estimatedCostInr: 140, category: 'Cereals', reason: 'Zero-added-sugar breakfast' },
    { item: 'Bananas & Guava', quantityNeeded: '1 dozen / 500g', estimatedCostInr: 90, category: 'Fruits', reason: '≥5 fruit/veg portions' },
  ];

  // Adjusted list with selected pricing tier
  const shoppingList: ShoppingListItem[] = rawShoppingList.map(item => ({
    ...item,
    estimatedCostInr: Math.round(item.estimatedCostInr * currentMultiplier),
  }));

  // Categories list for filtering
  const allCategories = ['all', ...Array.from(new Set(shoppingList.map(item => item.category || 'Other')))];

  // Filtered and sorted shopping list
  const filteredList = shoppingList.filter(item => {
    const matchesSearch = item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || (item.category || 'Other') === categoryFilter;
    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.item.localeCompare(b.item);
    if (sortBy === 'cost_asc') return a.estimatedCostInr - b.estimatedCostInr;
    if (sortBy === 'cost_desc') return b.estimatedCostInr - a.estimatedCostInr;
    if (sortBy === 'category') return (a.category || '').localeCompare(b.category || '');
    return 0;
  });

  const baseCost = rawShoppingList.reduce((acc, curr) => acc + curr.estimatedCostInr, 0);
  const totalWeeklyCost = shoppingList.reduce((acc, curr) => acc + curr.estimatedCostInr, 0);
  const purchasedCost = shoppingList
    .filter(item => purchasedMap[item.item])
    .reduce((acc, curr) => acc + curr.estimatedCostInr, 0);
  const mandiCost = baseCost;
  const quickCommerceCost = Math.round(baseCost * 1.28);
  const supermarketCost = Math.round(baseCost * 1.60);

  const budgetUsagePercent = Math.min(Math.round((totalWeeklyCost / targetWeeklyBudgetMax) * 100), 100);
  const purchasedCount = Object.values(purchasedMap).filter(Boolean).length;

  const generateFormattedText = (style: 'whatsapp' | 'simple' | 'categorized'): string => {
    if (style === 'simple') {
      let text = `GROCERY SHOPPING LIST (Est. ₹${totalWeeklyCost})\n`;
      text += `------------------------------------\n`;
      shoppingList.forEach((item, idx) => {
        const check = purchasedMap[item.item] ? '[x]' : '[ ]';
        text += `${check} ${idx + 1}. ${item.item} - ${item.quantityNeeded} (~₹${item.estimatedCostInr})\n`;
      });
      text += `------------------------------------\nTotal Items: ${shoppingList.length}`;
      return text;
    }

    if (style === 'categorized') {
      let text = `🛒 *SHOPPING LIST BY CATEGORY*\n`;
      text += `💰 Est. Total: ₹${totalWeeklyCost}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const categories: { [cat: string]: ShoppingListItem[] } = {};
      shoppingList.forEach(item => {
        const cat = item.category || 'Other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(item);
      });

      Object.keys(categories).forEach(cat => {
        text += `📌 *${cat.toUpperCase()}*\n`;
        categories[cat].forEach((item) => {
          const status = purchasedMap[item.item] ? '✅ ' : '▫️ ';
          text += `  ${status}*${item.item}*: ${item.quantityNeeded} (~₹${item.estimatedCostInr})\n`;
        });
        text += `\n`;
      });

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `✨ *DietPlan AI* - ICMR 2024 Diet Plan`;
      return text;
    }

    // Default: WhatsApp Rich Format
    let text = `🛒 *DietPlan AI - Weekly Grocery List*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 *Est. Total Cost:* ₹${totalWeeklyCost} (Budget: ₹${targetWeeklyBudgetMin} - ₹${targetWeeklyBudgetMax})\n`;
    text += `📦 *Total Items Needed:* ${shoppingList.length}\n\n`;
    text += `*SHOPPING ITEMS:*\n`;

    shoppingList.forEach((item, idx) => {
      const status = purchasedMap[item.item] ? '✅' : '▫️';
      text += `${idx + 1}. ${status} *${item.item}* — ${item.quantityNeeded} (~₹${item.estimatedCostInr})\n`;
      if (item.category) text += `   • Category: ${item.category}\n`;
      if (item.reason) text += `   • Purpose: ${item.reason}\n`;
    });

    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✨ *DietPlan AI* | ICMR 2024 & WHO Approved Zero-Sugar Plan`;
    return text;
  };

  const formattedText = generateFormattedText(formatStyle);

  const handleCopyText = (textToCopy: string, isModal = false) => {
    navigator.clipboard.writeText(textToCopy);
    if (isModal) {
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2500);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const encoded = encodeURIComponent(formattedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Weekly Grocery Shopping List - DietPlan AI',
          text: formattedText,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      handleCopyText(formattedText, true);
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Budget Monitor Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Grocery & Budget Monitor</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Weekly Shopping List (Stock Gap Analysis)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Additional grocery items required to fulfill your 7-day meal plan while maintaining zero added sugar & ICMR guidelines.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto flex-wrap gap-y-2">
            <button
              onClick={() => setExportModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 sm:px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4" />
              <span>Export to Text</span>
            </button>

            <button
              onClick={() => handleCopyText(generateFormattedText('whatsapp'), false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3 sm:px-3.5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors border border-slate-200 cursor-pointer"
              title="Copy formatted text to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied!' : 'Quick Copy'}</span>
            </button>

            <button
              onClick={handlePrintList}
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Budget Meter & Pricing Mode Selector */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
          
          {/* Pricing Tier Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Price Estimation Benchmark / Channel:</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Switch channels to view cost variations between local mandis and instant delivery apps.
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-slate-200/80 p-1 rounded-xl">
              <button
                onClick={() => handlePricingTierChange('mandi')}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  pricingTier === 'mandi'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Mandi (1.0x)</span>
              </button>

              <button
                onClick={() => handlePricingTierChange('quick_commerce')}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  pricingTier === 'quick_commerce'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Blinkit (1.28x)</span>
              </button>

              <button
                onClick={() => handlePricingTierChange('supermarket')}
                className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  pricingTier === 'supermarket'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Leaf className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Store (1.6x)</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
            <span className="font-bold text-slate-700">Estimated Weekly Grocery Cost ({pricingTier.replace('_', ' ').toUpperCase()}):</span>
            <span className="text-sm font-extrabold text-emerald-800">
              ₹{totalWeeklyCost} <span className="text-[11px] font-normal text-slate-500">(Target: ₹{targetWeeklyBudgetMin} - ₹{targetWeeklyBudgetMax})</span>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                totalWeeklyCost <= targetWeeklyBudgetMax ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>₹0</span>
            <span className="font-semibold text-emerald-700">₹{dailyBudgetInr}/day target</span>
            <span>₹{targetWeeklyBudgetMax} Max</span>
          </div>

          {/* Quick Price Channel Comparison Pills */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center text-[11px]">
            <div className={`p-2 rounded-xl border ${pricingTier === 'mandi' ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900' : 'bg-white border-slate-200 text-slate-600'}`}>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Sabzi Mandi</span>
              <span>₹{mandiCost} / wk</span>
            </div>
            <div className={`p-2 rounded-xl border ${pricingTier === 'quick_commerce' ? 'bg-amber-50 border-amber-300 font-bold text-amber-900' : 'bg-white border-slate-200 text-slate-600'}`}>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Quick Delivery</span>
              <span>₹{quickCommerceCost} / wk</span>
            </div>
            <div className={`p-2 rounded-xl border ${pricingTier === 'supermarket' ? 'bg-purple-50 border-purple-300 font-bold text-purple-900' : 'bg-white border-slate-200 text-slate-600'}`}>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Supermarket</span>
              <span>₹{supermarketCost} / wk</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode & Filter Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Top/Left: Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items, ingredients, or purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bottom/Right Controls: Category, Sort, View Toggle */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 px-2.5 rounded-xl focus:outline-hidden cursor-pointer"
            >
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-2 px-2.5 rounded-xl focus:outline-hidden cursor-pointer"
            >
              <option value="category">Sort: Category</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="cost_asc">Sort: Price (Low → High)</option>
              <option value="cost_desc">Sort: Price (High → Low)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  viewMode === 'table' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Comprehensive Comparison Table"
              >
                <Table className="w-3.5 h-3.5 shrink-0" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  viewMode === 'cards' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Switch to Category Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Shopping Cart Tally Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">
              {purchasedCount} of {shoppingList.length} items marked purchased
            </span>
            {purchasedCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                ₹{purchasedCost} Spent
              </span>
            )}
          </div>
          {purchasedCount > 0 && (
            <button
              onClick={() => setPurchasedMap({})}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset all checkmarks
            </button>
          )}
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Table className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Itemized Channel Price Comparison ({filteredList.length} Items)</span>
            </h3>
            <span className="text-[11px] text-slate-500 flex items-center space-x-1">
              <span>👉 Swipe horizontally for all tiers</span>
            </span>
          </div>

          <div className="relative overflow-x-auto rounded-xl border border-slate-200 shadow-2xs bg-white">
            <table className="w-full text-left border-collapse min-w-[860px] text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center">Done</th>
                  <th className="py-3 px-3.5 sticky left-0 z-20 bg-slate-900 min-w-[160px] border-r border-slate-800">
                    Item & Quantity
                  </th>
                  <th className="py-3 px-3 min-w-[100px]">Category</th>
                  <th className="py-3 px-3 min-w-[110px] text-right">Mandi Price</th>
                  <th className="py-3 px-3 min-w-[120px] text-right">Quick Delivery</th>
                  <th className="py-3 px-3 min-w-[120px] text-right">Supermarket</th>
                  <th className="py-3 px-3 min-w-[110px] text-right bg-emerald-950/80 text-emerald-300">Active Tier</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Dietary Role / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredList.map((item, idx) => {
                  const isBought = purchasedMap[item.item];
                  const rawItem = rawShoppingList.find(r => r.item === item.item) || item;
                  const itemMandi = rawItem.estimatedCostInr;
                  const itemQuick = Math.round(rawItem.estimatedCostInr * 1.28);
                  const itemSuper = Math.round(rawItem.estimatedCostInr * 1.60);

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isBought
                          ? 'bg-emerald-50/60'
                          : idx % 2 === 0
                          ? 'bg-white'
                          : 'bg-slate-50/60'
                      } hover:bg-emerald-50/30`}
                    >
                      {/* Bought Checkbox */}
                      <td className="p-3 text-center align-middle">
                        <button
                          onClick={() => togglePurchased(item.item)}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            isBought ? 'text-emerald-600 bg-emerald-100' : 'text-slate-300 hover:text-slate-600'
                          }`}
                          title={isBought ? 'Mark as not purchased' : 'Mark as purchased'}
                        >
                          {isBought ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Sticky Item Column */}
                      <td className={`p-3 font-bold sticky left-0 z-10 border-r border-slate-200 ${
                        isBought ? 'bg-emerald-100/90 shadow-2xs' : 'bg-white text-slate-900'
                      }`}>
                        <div className="space-y-0.5">
                          <span className={`text-xs block ${isBought ? 'line-through text-slate-600' : 'text-slate-900'}`}>
                            {item.item}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded inline-block">
                            {item.quantityNeeded}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 align-middle">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                          {item.category || 'General'}
                        </span>
                      </td>

                      {/* Mandi Price */}
                      <td className="p-3 text-right font-medium text-slate-700 align-middle">
                        ₹{itemMandi}
                      </td>

                      {/* Quick Commerce Price */}
                      <td className="p-3 text-right font-medium text-slate-700 align-middle">
                        ₹{itemQuick}
                      </td>

                      {/* Supermarket Price */}
                      <td className="p-3 text-right font-medium text-slate-700 align-middle">
                        ₹{itemSuper}
                      </td>

                      {/* Active Selected Tier Price */}
                      <td className="p-3 text-right font-black text-emerald-900 bg-emerald-50/50 align-middle border-l border-r border-emerald-100">
                        ₹{item.estimatedCostInr}
                      </td>

                      {/* Dietary Reason */}
                      <td className="p-3 text-slate-600 text-[11px] align-middle">
                        <span className="italic">{item.reason || 'Pantry staple for menu recipes'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Total Summary Row */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                  <td colSpan={2} className="p-3 sticky left-0 z-20 bg-slate-900 border-r border-slate-800">
                    <span className="text-emerald-400">Total Basket Value</span>
                  </td>
                  <td className="p-3 text-[11px] text-slate-300">
                    {filteredList.length} items
                  </td>
                  <td className="p-3 text-right text-emerald-300 font-black">
                    ₹{filteredList.reduce((acc, curr) => {
                      const raw = rawShoppingList.find(r => r.item === curr.item) || curr;
                      return acc + raw.estimatedCostInr;
                    }, 0)}
                  </td>
                  <td className="p-3 text-right text-amber-300 font-black">
                    ₹{filteredList.reduce((acc, curr) => {
                      const raw = rawShoppingList.find(r => r.item === curr.item) || curr;
                      return acc + Math.round(raw.estimatedCostInr * 1.28);
                    }, 0)}
                  </td>
                  <td className="p-3 text-right text-purple-300 font-black">
                    ₹{filteredList.reduce((acc, curr) => {
                      const raw = rawShoppingList.find(r => r.item === curr.item) || curr;
                      return acc + Math.round(raw.estimatedCostInr * 1.60);
                    }, 0)}
                  </td>
                  <td className="p-3 text-right bg-slate-800 text-emerald-400 font-black">
                    ₹{filteredList.reduce((acc, curr) => acc + curr.estimatedCostInr, 0)}
                  </td>
                  <td className="p-3 text-slate-400 text-[10px]">
                    Zero Sugar • High-Fiber ICMR Certified
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>Itemized Purchases Needed ({filteredList.length} Items)</span>
            </h3>

            <button
              onClick={() => setExportModalOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Copy for WhatsApp / SMS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredList.map((item, idx) => {
              const isBought = purchasedMap[item.item];
              return (
                <div
                  key={idx}
                  onClick={() => togglePurchased(item.item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    isBought
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <button
                      type="button"
                      className={`p-0.5 rounded mt-0.5 ${isBought ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {isBought ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                    <div>
                      <h4 className={`font-bold text-xs sm:text-sm ${isBought ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {item.item}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Qty: <strong className="text-slate-700">{item.quantityNeeded}</strong> • <span className="capitalize text-slate-600">{item.category}</span>
                      </p>
                      {item.reason && (
                        <p className="text-[10px] text-slate-600 italic mt-0.5">"{item.reason}"</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                      ~ ₹{item.estimatedCostInr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Govt Price Benchmark Reference Table */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Indian Govt Department of Consumer Affairs Retail Price Benchmarks (2026)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {Object.entries(BENCHMARK_PRICES_INR).map(([itemName, data]) => (
            <div key={itemName} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="block text-[11px] text-slate-500 font-medium truncate">{itemName}</span>
              <span className="font-bold text-slate-900">₹{data.pricePerKgOrL} / {data.defaultUnit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export to Text Modal */}
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
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Export Shopping List</h3>
                    <p className="text-xs text-slate-500">Formatted for WhatsApp, Telegram, or Notes</p>
                  </div>
                </div>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Format Style Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Choose Text Style:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setFormatStyle('whatsapp')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formatStyle === 'whatsapp'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    💬 WhatsApp / Rich
                  </button>
                  <button
                    onClick={() => setFormatStyle('categorized')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formatStyle === 'categorized'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📂 Categorized
                  </button>
                  <button
                    onClick={() => setFormatStyle('simple')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      formatStyle === 'simple'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📝 Simple Checklist
                  </button>
                </div>
              </div>

              {/* Text Area Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Formatted Text Preview</span>
                  <span>{formattedText.length} characters</span>
                </div>
                <textarea
                  readOnly
                  value={formattedText}
                  rows={9}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 leading-relaxed resize-none selection:bg-emerald-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleCopyText(formattedText, true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    {modalCopied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                    <span>{modalCopied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}</span>
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <MessageSquare className="w-4 h-4 text-green-200" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition-colors border border-slate-200 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Share via App (Native Share Sheet)</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

