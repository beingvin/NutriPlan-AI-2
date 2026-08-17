import React, { useState } from 'react';
import { ChatMessage, PantryItem, UserProfile } from '../types';
import { Send, Bot, User, Sparkles, RefreshCw, CheckCircle, ShieldAlert, BookOpen } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface ChatAssistantViewProps {
  inventory: PantryItem[];
  userProfile: UserProfile;
}

export const ChatAssistantView: React.FC<ChatAssistantViewProps> = ({
  inventory,
  userProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: `Hello! I am your AI Nutritionist. I design personalized vegetarian, zero-added-sugar meal plans based on your non-refrigerated pantry stock and a ₹150–₹200/day grocery budget. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    {
      title: 'Full Stock 7-Day Plan',
      text: 'Create a 7-day vegetarian meal plan using my available stock, zero added sugar, ~80g protein/day, and within ₹150–200/day.',
    },
    {
      title: 'Low Stock (No Dairy/Sprouts)',
      text: 'Generate a weekly diet plan assuming no milk/curd and no fresh sprouts in my pantry, maintaining zero sugar and high protein.',
    },
    {
      title: 'High Protein Goal (100g)',
      text: 'How can I boost my daily vegetarian protein intake to ~100g/day using my current dals, soya chunks, and seeds without exceeding ₹200/day?',
    },
    {
      title: 'Allergen & Safety Filter',
      text: 'Check my current pantry inventory against common allergens and verify that my recipes comply with ICMR 2024 guidelines.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userProfile,
          inventory,
        }),
      });

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.response || data.text || 'I have processed your nutrition request.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: `Sorry, I encountered an issue: ${err.message || 'Unable to connect to dietitian server'}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[700px]">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-2xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <span>DietPlan AI Dietitian</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h2>
            <p className="text-[11px] text-slate-500">
              ICMR & WHO Aligned • Zero Added Sugar • Pantry Aware
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <ShieldAlert className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Active Budget: ₹{userProfile.dailyBudgetInr}/day</span>
        </div>
      </div>

      {/* Quick Scenario Buttons */}
      <div className="p-3 bg-emerald-50/40 border-b border-emerald-100/60 overflow-x-auto">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider shrink-0">
            Quick Prompts:
          </span>
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              disabled={loading}
              className="bg-white border border-emerald-200 hover:bg-emerald-600 hover:text-white text-emerald-900 text-xs px-3 py-1.5 rounded-lg shadow-2xs font-medium shrink-0 transition-all disabled:opacity-50"
            >
              {qp.title}
            </button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex items-start space-x-2.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed ${
                isUser
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none space-y-2'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>
                <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl max-w-xs border border-slate-200">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Consulting nutrition database & calculating macros...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about recipes, pantry swaps, protein targets, or zero-sugar tips..."
            className="flex-1 text-xs px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl shadow-xs disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
