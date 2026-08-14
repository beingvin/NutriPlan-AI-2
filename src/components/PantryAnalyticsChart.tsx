import React, { useState } from 'react';
import { PantryItem } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
} from 'recharts';
import { Clock, AlertTriangle, TrendingUp, ShieldCheck, Sparkles, PieChart as PieIcon, BarChart2 } from 'lucide-react';

interface PantryAnalyticsChartProps {
  inventory: PantryItem[];
}

export const PantryAnalyticsChart: React.FC<PantryAnalyticsChartProps> = ({ inventory }) => {
  const [activeMetric, setActiveMetric] = useState<'freshness' | 'consumption' | 'category'>('freshness');

  // Compute freshness / estimated expiry days for each item
  // Defaults based on item characteristics and categories:
  // Non-shelf-stable items: fresh_produce (3-6 days), dairy (4-7 days), sprouts (3-4 days)
  // Shelf-stable items: seeds/nuts (90 days), pulses (180 days), grains (120 days), spices (300 days)
  const getEstimatedExpiryDays = (item: PantryItem): number => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('sprout')) return 3;
    if (nameLower.includes('milk') || nameLower.includes('dahi') || nameLower.includes('curd') || nameLower.includes('paneer') || nameLower.includes('tofu')) return 5;
    if (nameLower.includes('banana') || nameLower.includes('guava') || nameLower.includes('fruit')) return 4;
    if (nameLower.includes('tomato') || nameLower.includes('cucumber')) return 6;
    if (nameLower.includes('onion') || nameLower.includes('carrot')) return 10;
    
    if (!item.isShelfStable) return 7;

    if (item.category === 'fresh_produce') return 8;
    if (item.category === 'dairy_alternatives') return 6;
    if (item.category === 'pulses_legumes') return 120;
    if (item.category === 'grains_flours') return 90;
    if (item.category === 'seeds_nuts') return 90;
    return 180;
  };

  // Estimated weekly consumption rate (g or pcs) based on typical meal usage
  const getWeeklyConsumptionRate = (item: PantryItem): number => {
    const nameLower = item.name.toLowerCase();
    if (nameLower.includes('rice')) return 700; // g
    if (nameLower.includes('atta')) return 600; // g
    if (nameLower.includes('dal') || nameLower.includes('soya')) return 350; // g
    if (nameLower.includes('muesli') || nameLower.includes('oat')) return 250; // g
    if (nameLower.includes('milk')) return 2; // L
    if (nameLower.includes('curd')) return 500; // g
    if (nameLower.includes('onion') || nameLower.includes('tomato')) return 4; // pcs
    if (nameLower.includes('banana') || nameLower.includes('guava')) return 5; // pcs
    return 150;
  };

  // 1. Process items for Freshness Expiry Chart (Focus on produce & perishable first)
  const freshnessData = inventory
    .map((item) => {
      const daysLeft = getEstimatedExpiryDays(item);
      let riskLevel: 'critical' | 'warning' | 'safe' = 'safe';
      let color = '#059669'; // emerald-600

      if (daysLeft <= 4) {
        riskLevel = 'critical';
        color = '#dc2626'; // red-600
      } else if (daysLeft <= 10) {
        riskLevel = 'warning';
        color = '#d97706'; // amber-600
      }

      return {
        name: item.name.length > 14 ? `${item.name.substring(0, 12)}..` : item.name,
        fullName: item.name,
        daysLeft,
        riskLevel,
        color,
        isShelfStable: item.isShelfStable,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10); // Top 10 priority items by expiry risk

  // 2. Process items for Consumption Frequency vs Current Stock
  const categoryNames: Record<PantryItem['category'], string> = {
    pulses_legumes: 'Pulses & Soya',
    grains_flours: 'Grains & Atta',
    fresh_produce: 'Fresh Produce',
    dairy_alternatives: 'Dairy & Dahi',
    seeds_nuts: 'Seeds & Nuts',
    spices_others: 'Spices & Staples',
  };

  const consumptionByCategory = Object.keys(categoryNames).map((cat) => {
    const categoryKey = cat as PantryItem['category'];
    const itemsInCat = inventory.filter((i) => i.category === categoryKey);
    const itemNames = itemsInCat.map((i) => i.name).join(', ');

    // Normalize stock count for chart comparison (number of items & approximate supply days)
    const totalItems = itemsInCat.length;
    const perishableCount = itemsInCat.filter((i) => !i.isShelfStable).length;
    const avgDaysLeft = itemsInCat.length
      ? Math.round(
          itemsInCat.reduce((acc, curr) => acc + getEstimatedExpiryDays(curr), 0) / itemsInCat.length
        )
      : 0;

    return {
      category: categoryNames[categoryKey],
      itemCount: totalItems,
      perishableCount,
      avgDaysLeft,
      itemNames: itemNames || 'None in stock',
    };
  });

  // 3. Category Share Pie Chart
  const pieCategoryData = Object.keys(categoryNames)
    .map((cat) => {
      const categoryKey = cat as PantryItem['category'];
      const count = inventory.filter((i) => i.category === categoryKey).length;
      return {
        name: categoryNames[categoryKey],
        value: count,
      };
    })
    .filter((d) => d.value > 0);

  const PIE_COLORS = ['#059669', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#475569'];

  // Critical perishable items warning list
  const criticalItems = freshnessData.filter((i) => i.daysLeft <= 4);
  const warningItems = freshnessData.filter((i) => i.daysLeft > 4 && i.daysLeft <= 10);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pantry Consumption & Freshness Analytics</h3>
            <p className="text-[11px] text-slate-500">
              Track expiry risk, fresh produce turnover, and category supply health
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('freshness')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              activeMetric === 'freshness'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Freshness Expiry</span>
          </button>

          <button
            onClick={() => setActiveMetric('consumption')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              activeMetric === 'consumption'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Supply Turnover</span>
          </button>

          <button
            onClick={() => setActiveMetric('category')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
              activeMetric === 'category'
                ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Category Share</span>
          </button>
        </div>
      </div>

      {/* Freshness Health Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-emerald-50/70 border border-emerald-200/60 p-3 rounded-xl flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <div className="font-bold text-emerald-900">
              {inventory.length} Active Stock Items
            </div>
            <div className="text-[11px] text-emerald-700">
              {inventory.filter((i) => i.isShelfStable).length} shelf-stable, {inventory.filter((i) => !i.isShelfStable).length} perishables
            </div>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl flex items-center space-x-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-amber-900">
              {warningItems.length} High-Turnover Items
            </div>
            <div className="text-[11px] text-amber-700">Consume within 5-10 days</div>
          </div>
        </div>

        <div className="bg-red-50/70 border border-red-200/60 p-3 rounded-xl flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <div className="font-bold text-red-900">
              {criticalItems.length} Priority Expiry Risks
            </div>
            <div className="text-[11px] text-red-700">
              {criticalItems.map((i) => i.fullName).join(', ') || 'No immediate expiry risk'}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Visual Section */}
      <div className="h-64 w-full pt-2">
        {activeMetric === 'freshness' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={freshnessData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
              <XAxis
                type="number"
                unit=" days"
                tick={{ fontSize: 11, fill: '#64748b' }}
                domain={[0, 'dataMax + 5']}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                width={100}
              />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value} days remaining`,
                  'Freshness Window',
                ]}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return `${data.fullName} (${data.quantity} ${data.unit})`;
                  }
                  return label;
                }}
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Bar dataKey="daysLeft" radius={[0, 8, 8, 0]} barSize={16}>
                {freshnessData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeMetric === 'consumption' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consumptionByCategory} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="itemCount" name="Total Items in Stock" fill="#0284c7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="perishableCount" name="Perishable (Fast Consumption)" fill="#dc2626" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeMetric === 'category' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {pieCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Actionable Consumption Advice Footnote */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            <strong>AI Dietitian Tip:</strong> Prioritize cooking items with red/amber bars (sprouted legumes, dahi, fresh tomatoes) early in your 7-day plan.
          </span>
        </span>
      </div>
    </div>
  );
};
