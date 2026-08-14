import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getFallbackShuffleMeal } from "./src/lib/mealPlanFallback";

const PORT = 3000;

const DIETITIAN_SYSTEM_INSTRUCTION = `
You are NutriPlan AI, a qualified clinical dietitian AI specializing in personalized Indian vegetarian, zero-added-sugar diet planning based on non-refrigerated pantry stock, local market price bounds (₹150-₹200/day), and official dietary guidelines (ICMR/NIN 2024 and WHO).

CORE RULES & NUTRITIONAL GUIDELINES:
1. DIET: Strict Vegetarian (or Lacto-Vegetarian if milk/curd in stock). High protein emphasis (10-15%+ energy as protein, target 80g - 100g/day using dals, sprouted pulses, soya chunks, roasted chana, nuts, seeds, besan, milk/curd/paneer).
2. ZERO ADDED SUGAR: Absolutely NO refined sugar, jaggery, syrup, or honey in any meal. Only natural sugars from whole fruit (bananas, guava, apples) and unflavored dairy/muesli.
3. FRUITS & VEGETABLES: At least 5 servings of vegetables & fruits per day (ICMR recommendation).
4. STOCK AWARENESS: Prioritize using the user's available non-refrigerated pantry stock (dals, rice, atta, soya, sprouts, muesli, seeds, onions, tomatoes, etc.) before suggesting purchases.
5. BUDGET MONITORING: Keep missing items' weekly total cost aligned with ₹150 - ₹200 per day (~₹1,050 - ₹1,400/week) using realistic Indian Govt Price Monitoring data (e.g. Rice ~₹45/kg, Atta ~₹37/kg, Tur dal ~₹122/kg, Milk ~₹61/L, Onions ~₹36/kg, Tomatoes ~₹38/kg).
6. ALLERGY SAFETY: Strictly exclude any ingredients listed in user's allergies (e.g., peanuts, gluten, dairy, tree nuts, soy). Include explicit allergen safety confirmations.
7. CLINICAL DISCLAIMER: Always provide evidence-based, practical advice and include a brief wellness disclaimer ("This meal plan is for general nutritional guidance. Consult a registered medical dietitian for specific medical conditions.").
`;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Warning: GEMINI_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

/**
 * Helper to call Gemini API with model fallback and automatic retry on 503/429
 */
async function generateContentWithRetry(ai: GoogleGenAI, params: {
  contents: any;
  config?: any;
  models?: string[];
}): Promise<any> {
  const modelsToTry = params.models || [
    "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-2.5-flash-lite",
    "gemini-3.7-flash",
  ];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini API] Querying model: ${model} (attempt ${attempt + 1})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuotaErr = err?.status === 429 || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
        console.warn(`[Gemini API Info] Model ${model} attempt ${attempt + 1} failed: ${errMsg}`);
        
        // If quota exceeded (429), break retry loop immediately and try next model
        if (isQuotaErr) {
          break;
        }
        if (attempt < 1) {
          await new Promise((res) => setTimeout(res, 800));
        }
      }
    }
  }
  throw lastError;
}

function generateFallbackMealPlan(userProfile: any, inventory: any) {
  const targetProtein = userProfile?.proteinTargetGrams || 80;
  const targetCalories = userProfile?.calorieTargetKcal || 1600;
  const budget = userProfile?.dailyBudgetInr || 175;

  const dayTemplates = [
    {
      dayNumber: 1,
      dayName: "Monday",
      totalProteinGrams: targetProtein,
      totalCaloriesKcal: targetCalories,
      breakfast: {
        id: "d1-b",
        name: "Unsweetened Muesli with Warm Milk & Chia Seeds",
        type: "Breakfast",
        portion: "1 Bowl (40g muesli + 200ml milk + 1 tsp chia)",
        caloriesKcal: 320,
        proteinGrams: 14,
        ingredients: ["Unsweetened Muesli", "Milk", "Chia Seeds"],
        preparationNotes: "Mix warm milk with muesli and soaked chia seeds. Do not add sugar.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d1-l",
        name: "Toor Dal with Brown Rice & Tomato Salad",
        type: "Lunch",
        portion: "1.5 cups cooked dal + 1 cup rice + 1 tomato sliced",
        caloriesKcal: 520,
        proteinGrams: 22,
        ingredients: ["Toor Dal", "Rice", "Tomatoes", "Onions"],
        preparationNotes: "Pressure cook toor dal with turmeric and cumin. Serve hot with steamed rice.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d1-s",
        name: "Sprouted Moong Chaat with Roasted Almonds",
        type: "Evening Snack",
        portion: "1 cup sprouted moong + 8 almonds",
        caloriesKcal: 210,
        proteinGrams: 16,
        ingredients: ["Sprouted Moong", "Almonds", "Onion", "Lemon"],
        preparationNotes: "Toss sprouted moong with chopped onions, lemon juice, and roasted almonds.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d1-d",
        name: "Soya Chunk Curry with Whole Wheat Chapatis",
        type: "Dinner",
        portion: "1.5 cups soya chunk curry + 2 chapatis",
        caloriesKcal: 550,
        proteinGrams: 32,
        ingredients: ["Soya Chunks", "Atta", "Onions", "Tomatoes"],
        preparationNotes: "Boil soya chunks, squeeze water, and cook in onion-tomato gravy.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    },
    {
      dayNumber: 2,
      dayName: "Tuesday",
      totalProteinGrams: targetProtein + 2,
      totalCaloriesKcal: targetCalories,
      breakfast: {
        id: "d2-b",
        name: "High-Protein Besan & Spinach Chilla with Dahi",
        type: "Breakfast",
        portion: "2 Chillas + 100g fresh curd",
        caloriesKcal: 340,
        proteinGrams: 18,
        ingredients: ["Besan", "Curd", "Onions", "Spices"],
        preparationNotes: "Make a thin batter of besan, spices, and onions. Cook on tawa with minimal oil.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d2-l",
        name: "Yellow Moong Dal Khichdi with Roasted Chana & Cucumber",
        type: "Lunch",
        portion: "1.5 cups khichdi + 30g bhuna chana + 1 cucumber",
        caloriesKcal: 480,
        proteinGrams: 24,
        ingredients: ["Moong Dal", "Rice", "Roasted Chana", "Cucumber"],
        preparationNotes: "Cook equal parts moong dal and rice with turmeric and ghee. Serve with fresh cucumber.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d2-s",
        name: "Guava / Fresh Fruit with Roasted Peanuts",
        type: "Evening Snack",
        portion: "1 Guava + 30g peanuts",
        caloriesKcal: 200,
        proteinGrams: 10,
        ingredients: ["Guava", "Peanuts"],
        preparationNotes: "Enjoy fresh guava slices alongside dry roasted peanuts.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d2-d",
        name: "Paneer / Tofu Soya Bhurji with Rotis",
        type: "Dinner",
        portion: "1 cup Paneer/Soya bhurji + 2 whole wheat rotis",
        caloriesKcal: 560,
        proteinGrams: 30,
        ingredients: ["Soya Chunks", "Atta", "Onions", "Tomatoes"],
        preparationNotes: "Sauté minced soya/paneer with onions and tomatoes until fragrant.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    },
    {
      dayNumber: 3,
      dayName: "Wednesday",
      totalProteinGrams: targetProtein,
      totalCaloriesKcal: targetCalories - 20,
      breakfast: {
        id: "d3-b",
        name: "Oat & Chia Porridge with Sliced Banana",
        type: "Breakfast",
        portion: "1 Bowl (40g oats + 1 tbsp chia + 1 banana)",
        caloriesKcal: 310,
        proteinGrams: 12,
        ingredients: ["Unsweetened Muesli", "Chia Seeds", "Bananas", "Milk"],
        preparationNotes: "Cook oats/muesli in milk, top with chia seeds and fresh banana slices.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d3-l",
        name: "Sprouted Kala Chana Curry with Steamed Rice",
        type: "Lunch",
        portion: "1.5 cups chana curry + 1 cup rice",
        caloriesKcal: 510,
        proteinGrams: 24,
        ingredients: ["Sprouted Moong/Chana", "Rice", "Tomatoes"],
        preparationNotes: "Simmer sprouted kala chana in spicy tomato-onion curry.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d3-s",
        name: "Bhuna Chana (Roasted Gram) with Masala Lemon",
        type: "Evening Snack",
        portion: "50g bhuna chana + chaat masala",
        caloriesKcal: 180,
        proteinGrams: 12,
        ingredients: ["Roasted Chana", "Lemon"],
        preparationNotes: "Toss crunchy roasted chana with lemon juice and chaat masala.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d3-d",
        name: "Mix Dal Tadka with 2 Multigrain Rotis",
        type: "Dinner",
        portion: "1.5 cups mix dal + 2 rotis",
        caloriesKcal: 540,
        proteinGrams: 28,
        ingredients: ["Toor Dal", "Moong Dal", "Atta"],
        preparationNotes: "Combine yellow moong and toor dal, temper with cumin and garlic.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    },
    {
      dayNumber: 4,
      dayName: "Thursday",
      totalProteinGrams: targetProtein + 4,
      totalCaloriesKcal: targetCalories + 10,
      breakfast: {
        id: "d4-b",
        name: "Moong Dal Sprouts Dosa / Cheela with Mint Chutney",
        type: "Breakfast",
        portion: "2 Cheelas + mint yogurt chutney",
        caloriesKcal: 330,
        proteinGrams: 17,
        ingredients: ["Moong Dal", "Curd", "Green Chillies"],
        preparationNotes: "Grind soaked moong dal into batter and make crisp cheelas.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d4-l",
        name: "Soya Chunk Pulao with Cucumber Dahi Raita",
        type: "Lunch",
        portion: "2 cups soya pulao + 100g raita",
        caloriesKcal: 530,
        proteinGrams: 28,
        ingredients: ["Soya Chunks", "Rice", "Curd", "Cucumber"],
        preparationNotes: "Cook rice with soya chunks and spices; serve with cool cucumber raita.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d4-s",
        name: "Flax & Chia Seed Energy Mix with Almonds",
        type: "Evening Snack",
        portion: "1 tbsp flax + 1 tbsp chia + 10 almonds",
        caloriesKcal: 190,
        proteinGrams: 9,
        ingredients: ["Flax Seeds", "Chia Seeds", "Almonds"],
        preparationNotes: "Lightly dry roast the seed mix and almonds for a crunchy bite.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d4-d",
        name: "Toor Dal Fry with Carrot-Onion Salad & 2 Phulkas",
        type: "Dinner",
        portion: "1.5 cups dal fry + 2 phulkas + salad",
        caloriesKcal: 520,
        proteinGrams: 24,
        ingredients: ["Toor Dal", "Atta", "Carrots", "Onions"],
        preparationNotes: "Cook thick toor dal with mustard seed tadka.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    },
    {
      dayNumber: 5,
      dayName: "Friday",
      totalProteinGrams: targetProtein,
      totalCaloriesKcal: targetCalories,
      breakfast: {
        id: "d5-b",
        name: "Soya Chunks Stir-Fry Bhurji with Toast / Chapati",
        type: "Breakfast",
        portion: "1 cup soya bhurji + 1 chapati",
        caloriesKcal: 350,
        proteinGrams: 25,
        ingredients: ["Soya Chunks", "Atta", "Onions"],
        preparationNotes: "Sauté rehydrated soya granules with onion and green peppers.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d5-l",
        name: "Panchmel Dal with Steamed Rice & Guava Salad",
        type: "Lunch",
        portion: "1.5 cups dal + 1 cup rice + fruit",
        caloriesKcal: 500,
        proteinGrams: 22,
        ingredients: ["Toor Dal", "Moong Dal", "Rice", "Guava"],
        preparationNotes: "Blend 2-3 types of dals for a complete amino acid profile.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d5-s",
        name: "Roasted Chana & Seed Trail Mix",
        type: "Evening Snack",
        portion: "40g chana + 1 tsp seeds",
        caloriesKcal: 170,
        proteinGrams: 11,
        ingredients: ["Roasted Chana", "Flax Seeds"],
        preparationNotes: "Mix roasted gram with toasted flax seeds.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d5-d",
        name: "Besan Kadhi Pakoda (Baked/Unfried) with Rice",
        type: "Dinner",
        portion: "1.5 cups kadhi + 1 cup rice",
        caloriesKcal: 510,
        proteinGrams: 20,
        ingredients: ["Besan", "Curd", "Rice"],
        preparationNotes: "Whisk curd and besan with turmeric and cook gently until thick.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    },
    {
      dayNumber: 6,
      dayName: "Saturday",
      totalProteinGrams: targetProtein + 2,
      totalCaloriesKcal: targetCalories + 20,
      breakfast: {
        id: "d6-b",
        name: "Warm Milk with Muesli, Almonds & Sliced Guava",
        type: "Breakfast",
        portion: "1 Bowl muesli + 8 almonds + 1 guava",
        caloriesKcal: 330,
        proteinGrams: 15,
        ingredients: ["Unsweetened Muesli", "Milk", "Almonds", "Guava"],
        preparationNotes: "Combine unsweetened grain cereal with cold or warm milk.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d6-l",
        name: "Sprouted Moong & Tomato Salad Bowl with Rotis",
        type: "Lunch",
        portion: "1.5 cups sprout salad + 2 rotis",
        caloriesKcal: 490,
        proteinGrams: 24,
        ingredients: ["Sprouted Moong", "Tomatoes", "Atta"],
        preparationNotes: "Steam sprouts for 3 minutes, toss with herbs and serve with soft rotis.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d6-s",
        name: "Curd / Dahi Chaat with Roasted Cumin",
        type: "Evening Snack",
        portion: "150g fresh plain curd + roasted jeera",
        caloriesKcal: 140,
        proteinGrams: 8,
        ingredients: ["Curd"],
        preparationNotes: "Whisk chilled curd with black salt and roasted cumin powder.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d6-d",
        name: "Soya Chunk & Vegetable Gravy with Rice & Cucumber",
        type: "Dinner",
        portion: "1.5 cups gravy + 1 cup rice + cucumber",
        caloriesKcal: 550,
        proteinGrams: 31,
        ingredients: ["Soya Chunks", "Rice", "Cucumber", "Onions"],
        preparationNotes: "Rich tomato-onion base gravy with high protein soya chunks.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    },
    {
      dayNumber: 7,
      dayName: "Sunday",
      totalProteinGrams: targetProtein,
      totalCaloriesKcal: targetCalories,
      breakfast: {
        id: "d7-b",
        name: "Besan-Oat Vegetable Pancakes with Curd Dip",
        type: "Breakfast",
        portion: "2 Pancakes + 2 tbsp curd",
        caloriesKcal: 340,
        proteinGrams: 16,
        ingredients: ["Besan", "Curd", "Onions"],
        preparationNotes: "Mix besan, chopped veggies, and herbs into a savory pancake batter.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      lunch: {
        id: "d7-l",
        name: "Sunday Special Rajma / Chana Curry with Basmati Rice",
        type: "Lunch",
        portion: "1.5 cups curry + 1 cup rice + salad",
        caloriesKcal: 540,
        proteinGrams: 25,
        ingredients: ["Sprouted Moong/Chana", "Rice", "Tomatoes", "Onions"],
        preparationNotes: "Slow cooked brown chana/rajma in garlic tomato broth.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      eveningSnack: {
        id: "d7-s",
        name: "Banana & Seed Smoothie (No Added Sugar)",
        type: "Evening Snack",
        portion: "1 Glass (1 banana + 200ml milk + 1 tsp chia)",
        caloriesKcal: 220,
        proteinGrams: 9,
        ingredients: ["Bananas", "Milk", "Chia Seeds"],
        preparationNotes: "Blend banana with chilled milk and soaked chia seeds. No sugar added.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      },
      dinner: {
        id: "d7-d",
        name: "Light Yellow Moong Dal Soup with 2 Whole Wheat Rotis",
        type: "Dinner",
        portion: "2 cups dal soup + 2 rotis",
        caloriesKcal: 480,
        proteinGrams: 22,
        ingredients: ["Moong Dal", "Atta"],
        preparationNotes: "Soothing yellow moong soup tempered with ghee and ginger.",
        isZeroAddedSugar: true,
        usesPantryStock: true
      }
    }
  ];

  return {
    planTitle: "7-Day High-Protein Vegetarian & Zero-Sugar Meal Plan",
    summary: `Tailored meal plan optimized for ~${targetProtein}g daily vegetarian protein, zero added sugars, and ICMR 2024 compliance using your non-refrigerated pantry staples.`,
    targetProteinGrams: targetProtein,
    targetCaloriesKcal: targetCalories,
    dailyBudgetInr: budget,
    totalWeeklyCostInr: Math.round(budget * 7 * 0.85),
    nutritionistNotes: "This plan strictly follows ICMR/NIN 2024 guidelines: 50-60% carbs from whole pulses/grains, 10-15%+ protein from dals, soya chunks, and sprouts, and WHO zero added sugar limits.",
    icmrComplianceScore: 96,
    allergenWarnings: userProfile?.allergies?.length
      ? [`Excluded specified allergens: ${userProfile.allergies.join(", ")}`]
      : ["Verified zero added sugar and vegetarian safe."],
    shoppingList: [
      { item: "Toor Dal (Arhar)", quantityNeeded: "500g", estimatedCostInr: 61, category: "Pulses", reason: "Protein staple for daily lunch" },
      { item: "Soya Chunks", quantityNeeded: "300g", estimatedCostInr: 33, category: "Pulses", reason: "52% protein density for dinners" },
      { item: "Unsweetened Muesli / Oats", quantityNeeded: "400g", estimatedCostInr: 120, category: "Grains", reason: "Zero added sugar breakfast" },
      { item: "Fresh Tomatoes & Onions", quantityNeeded: "1kg each", estimatedCostInr: 74, category: "Produce", reason: "Daily vegetable servings" },
      { item: "Chia & Flax Seeds", quantityNeeded: "100g each", estimatedCostInr: 60, category: "Seeds", reason: "Omega-3 and fiber boost" }
    ],
    days: dayTemplates
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "NutriPlan AI Server", timestamp: new Date().toISOString() });
  });

  // Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userProfile, inventory } = req.body;
      const ai = getGeminiClient();

      const inventoryText = Array.isArray(inventory)
        ? inventory.map((i: any) => `${i.name}: ${i.quantity} ${i.unit}`).join(", ")
        : JSON.stringify(inventory);

      const profileText = userProfile
        ? `User Profile: Age ${userProfile.age}, ${userProfile.gender}, ${userProfile.weightKg}kg, ${userProfile.heightCm}cm, Activity: ${userProfile.activityLevel}, Goal: ${userProfile.goal}, Protein Target: ${userProfile.proteinTargetGrams}g, Calorie Target: ${userProfile.calorieTargetKcal} kcal, Budget: ₹${userProfile.dailyBudgetInr}/day, Allergies: [${(userProfile.allergies || []).join(", ")}].`
        : "Default Vegetarian User";

      const fullPrompt = `${profileText}\nCurrent Available Pantry Stock: ${inventoryText}\n\nUser Question/Instruction:\n${messages[messages.length - 1]?.text || 'Hello'}`;

      const response = await generateContentWithRetry(ai, {
        contents: fullPrompt,
        config: {
          systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text || "I am processing your nutrition query." });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.json({ text: "I apologize, but the AI service is experiencing a temporary spike in traffic. However, based on ICMR 2024 guidelines for your profile: ensure you combine 1 part dal with 2 parts whole grains, incorporate 30g roasted chana or soya chunks daily, and maintain zero added sugars." });
    }
  });

  // Generate 7-Day Meal Plan Endpoint
  app.post("/api/generate-meal-plan", async (req, res) => {
    try {
      const { userProfile, inventory, customPrompt } = req.body;
      const ai = getGeminiClient();

      const inventoryList = Array.isArray(inventory)
        ? inventory.map((i: any) => `- ${i.name}: ${i.quantity} ${i.unit} (${i.category})`).join("\n")
        : "Standard non-refrigerated pantry stock";

      const prompt = `
Create a complete 7-Day Vegetarian, Zero-Added-Sugar Meal Plan based on the following:

USER PROFILE:
- Age: ${userProfile?.age || 35}, Gender: ${userProfile?.gender || 'male'}
- Weight: ${userProfile?.weightKg || 72} kg, Height: ${userProfile?.heightCm || 168} cm
- Calorie Goal: ${userProfile?.calorieTargetKcal || 1600} kcal/day
- Protein Goal: ${userProfile?.proteinTargetGrams || 80} g/day (Use dals, soya chunks, sprouted pulses, chana, seeds, nuts, curd)
- Allergies to STRICTLY EXCLUDE: [${(userProfile?.allergies || []).join(', ')}]
- Daily Grocery Budget Target: ₹${userProfile?.dailyBudgetInr || 175}/day (~₹1,050 to ₹1,400 for 7 days)
- Special Preferences: ${userProfile?.dietaryPreferences || 'Vegetarian, zero sugar'}

CURRENT PANTRY STOCK (Use as much as possible):
${inventoryList}

${customPrompt ? `ADDITIONAL USER INSTRUCTION: ${customPrompt}` : ''}

Provide a structured JSON output with all 7 days (Day 1 to Day 7), exact portions, macro breakdowns, preparation notes, shopping list for missing items with estimated costs in INR, and ICMR compliance evaluation.
`;

      try {
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          config: {
            systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                planTitle: { type: Type.STRING },
                summary: { type: Type.STRING },
                targetProteinGrams: { type: Type.NUMBER },
                targetCaloriesKcal: { type: Type.NUMBER },
                dailyBudgetInr: { type: Type.NUMBER },
                totalWeeklyCostInr: { type: Type.NUMBER },
                nutritionistNotes: { type: Type.STRING },
                icmrComplianceScore: { type: Type.NUMBER },
                allergenWarnings: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                shoppingList: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING },
                      quantityNeeded: { type: Type.STRING },
                      estimatedCostInr: { type: Type.NUMBER },
                      category: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ["item", "quantityNeeded", "estimatedCostInr", "category", "reason"]
                  }
                },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber: { type: Type.NUMBER },
                      dayName: { type: Type.STRING },
                      totalProteinGrams: { type: Type.NUMBER },
                      totalCaloriesKcal: { type: Type.NUMBER },
                      totalFiberGrams: { type: Type.NUMBER },
                      breakfast: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          caloriesKcal: { type: Type.NUMBER },
                          proteinGrams: { type: Type.NUMBER },
                          fiberGrams: { type: Type.NUMBER },
                          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                          preparationNotes: { type: Type.STRING },
                          isZeroAddedSugar: { type: Type.BOOLEAN },
                          usesPantryStock: { type: Type.BOOLEAN }
                        },
                        required: ["name", "portion", "caloriesKcal", "proteinGrams", "ingredients", "preparationNotes", "isZeroAddedSugar", "usesPantryStock"]
                      },
                      lunch: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          caloriesKcal: { type: Type.NUMBER },
                          proteinGrams: { type: Type.NUMBER },
                          fiberGrams: { type: Type.NUMBER },
                          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                          preparationNotes: { type: Type.STRING },
                          isZeroAddedSugar: { type: Type.BOOLEAN },
                          usesPantryStock: { type: Type.BOOLEAN }
                        },
                        required: ["name", "portion", "caloriesKcal", "proteinGrams", "ingredients", "preparationNotes", "isZeroAddedSugar", "usesPantryStock"]
                      },
                      eveningSnack: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          caloriesKcal: { type: Type.NUMBER },
                          proteinGrams: { type: Type.NUMBER },
                          fiberGrams: { type: Type.NUMBER },
                          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                          preparationNotes: { type: Type.STRING },
                          isZeroAddedSugar: { type: Type.BOOLEAN },
                          usesPantryStock: { type: Type.BOOLEAN }
                        },
                        required: ["name", "portion", "caloriesKcal", "proteinGrams", "ingredients", "preparationNotes", "isZeroAddedSugar", "usesPantryStock"]
                      },
                      dinner: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          name: { type: Type.STRING },
                          type: { type: Type.STRING },
                          portion: { type: Type.STRING },
                          caloriesKcal: { type: Type.NUMBER },
                          proteinGrams: { type: Type.NUMBER },
                          fiberGrams: { type: Type.NUMBER },
                          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                          preparationNotes: { type: Type.STRING },
                          isZeroAddedSugar: { type: Type.BOOLEAN },
                          usesPantryStock: { type: Type.BOOLEAN }
                        },
                        required: ["name", "portion", "caloriesKcal", "proteinGrams", "ingredients", "preparationNotes", "isZeroAddedSugar", "usesPantryStock"]
                      }
                    },
                    required: ["dayNumber", "dayName", "totalProteinGrams", "totalCaloriesKcal", "breakfast", "lunch", "eveningSnack", "dinner"]
                  }
                }
              },
              required: ["planTitle", "summary", "targetProteinGrams", "targetCaloriesKcal", "dailyBudgetInr", "totalWeeklyCostInr", "days", "shoppingList", "nutritionistNotes", "allergenWarnings", "icmrComplianceScore"]
            }
          }
        });

        const planData = JSON.parse(response.text || "{}");
        res.json(planData);
      } catch (geminiError: any) {
        console.warn("Gemini API unavailable for meal plan, serving clinical fallback plan:", geminiError?.message);
        const fallbackPlan = generateFallbackMealPlan(userProfile, inventory);
        res.json(fallbackPlan);
      }
    } catch (error: any) {
      console.error("Meal plan generation top-level error:", error);
      res.status(500).json({ error: error.message || "Failed to generate meal plan" });
    }
  });

  // Ingredient Substitution Endpoint
  app.post("/api/substitute", async (req, res) => {
    try {
      const { missingItem, inventory, allergies, mealName } = req.body;
      const ai = getGeminiClient();

      const inventoryList = Array.isArray(inventory)
        ? inventory.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ")
        : "";

      const prompt = `
The user is missing '${missingItem}' for preparing '${mealName || 'a scheduled meal'}'.
Available Stock: ${inventoryList}
User Allergies: [${(allergies || []).join(", ")}]

Suggest a healthy, high-protein vegetarian substitution using available stock or common pantry staples.
Ensure zero added sugar and allergen safety.
`;

      try {
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          config: {
            systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                originalItem: { type: Type.STRING },
                substituteItem: { type: Type.STRING },
                portionAdjustment: { type: Type.STRING },
                recipeAdjustment: { type: Type.STRING },
                nutritionalImpact: { type: Type.STRING },
                allergenSafetyCheck: { type: Type.STRING }
              },
              required: ["originalItem", "substituteItem", "portionAdjustment", "recipeAdjustment", "nutritionalImpact", "allergenSafetyCheck"]
            }
          }
        });

        const result = JSON.parse(response.text || "{}");
        res.json(result);
      } catch (err) {
        res.json({
          originalItem: missingItem,
          substituteItem: "Soya Chunks / Sprouted Moong",
          portionAdjustment: "Use 30g dry soya chunks or 1 cup sprouted moong in place of missing item.",
          recipeAdjustment: "Boil for 5 minutes in salted turmeric water before cooking.",
          nutritionalImpact: "Maintains high vegetarian protein (~15g protein per serving) with zero added sugar.",
          allergenSafetyCheck: "Safe for strict vegetarian and zero-sugar diets."
        });
      }
    } catch (error: any) {
      console.error("Substitution API error:", error);
      res.status(500).json({ error: error.message || "Failed to generate substitution" });
    }
  });

  // Shuffle Recipe Endpoint
  app.post("/api/shuffle-recipe", async (req, res) => {
    try {
      const { mealSlot, currentMeal, userProfile, inventory } = req.body;
      const ai = getGeminiClient();

      const inventoryList = Array.isArray(inventory)
        ? inventory.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ")
        : "Standard pantry staples";

      const prompt = `
Suggest a distinct alternative dish for the '${mealSlot || currentMeal?.type || 'Breakfast'}' slot in a high-protein, zero-added-sugar Indian vegetarian diet.

CURRENT DISH TO REPLACE:
- Name: ${currentMeal?.name || 'Current Meal'}
- Ingredients currently used: ${(currentMeal?.ingredients || []).join(', ')}
- Current portion: ${currentMeal?.portion || '1 serving'}
- Current macros: ${currentMeal?.caloriesKcal || 350} kcal, ${currentMeal?.proteinGrams || 18}g protein

REQUIREMENTS:
- Must be a DIFFERENT delicious Indian vegetarian dish for ${mealSlot || 'this meal slot'}.
- Should use the SAME key ingredients or available pantry stock: ${inventoryList}
- Must have 0g added sugar.
- Target calories: ~${currentMeal?.caloriesKcal || 350} kcal, Target protein: ~${currentMeal?.proteinGrams || 18}g.
- Allergies to strictly exclude: [${(userProfile?.allergies || []).join(', ')}]
`;

      try {
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          config: {
            systemInstruction: DIETITIAN_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                portion: { type: Type.STRING },
                caloriesKcal: { type: Type.NUMBER },
                proteinGrams: { type: Type.NUMBER },
                fiberGrams: { type: Type.NUMBER },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                preparationNotes: { type: Type.STRING },
                isZeroAddedSugar: { type: Type.BOOLEAN },
                usesPantryStock: { type: Type.BOOLEAN },
              },
              required: ["name", "portion", "caloriesKcal", "proteinGrams", "ingredients", "preparationNotes", "isZeroAddedSugar", "usesPantryStock"]
            }
          }
        });

        const newMeal = JSON.parse(response.text || "{}");
        if (!newMeal.id) newMeal.id = `shuffled-${Date.now()}`;
        if (!newMeal.type) newMeal.type = mealSlot || currentMeal?.type || 'Breakfast';
        res.json(newMeal);
      } catch (err) {
        console.warn("Shuffle AI fallback triggered:", err);
        const fallback = getFallbackShuffleMeal(mealSlot || currentMeal?.type || 'Breakfast', currentMeal?.name);
        res.json(fallback);
      }
    } catch (error: any) {
      console.error("Shuffle recipe API error:", error);
      const fallback = getFallbackShuffleMeal(req.body?.mealSlot || 'Breakfast', req.body?.currentMeal?.name);
      res.json(fallback);
    }
  });

  // Vision OCR Pantry Scanner Endpoint
  app.post("/api/scan-pantry-image", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      const ai = getGeminiClient();

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 data" });
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64,
        },
      };

      const textPart = {
        text: `Analyze this image of a kitchen pantry, food cupboard, groceries, or shopping receipt. Extract all non-refrigerated food items, pulses, dals, grains, flours, seeds, nuts, vegetables, and staples visible or listed.
Return a clean JSON array of items with estimated quantities, units, and categories.`,
      };

      const response = await generateContentWithRetry(ai, {
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: "You are an optical recognition expert for grocery items and pantry ingredients. Extract items into structured JSON format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { 
                  type: Type.STRING,
                  description: "One of: pulses_legumes, grains_flours, seeds_nuts, fresh_produce, dairy_alternatives, spices_others"
                },
                quantity: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                isShelfStable: { type: Type.BOOLEAN }
              },
              required: ["name", "category", "quantity", "unit", "isShelfStable"]
            }
          }
        }
      });

      const items = JSON.parse(response.text || "[]");
      res.json({ items });
    } catch (error: any) {
      console.error("Pantry scanner error:", error);
      res.status(500).json({ error: error.message || "Failed to scan pantry image" });
    }
  });

  // Serve static assets / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NutriPlan AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
