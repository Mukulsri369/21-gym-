import React, { useState } from 'react';
import { Check, Copy, Download, Plus, Minus, RotateCcw } from 'lucide-react';
import { soundEngine } from '../utils/sound';

type Gender = 'male' | 'female';
type ActivityTier = 'light' | 'moderate' | 'active' | 'athlete';
type GoalPreset = 'aggressive-cut' | 'lean-cut' | 'recomp' | 'lean-bulk' | 'mass-bulk';
type DietPreference = 'veg' | 'eggetarian' | 'non-veg';
type ActiveCalculatorTab = 'meal-plan' | 'food-tracker';

interface ActivityOption {
  id: ActivityTier;
  label: string;
  desc: string;
  multiplier: number;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { id: 'light', label: '3 Days / Wk', desc: 'Desk job + 3 gym workouts', multiplier: 1.375 },
  { id: 'moderate', label: '4–5 Days / Wk', desc: 'Moderate activity + 4–5 workouts', multiplier: 1.55 },
  { id: 'active', label: '6 Days / Wk', desc: 'Intense 6-day PPL training', multiplier: 1.725 },
  { id: 'athlete', label: '2× Daily / Pro', desc: 'Heavy manual/athletic + cardio', multiplier: 1.9 },
];

interface GoalOption {
  id: GoalPreset;
  label: string;
  sub: string;
  calMultiplier: number;
  proteinPerKg: number;
  fatPerKg: number;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'aggressive-cut',
    label: 'Rapid Fat Cut',
    sub: '-22% kcal',
    calMultiplier: 0.78,
    proteinPerKg: 2.3,
    fatPerKg: 0.75,
  },
  {
    id: 'lean-cut',
    label: 'Lean Shred',
    sub: '-15% kcal',
    calMultiplier: 0.85,
    proteinPerKg: 2.2,
    fatPerKg: 0.8,
  },
  {
    id: 'recomp',
    label: 'Body Recomp',
    sub: 'Maintenance',
    calMultiplier: 1.0,
    proteinPerKg: 2.1,
    fatPerKg: 0.85,
  },
  {
    id: 'lean-bulk',
    label: 'Lean Bulk',
    sub: '+12% kcal',
    calMultiplier: 1.12,
    proteinPerKg: 2.0,
    fatPerKg: 0.9,
  },
  {
    id: 'mass-bulk',
    label: 'Mass Gain',
    sub: '+20% kcal',
    calMultiplier: 1.2,
    proteinPerKg: 1.95,
    fatPerKg: 1.0,
  },
];

interface FoodCatalogItem {
  id: string;
  name: string;
  servingLabel: string;
  diet: ('veg' | 'eggetarian' | 'non-veg')[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const FOOD_CATALOG: FoodCatalogItem[] = [
  {
    id: 'whey',
    name: 'Whey Protein Isolate',
    servingLabel: '1 Scoop (32g)',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 120,
    protein: 25,
    carbs: 2,
    fats: 1,
  },
  {
    id: 'chicken',
    name: 'Grilled Chicken Breast',
    servingLabel: '150g (Raw weight)',
    diet: ['non-veg'],
    calories: 165,
    protein: 35,
    carbs: 0,
    fats: 3,
  },
  {
    id: 'whole-eggs',
    name: 'Whole Boiled Eggs',
    servingLabel: '2 Large Eggs',
    diet: ['eggetarian', 'non-veg'],
    calories: 144,
    protein: 12,
    carbs: 1,
    fats: 10,
  },
  {
    id: 'egg-whites',
    name: 'Pasteurized Egg Whites',
    servingLabel: '4 Egg Whites',
    diet: ['eggetarian', 'non-veg'],
    calories: 68,
    protein: 14,
    carbs: 1,
    fats: 0,
  },
  {
    id: 'paneer',
    name: 'Low-Fat Paneer (Cottage Cheese)',
    servingLabel: '100g',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 195,
    protein: 20,
    carbs: 4,
    fats: 11,
  },
  {
    id: 'soya',
    name: 'Soya Chunks (Dry Weight)',
    servingLabel: '50g Dry',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 172,
    protein: 26,
    carbs: 16,
    fats: 0.5,
  },
  {
    id: 'oats',
    name: 'Rolled Oats',
    servingLabel: '60g Dry',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 230,
    protein: 8,
    carbs: 40,
    fats: 4,
  },
  {
    id: 'rice',
    name: 'Steamed Basmati / Brown Rice',
    servingLabel: '150g Cooked Bowl',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 195,
    protein: 4,
    carbs: 43,
    fats: 0.5,
  },
  {
    id: 'roti',
    name: 'Whole Wheat Roti / Chapati',
    servingLabel: '2 Medium Rotis',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 210,
    protein: 6,
    carbs: 42,
    fats: 2,
  },
  {
    id: 'dal',
    name: 'Thick Moong / Toor Dal & Chickpeas',
    servingLabel: '1 Large Bowl (200g)',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 220,
    protein: 12,
    carbs: 36,
    fats: 3,
  },
  {
    id: 'curd',
    name: 'Low-Fat Greek Dahi / Curd',
    servingLabel: '200g Bowl',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 130,
    protein: 14,
    carbs: 9,
    fats: 4,
  },
  {
    id: 'pb',
    name: 'Natural Unsweetened Peanut Butter',
    servingLabel: '1 Tbsp (16g)',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 95,
    protein: 4,
    carbs: 3,
    fats: 8,
  },
  {
    id: 'banana',
    name: 'Pre-Workout Banana',
    servingLabel: '1 Large Banana',
    diet: ['veg', 'eggetarian', 'non-veg'],
    calories: 115,
    protein: 1.5,
    carbs: 28,
    fats: 0.4,
  },
];

function cmToFeetInches(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches === 12 ? 0 : inches}"`;
}

export const NutritionCalculator: React.FC = () => {
  // Biometrics State
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [weightKg, setWeightKg] = useState<number>(74);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(78);
  const [useBodyFat, setUseBodyFat] = useState<boolean>(false);
  const [bodyFatPct, setBodyFatPct] = useState<number>(16);

  // Lifestyle & Goal State
  const [activityId, setActivityId] = useState<ActivityTier>('moderate');
  const [goalId, setGoalId] = useState<GoalPreset>('lean-bulk');
  const [dietPreference, setDietPreference] = useState<DietPreference>('non-veg');
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4 | 5>(4);

  // Interactive Tabs: 'meal-plan' vs 'food-tracker'
  const [activeTab, setActiveTab] = useState<ActiveCalculatorTab>('meal-plan');
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);

  // Interactive Food Plate Builder Quantities (id -> servings)
  const [loggedFoods, setLoggedFoods] = useState<Record<string, number>>({
    whey: 1,
    oats: 1,
    chicken: 1,
    'whole-eggs': 1,
    rice: 2,
    roti: 1,
    pb: 1,
  });

  // 1. Scientific BMR Calculation (Mifflin-St Jeor or Katch-McArdle if Body Fat % enabled)
  const leanBodyMassKg = weightKg * (1 - bodyFatPct / 100);
  const bmr = useBodyFat
    ? Math.round(370 + 21.6 * leanBodyMassKg)
    : Math.round(
        10 * weightKg + 6.25 * heightCm - 5 * age + (gender === 'male' ? 5 : -161)
      );

  const activityObj = ACTIVITY_OPTIONS.find((a) => a.id === activityId) || ACTIVITY_OPTIONS[1];
  const goalObj = GOAL_OPTIONS.find((g) => g.id === goalId) || GOAL_OPTIONS[3];

  const tdee = Math.round(bmr * activityObj.multiplier);
  const targetCalories = Math.max(1250, Math.round(tdee * goalObj.calMultiplier));
  const dailyCalorieDelta = targetCalories - tdee;

  // 2. Macronutrient Split Calculation
  const proteinGrams = Math.round(weightKg * goalObj.proteinPerKg);
  const fatGrams = Math.round(weightKg * goalObj.fatPerKg);
  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;
  const carbCalories = Math.max(240, targetCalories - proteinCalories - fatCalories);
  const carbGrams = Math.round(carbCalories / 4);
  const actualTotalCalories = proteinCalories + fatCalories + carbGrams * 4;

  const proteinPct = Math.round((proteinCalories / actualTotalCalories) * 100);
  const carbPct = Math.round(((carbGrams * 4) / actualTotalCalories) * 100);
  const fatPct = Math.max(10, 100 - proteinPct - carbPct);

  // 3. BMI, Hydration, Fiber & Target Timeline
  const heightM = heightCm / 100;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);
  const waterLiters = (weightKg * 0.045 + (activityId === 'active' || activityId === 'athlete' ? 0.8 : 0.4)).toFixed(1);
  const fiberGrams = Math.round((targetCalories / 1000) * 14);

  const weightDiffKg = targetWeightKg - weightKg;
  const weeklyRateKg =
    Math.abs(dailyCalorieDelta) > 50
      ? Number(((Math.abs(dailyCalorieDelta) * 7) / 7700).toFixed(2))
      : 0.25;
  const estimatedWeeks =
    Math.abs(weightDiffKg) < 0.5
      ? 0
      : Math.min(52, Math.max(1, Math.round(Math.abs(weightDiffKg) / weeklyRateKg)));

  // 4. Dynamic Scaled 4-Meal Daily Plan Based on User's Diet Preference & Macros
  const generateScaledMeals = () => {
    const scale = targetCalories / 2400;
    const pScale = proteinGrams / 160;

    if (dietPreference === 'veg') {
      return [
        {
          meal: 'Meal 1 · Breakfast & Pre-Day Fuel',
          timing: '08:00 AM',
          items: `${Math.round(60 * scale)}g Rolled Oats + 250ml Skim Milk + 1 Scoop Whey Isolate (or ${Math.round(40 * pScale)}g Soya Chunks) + ${Math.round(15 * scale)}g Almonds`,
          p: Math.round(38 * pScale),
          c: Math.round(58 * scale),
          f: Math.round(14 * scale),
        },
        {
          meal: 'Meal 2 · High-Protein Indian Lunch',
          timing: '01:30 PM',
          items: `${Math.round(140 * pScale)}g Low-Fat Paneer Bhurji/Tikka + ${Math.round(2 * scale)} Whole Wheat Rotis + 150g Thick Dal + Green Salad`,
          p: Math.round(42 * pScale),
          c: Math.round(68 * scale),
          f: Math.round(18 * scale),
        },
        {
          meal: 'Meal 3 · Pre & Post-Workout Window',
          timing: '05:30 PM – 07:30 PM',
          items: `Pre: 1 Banana + Black Coffee · Post-Workout: 1.5 Scoops Whey Protein in Water + 5g Creatine Monohydrate`,
          p: Math.round(38 * pScale),
          c: Math.round(32 * scale),
          f: 2,
        },
        {
          meal: 'Meal 4 · Recovery Dinner',
          timing: '09:00 PM',
          items: `${Math.round(55 * pScale)}g Soya Chunks Stir-Fry + ${Math.round(150 * scale)}g Steamed Rice + 200g Greek Dahi / Curd`,
          p: Math.round(42 * pScale),
          c: Math.round(56 * scale),
          f: Math.round(10 * scale),
        },
      ];
    }

    if (dietPreference === 'eggetarian') {
      return [
        {
          meal: 'Meal 1 · High-Protein Egg & Oats Breakfast',
          timing: '08:00 AM',
          items: `${Math.max(2, Math.round(2 * pScale))} Whole Eggs + ${Math.max(3, Math.round(4 * pScale))} Egg Whites Omelette + ${Math.round(55 * scale)}g Rolled Oats`,
          p: Math.round(38 * pScale),
          c: Math.round(48 * scale),
          f: Math.round(15 * scale),
        },
        {
          meal: 'Meal 2 · Balanced Indian Lunch',
          timing: '01:30 PM',
          items: `${Math.round(120 * pScale)}g Low-Fat Paneer + ${Math.round(2 * scale)} Whole Wheat Rotis + 1 Bowl Chana / Moong Dal + Curd`,
          p: Math.round(40 * pScale),
          c: Math.round(70 * scale),
          f: Math.round(16 * scale),
        },
        {
          meal: 'Meal 3 · Pre & Post-Workout Fuel',
          timing: '05:30 PM – 07:30 PM',
          items: `Pre: 1 Banana + 1 Slice Toast · Post-Workout: 1 Scoop Whey Isolate + ${Math.max(3, Math.round(4 * pScale))} Boiled Egg Whites + 5g Creatine`,
          p: Math.round(42 * pScale),
          c: Math.round(42 * scale),
          f: 2,
        },
        {
          meal: 'Meal 4 · Lean Recovery Dinner',
          timing: '09:00 PM',
          items: `${Math.round(50 * pScale)}g Soya Chunks or Egg Bhurji (5 Whites + 1 Yolk) + ${Math.round(150 * scale)}g Steamed Rice + Mixed Veggies`,
          p: Math.round(40 * pScale),
          c: Math.round(52 * scale),
          f: Math.round(11 * scale),
        },
      ];
    }

    // Default: Non-Vegetarian Bodybuilding Plan
    return [
      {
        meal: 'Meal 1 · Anabolic Egg & Oats Breakfast',
        timing: '08:00 AM',
        items: `${Math.max(2, Math.round(2 * pScale))} Whole Eggs + ${Math.max(3, Math.round(4 * pScale))} Egg Whites + ${Math.round(60 * scale)}g Oats with 1 Tbsp Peanut Butter`,
        p: Math.round(38 * pScale),
        c: Math.round(46 * scale),
        f: Math.round(18 * scale),
      },
      {
        meal: 'Meal 2 · Lean Chicken & Rice Lunch',
        timing: '01:30 PM',
        items: `${Math.round(160 * pScale)}g Grilled Chicken Breast + ${Math.round(180 * scale)}g Steamed Basmati Rice + 100g Curd & Cucumber Salad`,
        p: Math.round(44 * pScale),
        c: Math.round(62 * scale),
        f: Math.round(9 * scale),
      },
      {
        meal: 'Meal 3 · Pre & Post-Workout Window',
        timing: '05:30 PM – 07:30 PM',
        items: `Pre: 1 Large Banana + Espresso · Post-Workout: 1 Scoop Whey Protein Isolate + 5g Creatine Monohydrate`,
        p: Math.round(32 * pScale),
        c: Math.round(34 * scale),
        f: 2,
      },
      {
        meal: 'Meal 4 · Hypertrophy Recovery Dinner',
        timing: '09:00 PM',
        items: `${Math.round(160 * pScale)}g Chicken Breast or Grilled Fish + ${Math.round(2 * scale)} Whole Wheat Rotis + Sautéed Broccoli & Beans`,
        p: Math.round(46 * pScale),
        c: Math.round(52 * scale),
        f: Math.round(12 * scale),
      },
    ];
  };

  const scaledMeals = generateScaledMeals();

  // 5. Interactive Food Plate Builder Totals
  const loggedTotals = Object.entries(loggedFoods).reduce(
    (acc, [foodId, count]) => {
      if (count <= 0) return acc;
      const item = FOOD_CATALOG.find((f) => f.id === foodId);
      if (!item) return acc;
      acc.calories += Math.round(item.calories * count);
      acc.protein += Math.round(item.protein * count);
      acc.carbs += Math.round(item.carbs * count);
      acc.fats += Math.round(item.fats * count);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const handleAdjustFoodCount = (foodId: string, delta: number) => {
    soundEngine.playMechanicalTick(delta > 0 ? 1.15 : 0.9);
    setLoggedFoods((prev) => {
      const nextVal = Math.max(0, Math.min(10, (prev[foodId] || 0) + delta));
      return { ...prev, [foodId]: nextVal };
    });
  };

  const handleAutoFillPlateForDiet = (pref: DietPreference) => {
    soundEngine.playMechanicalTick(1.1);
    setDietPreference(pref);
    if (pref === 'veg') {
      setLoggedFoods({ whey: 1, paneer: 2, soya: 1, oats: 1, rice: 1, roti: 1, dal: 1, pb: 1 });
    } else if (pref === 'eggetarian') {
      setLoggedFoods({
        whey: 1,
        'whole-eggs': 2,
        'egg-whites': 2,
        paneer: 1,
        oats: 1,
        rice: 1,
        roti: 1,
      });
    } else {
      setLoggedFoods({
        whey: 1,
        chicken: 2,
        'whole-eggs': 1,
        'egg-whites': 1,
        oats: 1,
        rice: 2,
        roti: 1,
        pb: 1,
      });
    }
  };

  const buildExportText = () => {
    const lines = [
      '====================================================',
      '   21 FITNESS · PERSONALIZED NUTRITION BLUEPRINT    ',
      '====================================================',
      `Biometrics: ${gender.toUpperCase()} · Age ${age} · Height ${heightCm} cm (${cmToFeetInches(heightCm)})`,
      `Current Weight: ${weightKg} kg · Target Weight: ${targetWeightKg} kg · BMI: ${bmi}`,
      `Goal: ${goalObj.label} (${goalObj.sub}) · Activity: ${activityObj.label}`,
      '----------------------------------------------------',
      `BMR (Basal Metabolic Rate): ${bmr} kcal/day`,
      `TDEE (Maintenance Calories): ${tdee} kcal/day`,
      `TARGET DAILY INTAKE: ${actualTotalCalories} kcal/day`,
      `  • Protein: ${proteinGrams}g (${proteinPct}%) — ~${Math.round(proteinGrams / mealsPerDay)}g per meal`,
      `  • Carbohydrates: ${carbGrams}g (${carbPct}%)`,
      `  • Healthy Fats: ${fatGrams}g (${fatPct}%)`,
      `  • Dietary Fiber: ${fiberGrams}g · Hydration: ${waterLiters} Liters/day`,
      `  • Daily Supplement: 5g Creatine Monohydrate post-workout`,
      '----------------------------------------------------',
      `RECOMMENDED DAILY MEAL PLAN (${dietPreference.toUpperCase()}):`,
      ...scaledMeals.map(
        (m) => `\n[${m.timing}] ${m.meal}\n  ${m.items}\n  Macros: ${m.p}g Protein · ${m.c}g Carbs · ${m.f}g Fats`
      ),
      '====================================================',
      '21 Fitness · Membership Plans: ₹1,200 (1M) | ₹6,000 (6M) | ₹10,000 (1Yr)',
    ];
    return lines.join('\n');
  };

  const handleCopyBlueprint = () => {
    soundEngine.playMechanicalTick(1.2);
    navigator.clipboard?.writeText(buildExportText()).catch(() => {});
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  const handleDownloadBlueprint = () => {
    soundEngine.playPlateLock(120);
    const blob = new Blob([buildExportText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `21-Fitness-Diet-Plan-${weightKg}kg-${goalObj.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-white/[0.08] bg-[#111114] rounded-lg p-6 sm:p-8 lg:p-10 mb-14">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#D4AF37] font-medium mb-1">
            <span>21 Fitness Clinical Nutrition Engine</span>
            <span aria-hidden="true">·</span>
            <span>Mifflin-St Jeor &amp; Katch-McArdle Verified</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-semibold text-white">
            Interactive Calorie, Protein &amp; Diet Chart Calculator
          </h3>
        </div>

        {/* Export / Copy Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={handleCopyBlueprint}
            className="px-3.5 py-2 text-xs font-medium bg-[#09090B] hover:bg-white/10 border border-white/10 rounded-md text-neutral-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedPlan ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Diet Plan Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Copy Diet Plan</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleDownloadBlueprint}
            className="px-3.5 py-2 text-xs font-medium bg-[#D4AF37] hover:bg-[#e2be46] text-[#09090B] rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Diet Chart (.txt)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pt-7 items-start">
        {/* LEFT COLUMN (5 Cols): Biometric & Training Inputs */}
        <div className="lg:col-span-5 space-y-5 bg-[#09090B] border border-white/[0.07] rounded-lg p-5 sm:p-6">
          {/* 1. Gender & Age Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Biological Sex</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#111114] border border-white/[0.07] rounded-md">
                {(['male', 'female'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      soundEngine.playMechanicalTick(1.0);
                      setGender(g);
                    }}
                    className={`py-1.5 text-xs capitalize rounded transition-colors cursor-pointer ${
                      gender === g
                        ? 'bg-white text-[#09090B] font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="calc-age" className="block text-xs text-neutral-400 mb-1.5">
                Age (Years)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="calc-age"
                  type="number"
                  min={14}
                  max={80}
                  value={age}
                  onChange={(e) => setAge(Math.max(14, Math.min(80, Number(e.target.value) || 18)))}
                  className="w-full px-3 py-1.5 text-sm font-mono bg-[#111114] border border-white/10 focus:border-[#D4AF37] focus:outline-none rounded-md text-white tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* 2. Height Slider + Input */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="calc-height" className="text-neutral-300">
                Height
              </label>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-mono">{cmToFeetInches(heightCm)}</span>
                <input
                  id="calc-height"
                  type="number"
                  min={140}
                  max={215}
                  value={heightCm}
                  onChange={(e) =>
                    setHeightCm(Math.max(140, Math.min(215, Number(e.target.value) || 170)))
                  }
                  className="w-16 px-2 py-0.5 text-xs font-mono text-right bg-[#111114] border border-white/10 rounded text-white tabular-nums"
                />
                <span className="text-xs text-neutral-400">cm</span>
              </div>
            </div>
            <input
              type="range"
              min={140}
              max={210}
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="dock-slider w-full"
            />
          </div>

          {/* 3. Current Weight & Target Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="calc-weight" className="text-neutral-300">
                  Current Weight
                </label>
                <span className="font-mono text-white font-medium tabular-nums">
                  {weightKg} kg
                </span>
              </div>
              <input
                id="calc-weight"
                type="range"
                min={40}
                max={140}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="dock-slider w-full"
              />
              <div className="mt-1 text-[11px] text-neutral-500 font-mono">
                {Math.round(weightKg * 2.205)} lbs · BMI {bmi}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="calc-target-weight" className="text-neutral-300">
                  Goal Weight
                </label>
                <span className="font-mono text-[#D4AF37] font-medium tabular-nums">
                  {targetWeightKg} kg
                </span>
              </div>
              <input
                id="calc-target-weight"
                type="range"
                min={40}
                max={140}
                value={targetWeightKg}
                onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                className="dock-slider w-full"
              />
              <div className="mt-1 text-[11px] text-neutral-500 font-mono">
                {weightDiffKg === 0
                  ? 'Maintain current weight'
                  : `${weightDiffKg > 0 ? '+' : ''}${weightDiffKg} kg (${
                      estimatedWeeks > 0 ? `~${estimatedWeeks} wks` : 'On target'
                    })`}
              </div>
            </div>
          </div>

          {/* 4. Optional Body Fat % (Katch-McArdle Precision Mode) */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs mb-2">
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBodyFat}
                  onChange={(e) => setUseBodyFat(e.target.checked)}
                  className="accent-[#D4AF37] rounded"
                />
                <span>Use Body Fat % (Katch-McArdle Formula)</span>
              </label>
              {useBodyFat && (
                <span className="font-mono text-[#D4AF37] tabular-nums">
                  {bodyFatPct}% ({leanBodyMassKg.toFixed(1)}kg LBM)
                </span>
              )}
            </div>
            {useBodyFat && (
              <input
                type="range"
                min={6}
                max={42}
                value={bodyFatPct}
                onChange={(e) => setBodyFatPct(Number(e.target.value))}
                className="dock-slider w-full"
              />
            )}
          </div>

          {/* 5. Training Frequency & Activity Multiplier */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="block text-xs text-neutral-300 mb-2">
              Weekly Training Frequency
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTIVITY_OPTIONS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playMechanicalTick(1.0);
                    setActivityId(act.id);
                  }}
                  className={`p-2 text-left rounded-md border transition-colors cursor-pointer ${
                    activityId === act.id
                      ? 'bg-[#16161C] border-[#D4AF37] text-white'
                      : 'bg-[#111114] border-white/[0.06] text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-medium">{act.label}</div>
                  <div className="text-[10px] text-neutral-500 truncate">{act.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Transformation Goal Preset */}
          <div className="pt-2 border-t border-white/[0.06]">
            <label className="block text-xs text-neutral-300 mb-2">
              Transformation Goal &amp; Caloric Pace
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {GOAL_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playMechanicalTick(1.1);
                    setGoalId(g.id);
                  }}
                  className={`p-2 text-left rounded-md border transition-colors cursor-pointer ${
                    goalId === g.id
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-[#09090B]'
                      : 'bg-[#111114] border-white/[0.06] text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-medium whitespace-nowrap">{g.label}</div>
                  <div
                    className={`text-[10px] font-mono ${
                      goalId === g.id ? 'text-[#09090B]/80' : 'text-neutral-500'
                    }`}
                  >
                    {g.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 7. Indian Diet Preference & Meals Per Day */}
          <div className="pt-2 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Diet Preference</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#111114] border border-white/[0.07] rounded-md">
                {(
                  [
                    { id: 'veg', label: 'Veg' },
                    { id: 'eggetarian', label: 'Egg' },
                    { id: 'non-veg', label: 'Non-Veg' },
                  ] as { id: DietPreference; label: string }[]
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleAutoFillPlateForDiet(d.id)}
                    className={`py-1 text-[11px] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      dietPreference === d.id
                        ? 'bg-white text-[#09090B] font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5">Meals Per Day</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#111114] border border-white/[0.07] rounded-md">
                {([3, 4, 5] as (3 | 4 | 5)[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      soundEngine.playMechanicalTick(0.95);
                      setMealsPerDay(m);
                    }}
                    className={`py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                      mealsPerDay === m
                        ? 'bg-white text-[#09090B] font-medium'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {m} Meals
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 Cols): Live Results, Macro Bar, Scaled Meal Plan & Food Tracker */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top Summary Box: BMR, TDEE, Target Calories & Macro Ratio Bar */}
          <div className="bg-[#09090B] border border-white/[0.07] rounded-lg p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-5 border-b border-white/[0.07]">
              <div>
                <div className="text-xs text-neutral-400">Daily Target Intake</div>
                <div className="font-display text-3xl sm:text-4xl font-semibold text-[#D4AF37] tabular-nums mt-0.5">
                  {actualTotalCalories.toLocaleString()} kcal
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                  {dailyCalorieDelta === 0
                    ? 'Exact Maintenance'
                    : `${dailyCalorieDelta > 0 ? '+' : ''}${dailyCalorieDelta} kcal/day vs TDEE`}
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-400">BMR &amp; Maintenance (TDEE)</div>
                <div className="font-display text-xl font-semibold text-white tabular-nums mt-1">
                  {tdee.toLocaleString()} kcal TDEE
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  Resting BMR: {bmr.toLocaleString()} kcal/day
                </div>
              </div>

              <div>
                <div className="text-xs text-neutral-400">Per-Meal Target ({mealsPerDay}×/day)</div>
                <div className="font-display text-xl font-semibold text-white tabular-nums mt-1">
                  ~{Math.round(proteinGrams / mealsPerDay)}g Protein / meal
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  ~{Math.round(actualTotalCalories / mealsPerDay)} kcal per meal
                </div>
              </div>
            </div>

            {/* 4 Macro Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
              <div className="p-3.5 bg-[#111114] border border-white/[0.06] rounded-md">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Protein</span>
                  <span className="font-mono text-[#D4AF37]">{proteinPct}%</span>
                </div>
                <div className="font-display text-2xl font-semibold text-white tabular-nums mt-1">
                  {proteinGrams} g
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {proteinCalories} kcal · {goalObj.proteinPerKg}g/kg
                </div>
              </div>

              <div className="p-3.5 bg-[#111114] border border-white/[0.06] rounded-md">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Carbs</span>
                  <span className="font-mono text-sky-400">{carbPct}%</span>
                </div>
                <div className="font-display text-2xl font-semibold text-white tabular-nums mt-1">
                  {carbGrams} g
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {carbGrams * 4} kcal · Glycogen
                </div>
              </div>

              <div className="p-3.5 bg-[#111114] border border-white/[0.06] rounded-md">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Healthy Fats</span>
                  <span className="font-mono text-emerald-400">{fatPct}%</span>
                </div>
                <div className="font-display text-2xl font-semibold text-white tabular-nums mt-1">
                  {fatGrams} g
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {fatCalories} kcal · Hormones
                </div>
              </div>

              <div className="p-3.5 bg-[#111114] border border-white/[0.06] rounded-md">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Water &amp; Fiber</span>
                  <span className="font-mono text-neutral-300">Daily</span>
                </div>
                <div className="font-display text-2xl font-semibold text-white tabular-nums mt-1">
                  {waterLiters} L
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {fiberGrams}g Fiber · 5g Creatine
                </div>
              </div>
            </div>

            {/* Proportional Macro Distribution Bar */}
            <div>
              <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-[#16161C]">
                <div
                  style={{ width: `${proteinPct}%` }}
                  className="bg-[#D4AF37] transition-all duration-300"
                  title={`Protein: ${proteinPct}%`}
                />
                <div
                  style={{ width: `${carbPct}%` }}
                  className="bg-sky-400 transition-all duration-300"
                  title={`Carbohydrates: ${carbPct}%`}
                />
                <div
                  style={{ width: `${fatPct}%` }}
                  className="bg-emerald-400 transition-all duration-300"
                  title={`Fats: ${fatPct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                <span>Protein: {proteinGrams}g (4 kcal/g)</span>
                <span>Carbs: {carbGrams}g (4 kcal/g)</span>
                <span>Fats: {fatGrams}g (9 kcal/g)</span>
              </div>
            </div>
          </div>

          {/* Bottom Interactive Panel: Switch Between Auto-Scaled Meal Plan & Interactive Food Macro Tracker */}
          <div className="bg-[#09090B] border border-white/[0.07] rounded-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-1 p-1 bg-[#111114] border border-white/[0.07] rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMechanicalTick(1.0);
                    setActiveTab('meal-plan');
                  }}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'meal-plan'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Auto-Scaled Daily Diet Chart
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMechanicalTick(1.05);
                    setActiveTab('food-tracker');
                  }}
                  className={`px-3 py-1.5 text-xs rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'food-tracker'
                      ? 'bg-[#D4AF37] text-[#09090B] font-medium'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Interactive Food Macro Builder
                </button>
              </div>

              <span className="text-xs text-neutral-400 capitalize">
                Mode: <strong className="text-white">{dietPreference}</strong>
              </span>
            </div>

            {activeTab === 'meal-plan' ? (
              <div className="mt-4 space-y-3">
                {scaledMeals.map((m) => (
                  <div
                    key={m.meal}
                    className="p-4 bg-[#111114] border border-white/[0.06] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[#D4AF37]">{m.timing}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-white">{m.meal}</span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{m.items}</p>
                    </div>
                    <div className="flex sm:flex-col items-end justify-between shrink-0 text-right font-mono text-[11px]">
                      <span className="text-[#D4AF37] font-medium">{m.p}g Protein</span>
                      <span className="text-neutral-400">
                        {m.c}g C · {m.f}g F
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                {/* Live Plate Progress vs Calculated Target */}
                <div className="p-4 bg-[#111114] border border-white/[0.07] rounded-md mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-neutral-300 font-medium">
                      Your Custom Plate Totals vs Daily Target
                    </span>
                    <button
                      type="button"
                      onClick={() => setLoggedFoods({})}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Plate</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <div className="text-neutral-400 text-[11px]">Calories</div>
                      <div
                        className={`font-semibold tabular-nums ${
                          Math.abs(loggedTotals.calories - actualTotalCalories) <= 150
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}
                      >
                        {loggedTotals.calories} / {actualTotalCalories}
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[11px]">Protein</div>
                      <div
                        className={`font-semibold tabular-nums ${
                          loggedTotals.protein >= proteinGrams ? 'text-emerald-400' : 'text-[#D4AF37]'
                        }`}
                      >
                        {loggedTotals.protein}g / {proteinGrams}g
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[11px]">Carbs</div>
                      <div className="text-white font-semibold tabular-nums">
                        {loggedTotals.carbs}g / {carbGrams}g
                      </div>
                    </div>
                    <div>
                      <div className="text-neutral-400 text-[11px]">Fats</div>
                      <div className="text-white font-semibold tabular-nums">
                        {loggedTotals.fats}g / {fatGrams}g
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add/Remove Foods Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {FOOD_CATALOG.map((food) => {
                    const count = loggedFoods[food.id] || 0;
                    return (
                      <div
                        key={food.id}
                        className={`p-3 rounded-md border flex items-center justify-between gap-2 transition-colors ${
                          count > 0
                            ? 'bg-[#15151A] border-[#D4AF37]/50'
                            : 'bg-[#111114] border-white/[0.06]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-white truncate">{food.name}</div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {food.servingLabel} · {food.protein}g P · {food.calories} kcal
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAdjustFoodCount(food.id, -1)}
                            aria-label={`Remove serving of ${food.name}`}
                            className="w-6 h-6 rounded bg-[#09090B] border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono text-xs text-white tabular-nums">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAdjustFoodCount(food.id, 1)}
                            aria-label={`Add serving of ${food.name}`}
                            className="w-6 h-6 rounded bg-[#D4AF37] text-[#09090B] flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
