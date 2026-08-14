import React from 'react';
import { WeeklyMealPlan, ShoppingListItem } from '../types';
import { ShoppingBag, IndianRupee, Printer, CheckCircle2, AlertCircle, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { BENCHMARK_PRICES_INR } from '../data/pantryPresets';

interface ShoppingTrackerViewProps {
  plan: WeeklyMealPlan | null;
  dailyBudgetInr: number;
}

export const ShoppingTrackerView: React.FC<ShoppingTrackerViewProps> = ({
  plan,
  dailyBudgetInr,
}) => {
  const targetWeeklyBudgetMin = dailyBudgetInr * 7; // e.g. 150 * 7 = 1050
  const targetWeeklyBudgetMax = 200 * 7; // 1400

  const shoppingList: ShoppingListItem[] = plan?.shoppingList || [
    { item: 'Toor Dal (Arhar)', quantityNeeded: '500g', estimatedCostInr: 61, category: 'Pulses', reason: 'To hit 80g daily protein' },
    { item: 'Soya Chunks', quantityNeeded: '300g', estimatedCostInr: 33, category: 'Pulses', reason: 'High protein staple for dinner' },
    { item: 'Onions & Tomatoes', quantityNeeded: '1kg each', estimatedCostInr: 74, category: 'Produce', reason: 'Base gravy & salads' },
    { item: 'Unsweetened Muesli', quantityNeeded: '400g', estimatedCostInr: 140, category: 'Cereals', reason: 'Zero-added-sugar breakfast' },
    { item: 'Bananas & Guava', quantityNeeded: '1 dozen / 500g', estimatedCostInr: 90, category: 'Fruits', reason: '≥5 fruit/veg portions' },
  ];

  const totalWeeklyCost = plan?.totalWeeklyCostInr || shoppingList.reduce((acc, curr) => acc + curr.estimatedCostInr, 0);

  const budgetUsagePercent = Math.min(Math.round((totalWeeklyCost / targetWeeklyBudgetMax) * 100), 100);

  const handlePrintList = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Budget Monitor Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              <span>Grocery & Budget Monitor</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Weekly Shopping List (Stock Gap Analysis)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Additional grocery items required to fulfill your 7-day meal plan while maintaining zero added sugar & ICMR guidelines.
            </p>
          </div>

          <button
            onClick={handlePrintList}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-2xs self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Grocery List</span>
          </button>
        </div>

        {/* Budget Meter */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Estimated Weekly Grocery Cost:</span>
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
        </div>
      </div>

      {/* Grocery Items List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Tag className="w-4 h-4 text-emerald-600" />
          <span>Itemized Purchases Needed ({shoppingList.length} Items)</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {shoppingList.map((item, idx) => (
            <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.item}</h4>
                  <p className="text-[11px] text-slate-500">
                    Quantity: <strong className="text-slate-700">{item.quantityNeeded}</strong> • Category: <span className="capitalize text-slate-700">{item.category}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 italic mt-0.5">"{item.reason}"</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end space-x-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  ~ ₹{item.estimatedCostInr}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Govt Price Benchmark Reference Table */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Indian Govt Department of Consumer Affairs Retail Price Benchmarks (2026)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {Object.entries(BENCHMARK_PRICES_INR).map(([itemName, data]) => (
            <div key={itemName} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="block text-[11px] text-slate-500 font-medium">{itemName}</span>
              <span className="font-bold text-slate-900">₹{data.pricePerKgOrL} / {data.defaultUnit}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
