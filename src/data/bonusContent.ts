// ─── BONUS 2: Food Introduction Checklist ───

export interface FoodItem {
  key: string;
  name: string;
  servingTip: string;
  allergenNote?: string;
  textureTip?: string;
  repeatAdvice?: string;
}

export interface FoodCategory {
  category: string;
  icon: string;
  foods: FoodItem[];
}

export interface AgeStage {
  ageRange: string;
  label: string;
  description: string;
  categories: FoodCategory[];
}

export const foodChecklistData: AgeStage[] = [
  {
    ageRange: '6-7',
    label: '6–7 Months — First Tastes',
    description: 'Start with single-ingredient purees. Offer one new food every 3 days to watch for allergic reactions. Portions should be 1–2 teaspoons, gradually increasing.',
    categories: [
      {
        category: 'Vegetables',
        icon: '🥕',
        foods: [
          { key: 'sweet-potato-6', name: 'Sweet Potato', servingTip: 'Steam until very soft, mash smooth with breast milk or formula', textureTip: 'Silky smooth puree, no lumps', repeatAdvice: 'Offer 3–5 times before deciding baby dislikes it' },
          { key: 'butternut-squash-6', name: 'Butternut Squash', servingTip: 'Roast until tender, blend until completely smooth', textureTip: 'Thin, runny puree at first', repeatAdvice: 'Natural sweetness makes this an easy first accept' },
          { key: 'carrot-6', name: 'Carrot', servingTip: 'Steam and puree very smooth. Avoid raw carrot (choking hazard)', textureTip: 'Very smooth, no fibrous pieces', repeatAdvice: 'Offer alone first, then mix with potato' },
          { key: 'courgette-6', name: 'Courgette / Zucchini', servingTip: 'Peel, steam, and blend. Very mild flavor for beginners', textureTip: 'Smooth puree, strain if needed', repeatAdvice: 'Great base for mixing with other veggies later' },
          { key: 'broccoli-6', name: 'Broccoli', servingTip: 'Steam florets until very soft, puree smooth. Include stems for nutrition', textureTip: 'Blend very well to avoid fibrous texture' },
          { key: 'peas-6', name: 'Peas', servingTip: 'Steam and blend. Strain through sieve to remove skins if baby gags', textureTip: 'Sieve for smoothest texture' },
        ]
      },
      {
        category: 'Fruits',
        icon: '🍎',
        foods: [
          { key: 'banana-6', name: 'Banana', servingTip: 'Mash ripe banana with fork — no cooking needed', textureTip: 'Smooth mash, naturally soft', repeatAdvice: 'If baby refuses, try mixing with breast milk' },
          { key: 'avocado-6', name: 'Avocado', servingTip: 'Mash ripe avocado smooth. Rich in healthy fats for brain development', textureTip: 'Creamy smooth, no chunks' },
          { key: 'apple-6', name: 'Apple', servingTip: 'Peel, core, steam until soft, then puree. Never serve raw at this age', textureTip: 'Completely smooth puree' },
          { key: 'pear-6', name: 'Pear', servingTip: 'Peel and steam until very tender, blend smooth', textureTip: 'Runny puree, very gentle on tummy' },
          { key: 'mango-6', name: 'Mango', servingTip: 'Use ripe mango, mash or blend. Naturally sweet and loved by most babies', textureTip: 'Smooth puree from very ripe fruit' },
        ]
      },
      {
        category: 'Grains & Cereals',
        icon: '🌾',
        foods: [
          { key: 'baby-rice-6', name: 'Baby Rice Cereal', servingTip: 'Mix with breast milk or formula for familiar taste', textureTip: 'Very runny at first, thicken gradually' },
          { key: 'baby-oat-6', name: 'Baby Oat Porridge', servingTip: 'Cook oats very soft, blend smooth, mix with milk', textureTip: 'Silky smooth, no whole oat pieces' },
        ]
      },
      {
        category: 'Top Allergens (Introduce Early)',
        icon: '⚠️',
        foods: [
          { key: 'peanut-6', name: 'Peanut Butter (smooth)', servingTip: 'Mix a tiny amount of smooth peanut butter into puree or porridge. NEVER give whole peanuts', allergenNote: 'TOP ALLERGEN — introduce before 12 months. Start with a tiny smear mixed into food. Watch for hives, swelling, vomiting for 2 hours after', textureTip: 'Diluted — mix ¼ tsp into porridge' },
          { key: 'egg-6', name: 'Egg (well-cooked)', servingTip: 'Hard-boil and mash yolk into puree. Must be fully cooked (no runny yolk)', allergenNote: 'TOP ALLERGEN — start with well-cooked egg yolk. Watch for reactions. Introduce white after yolk is tolerated', textureTip: 'Mashed yolk mixed into puree' },
          { key: 'dairy-6', name: 'Full-fat Yogurt (plain)', servingTip: 'Offer plain full-fat yogurt (no sugar/honey). Great source of calcium and probiotics', allergenNote: 'DAIRY ALLERGEN — start with 1 tsp. Watch for rash, vomiting, or diarrhea', textureTip: 'Smooth as-is, mix with fruit puree if needed' },
        ]
      }
    ]
  },
  {
    ageRange: '8-9',
    label: '8–9 Months — Mashed & Soft Lumps',
    description: 'Transition from smooth purees to mashed textures with soft lumps. Baby should be practicing chewing motions. Introduce soft finger foods alongside mashed meals.',
    categories: [
      {
        category: 'Proteins',
        icon: '🍗',
        foods: [
          { key: 'chicken-8', name: 'Chicken', servingTip: 'Cook thoroughly, shred very finely or mince. Mix with sauce or puree for moisture', textureTip: 'Finely shredded, moist — never dry chunks' },
          { key: 'fish-8', name: 'White Fish (cod, haddock)', servingTip: 'Steam or poach, flake carefully checking for ALL bones', textureTip: 'Soft flakes, double-check for bones', allergenNote: 'FISH ALLERGEN — introduce carefully, one type at a time' },
          { key: 'lentils-8', name: 'Red Lentils', servingTip: 'Cook until very soft and mushy. Excellent plant protein and iron source', textureTip: 'Soft mash, naturally breaks down' },
          { key: 'tofu-8', name: 'Tofu', servingTip: 'Crumble soft tofu into meals. Great protein source for plant-based families', textureTip: 'Soft crumbles, easy to gum', allergenNote: 'SOY ALLERGEN — watch for reactions' },
          { key: 'beef-8', name: 'Beef (minced)', servingTip: 'Cook lean mince thoroughly, mix with tomato sauce or gravy for moisture', textureTip: 'Very finely minced, moist' },
        ]
      },
      {
        category: 'Finger Foods',
        icon: '🤏',
        foods: [
          { key: 'toast-fingers-8', name: 'Toast Fingers', servingTip: 'Lightly toast bread, cut into strips baby can grip. Spread thin layer of butter or nut butter', textureTip: 'Soft enough to dissolve, firm enough to hold' },
          { key: 'soft-cooked-veg-8', name: 'Soft Cooked Vegetable Sticks', servingTip: 'Steam carrot, parsnip, or sweet potato sticks until very soft. Should squish easily between your fingers', textureTip: 'Must be squishable — if you can\'t squish it, baby can\'t chew it' },
          { key: 'banana-pieces-8', name: 'Banana Pieces', servingTip: 'Cut into strips or chunks. Roll in crushed cereal if too slippery to grip', textureTip: 'Soft and mashable with gums' },
          { key: 'cheese-strips-8', name: 'Cheese Strips', servingTip: 'Cut mild cheese into thin strips. Cheddar, mozzarella, or gouda work well', textureTip: 'Thin strips that dissolve with chewing' },
          { key: 'rice-cakes-8', name: 'Rice Cakes (unsalted)', servingTip: 'Break into pieces or offer whole for baby to gnaw. Dissolves quickly in mouth', textureTip: 'Dissolves with saliva' },
        ]
      },
      {
        category: 'New Allergens',
        icon: '⚠️',
        foods: [
          { key: 'wheat-8', name: 'Wheat (pasta, bread)', servingTip: 'Offer well-cooked small pasta shapes or soft bread', allergenNote: 'WHEAT/GLUTEN — watch for bloating, rash, or diarrhea', textureTip: 'Very soft, overcooked pasta' },
          { key: 'sesame-8', name: 'Sesame', servingTip: 'Mix tahini into purees or spread on toast. Never give whole seeds', allergenNote: 'SESAME ALLERGEN — introduce as tahini paste mixed into food', textureTip: 'Diluted tahini mixed in' },
          { key: 'tree-nuts-8', name: 'Tree Nut Butters', servingTip: 'Smooth almond or cashew butter mixed into porridge. NEVER whole nuts', allergenNote: 'NUT ALLERGEN — introduce one nut type at a time, wait 3 days between new types' },
        ]
      }
    ]
  },
  {
    ageRange: '10-12',
    label: '10–12 Months — Chopped & Family Foods',
    description: 'Baby can now handle chunkier textures and more complex flavors. Start transitioning to modified family meals. Offer 3 meals plus 1–2 snacks daily.',
    categories: [
      {
        category: 'Proteins',
        icon: '🥩',
        foods: [
          { key: 'salmon-10', name: 'Salmon', servingTip: 'Bake or steam, flake into small pieces. Rich in omega-3 for brain development', allergenNote: 'FISH — if not yet introduced, start small', textureTip: 'Soft flakes, check bones carefully' },
          { key: 'scrambled-egg-10', name: 'Scrambled Egg (whole)', servingTip: 'Cook fully, soft scramble with butter. Can now use whole egg if yolk was tolerated', textureTip: 'Soft, moist scramble' },
          { key: 'lamb-10', name: 'Lamb (minced)', servingTip: 'Cook lean mince, mix with vegetables and sauce for moisture', textureTip: 'Finely minced, in sauce' },
          { key: 'beans-10', name: 'Beans (kidney, black, chickpeas)', servingTip: 'Cook until very soft, lightly mash or offer whole for finger food practice', textureTip: 'Soft enough to squish with tongue' },
        ]
      },
      {
        category: 'Dairy & Alternatives',
        icon: '🧀',
        foods: [
          { key: 'cottage-cheese-10', name: 'Cottage Cheese', servingTip: 'Full-fat, plain. Excellent protein snack, mix with fruit for flavor', textureTip: 'Ready to eat as-is' },
          { key: 'cream-cheese-10', name: 'Cream Cheese', servingTip: 'Spread on toast or crackers. Choose plain, full-fat variety', textureTip: 'Smooth spread' },
          { key: 'cow-milk-cooking-10', name: 'Cow\'s Milk (in cooking only)', servingTip: 'Use whole cow\'s milk for cooking, sauces, porridge. NOT as main drink until 12 months', textureTip: 'Mixed into food only' },
        ]
      },
      {
        category: 'Complex Meals',
        icon: '🍝',
        foods: [
          { key: 'pasta-bolognese-10', name: 'Mini Pasta with Sauce', servingTip: 'Small shapes (orzo, stelline), cook soft, add meat or veggie sauce', textureTip: 'Soft pasta, chunky sauce' },
          { key: 'rice-dishes-10', name: 'Soft Rice Dishes', servingTip: 'Well-cooked rice with vegetables, mild curry, or stir-fry. Avoid sticky clumps', textureTip: 'Soft grains, easy to swallow' },
          { key: 'mini-sandwiches-10', name: 'Mini Sandwiches', servingTip: 'Thin bread with cheese, mashed avocado, or nut butter. Cut into strips', textureTip: 'Soft bread, thin layers' },
          { key: 'pancakes-10', name: 'Baby Pancakes', servingTip: 'Make with banana, egg, and oats. Serve in strips for self-feeding', textureTip: 'Soft, tear-apart texture' },
        ]
      }
    ]
  },
  {
    ageRange: '12-18',
    label: '12–18 Months — Toddler Transition',
    description: 'Your toddler can now eat most family foods, cut to appropriate sizes. Whole cow\'s milk can replace formula as the main drink. Aim for variety across food groups each day.',
    categories: [
      {
        category: 'New Foods to Introduce',
        icon: '🆕',
        foods: [
          { key: 'honey-12', name: 'Honey', servingTip: 'NOW safe to introduce (never before 12 months due to botulism risk). Use sparingly', textureTip: 'Drizzle on porridge or yogurt' },
          { key: 'whole-milk-12', name: 'Whole Cow\'s Milk (as drink)', servingTip: 'Can now be offered as main drink. 300–400ml per day max. Full-fat only', textureTip: 'In cup, not bottle' },
          { key: 'shellfish-12', name: 'Shellfish (prawns, crab)', servingTip: 'Cook thoroughly, cut small. New flavor and texture for adventurous eating', allergenNote: 'SHELLFISH ALLERGEN — introduce carefully, watch for reactions', textureTip: 'Small pieces, well-cooked' },
          { key: 'raw-veg-12', name: 'Raw Vegetables (grated)', servingTip: 'Grated carrot, cucumber sticks, tomato quarters. Avoid hard raw chunks', textureTip: 'Grated or very thin strips only' },
          { key: 'berries-12', name: 'Whole Berries', servingTip: 'Blueberries (halved or quartered), strawberries (quartered). Never serve whole round berries', textureTip: 'Always cut — round berries are a choking hazard' },
        ]
      },
      {
        category: 'Family Meal Ideas',
        icon: '👨‍👩‍👧',
        foods: [
          { key: 'stew-12', name: 'Family Stew / Casserole', servingTip: 'Cook family stew, remove baby\'s portion before adding salt. Cut meat and veg small', textureTip: 'Soft chunks in gravy' },
          { key: 'stir-fry-12', name: 'Mild Stir-Fry', servingTip: 'Finely chop vegetables and protein. Use mild soy sauce (low salt). Serve with soft rice', textureTip: 'Small, soft pieces' },
          { key: 'frittata-12', name: 'Vegetable Frittata', servingTip: 'Egg with vegetables, baked and cut into wedges. Easy finger food for toddlers', textureTip: 'Firm but soft, wedge shapes' },
          { key: 'soup-12', name: 'Chunky Soup', servingTip: 'Family soup with soft vegetable pieces. Serve with bread soldiers for dipping', textureTip: 'Soft chunks in broth' },
        ]
      }
    ]
  },
  {
    ageRange: '18-24',
    label: '18–24 Months — Independent Eating',
    description: 'Your toddler is developing strong opinions about food. This is normal! Continue offering variety without pressure. Let them use utensils (messy is okay). Aim for balanced meals across the day, not each individual meal.',
    categories: [
      {
        category: 'Skills to Develop',
        icon: '🎯',
        foods: [
          { key: 'self-feeding-18', name: 'Self-Feeding with Spoon', servingTip: 'Offer thick porridge, yogurt, or mashed potato for spoon practice. Pre-load the spoon if needed', textureTip: 'Thick enough to stay on spoon' },
          { key: 'fork-food-18', name: 'Fork Practice Foods', servingTip: 'Soft cubes of cheese, cooked potato, or banana that are easy to stab', textureTip: 'Cube shapes, soft enough to pierce' },
          { key: 'drinking-cup-18', name: 'Open Cup Drinking', servingTip: 'Practice with small amounts of water in an open cup. Mess is part of learning', textureTip: 'Small sips, half-fill the cup' },
        ]
      },
      {
        category: 'Balanced Snack Ideas',
        icon: '🥪',
        foods: [
          { key: 'fruit-yogurt-18', name: 'Fruit & Yogurt Bowl', servingTip: 'Chopped fruit with plain yogurt. Let toddler choose which fruits to add', textureTip: 'Small pieces in yogurt' },
          { key: 'veggie-hummus-18', name: 'Veggie Sticks & Hummus', servingTip: 'Cucumber, pepper, and carrot sticks with hummus for dipping', textureTip: 'Stick shapes for dipping' },
          { key: 'cheese-crackers-18', name: 'Cheese & Crackers', servingTip: 'Whole grain crackers with cheese slices. Add sliced grape (halved) or cherry tomato (quartered)', textureTip: 'Small portions, easy to hold' },
          { key: 'mini-muffins-18', name: 'Homemade Mini Muffins', servingTip: 'Banana oat muffins, veggie muffins, or cheese muffins. Great for meal prep', textureTip: 'Soft, moist, bite-sized' },
        ]
      }
    ]
  }
];

// ─── BONUS 3: Ready-Made Menus by Age ───

export interface MealPlanDay {
  day: string;
  breakfast: { name: string; prepNote?: string };
  lunch: { name: string; prepNote?: string };
  dinner: { name: string; prepNote?: string };
  snack?: { name: string; prepNote?: string };
}

export interface AgeMealPlan {
  ageRange: string;
  label: string;
  overview: string;
  textureGuide: string;
  swapTips: string[];
  days: MealPlanDay[];
}

export const readyMadeMenus: AgeMealPlan[] = [
  {
    ageRange: '6-7',
    label: '6–7 Months',
    overview: 'Focus on single-ingredient purees, 1–2 meals per day alongside breast milk/formula. Portions: 1–3 tablespoons per meal. This is about exploration, not nutrition — milk is still the primary food source.',
    textureGuide: 'Smooth, runny purees with no lumps. Consistency of thick soup.',
    swapTips: [
      'Any root vegetable can replace another (sweet potato ↔ butternut ↔ carrot)',
      'Any soft fruit can replace another (banana ↔ pear ↔ mango)',
      'Mix any puree with breast milk or formula for familiarity',
    ],
    days: [
      { day: 'Monday', breakfast: { name: 'Sweet Potato Puree', prepNote: 'Steam 1 sweet potato, blend with 2 tbsp breast milk until silky smooth' }, lunch: { name: 'Banana Mash', prepNote: 'Mash ½ ripe banana with fork, add breast milk for thinner consistency' }, dinner: { name: 'Breast milk / Formula', prepNote: 'No solid dinner needed yet — follow baby\'s hunger cues' } },
      { day: 'Tuesday', breakfast: { name: 'Baby Rice with Pear Puree', prepNote: 'Mix baby rice cereal with steamed pear puree and breast milk' }, lunch: { name: 'Avocado Mash', prepNote: 'Mash ¼ ripe avocado smooth, serve at room temperature' }, dinner: { name: 'Breast milk / Formula' } },
      { day: 'Wednesday', breakfast: { name: 'Butternut Squash Puree', prepNote: 'Roast squash until soft (40 min), blend smooth with water or milk' }, lunch: { name: 'Apple Puree', prepNote: 'Peel and steam 1 apple, blend until completely smooth' }, dinner: { name: 'Breast milk / Formula' } },
      { day: 'Thursday', breakfast: { name: 'Carrot Puree', prepNote: 'Steam carrots until very soft, blend with a little cooking water' }, lunch: { name: 'Mango Puree', prepNote: 'Blend very ripe mango — no cooking needed' }, dinner: { name: 'Breast milk / Formula' } },
      { day: 'Friday', breakfast: { name: 'Baby Oat Porridge', prepNote: 'Cook oats with breast milk, blend very smooth. Add mashed banana for sweetness' }, lunch: { name: 'Courgette Puree', prepNote: 'Peel, steam, and blend. Very mild — great for fussy starters' }, dinner: { name: 'Breast milk / Formula' } },
      { day: 'Saturday', breakfast: { name: 'Pear & Baby Rice', prepNote: 'Mix steamed pear puree with baby rice cereal' }, lunch: { name: 'Broccoli Puree', prepNote: 'Steam florets until very soft, blend well. Can mix with potato for milder taste' }, dinner: { name: 'Peanut Butter Porridge (allergen intro)', prepNote: 'Mix ¼ tsp smooth peanut butter into baby oat porridge. Watch for reactions for 2 hours' } },
      { day: 'Sunday', breakfast: { name: 'Banana & Avocado Mash', prepNote: 'Mash together ¼ banana + ¼ avocado for a creamy, nutrient-rich meal' }, lunch: { name: 'Sweet Potato & Pea Puree', prepNote: 'Steam together, blend smooth. Great iron + vitamin combo' }, dinner: { name: 'Egg Yolk Puree (allergen intro)', prepNote: 'Hard-boil egg, mash yolk into sweet potato puree. Watch for reactions' } },
    ]
  },
  {
    ageRange: '8-9',
    label: '8–9 Months',
    overview: '3 meals per day plus breast milk/formula. Introduce finger foods alongside mashed meals. Portions: 3–5 tablespoons per meal. Baby should be practicing chewing motions with gums.',
    textureGuide: 'Mashed with soft lumps, progressing to finger food strips. Should be squishable between your fingers.',
    swapTips: [
      'Any protein can replace another (chicken ↔ fish ↔ lentils ↔ tofu)',
      'Swap finger food veggies freely (carrot sticks ↔ sweet potato sticks ↔ broccoli florets)',
      'Toast fingers can be topped with any nut butter, avocado, or cream cheese',
    ],
    days: [
      { day: 'Monday', breakfast: { name: 'Scrambled Egg with Toast Fingers', prepNote: 'Soft scramble 1 egg with butter, serve with 1 slice toast cut into strips' }, lunch: { name: 'Chicken & Sweet Potato Mash', prepNote: 'Shred cooked chicken finely, mix with mashed sweet potato and a little gravy' }, dinner: { name: 'Red Lentil Dhal with Rice', prepNote: 'Cook red lentils with mild spices, serve with well-cooked soft rice' }, snack: { name: 'Banana + Yogurt', prepNote: 'Mashed banana mixed with 2 tbsp plain full-fat yogurt' } },
      { day: 'Tuesday', breakfast: { name: 'Porridge with Mashed Blueberries', prepNote: 'Cook oats with whole milk, top with lightly mashed blueberries' }, lunch: { name: 'Fish Pie Mash', prepNote: 'Flake steamed white fish into mashed potato with a little cheese' }, dinner: { name: 'Veggie Pasta (small shapes)', prepNote: 'Cook tiny pasta shapes very soft, mix with tomato and veggie sauce' }, snack: { name: 'Rice Cake + Avocado', prepNote: 'Spread mashed avocado on unsalted rice cake, break into pieces' } },
      { day: 'Wednesday', breakfast: { name: 'Banana Pancakes', prepNote: 'Blend 1 banana + 1 egg, cook mini pancakes, cut into strips' }, lunch: { name: 'Beef Mince with Carrot Mash', prepNote: 'Cook lean mince with grated carrot, mix with mashed potato' }, dinner: { name: 'Tofu & Vegetable Stir-Fry', prepNote: 'Crumble soft tofu into finely diced stir-fried veggies, serve with soft rice' }, snack: { name: 'Cheese Strips', prepNote: 'Cut mild cheddar into thin finger-length strips' } },
      { day: 'Thursday', breakfast: { name: 'Yogurt with Mango & Oats', prepNote: 'Mix yogurt with mango puree, sprinkle with fine oats' }, lunch: { name: 'Chicken & Broccoli Pasta', prepNote: 'Tiny pasta with shredded chicken and steamed broccoli in cheese sauce' }, dinner: { name: 'Lentil & Spinach Puree', prepNote: 'Cook lentils with spinach, mash with a fork, serve with toast fingers' }, snack: { name: 'Soft Pear Slices', prepNote: 'Peel ripe pear, cut into thin wedges' } },
      { day: 'Friday', breakfast: { name: 'Weetabix with Whole Milk', prepNote: 'Crush Weetabix, soak in warm whole milk until soft, add mashed banana' }, lunch: { name: 'Salmon & Sweet Potato', prepNote: 'Steam salmon, flake carefully (check bones!), mix with mashed sweet potato' }, dinner: { name: 'Bean & Cheese Quesadilla Strips', prepNote: 'Mash beans with cheese between tortilla, cook and cut into strips' }, snack: { name: 'Steamed Carrot Sticks', prepNote: 'Steam until very soft, serve as finger food' } },
      { day: 'Saturday', breakfast: { name: 'French Toast Fingers', prepNote: 'Soak bread in beaten egg + milk, cook gently, cut into strips' }, lunch: { name: 'Lamb & Butternut Squash Mash', prepNote: 'Cook lean lamb mince with roasted butternut, mash together' }, dinner: { name: 'Cheese & Tomato Pasta', prepNote: 'Small pasta shapes with homemade tomato sauce and grated cheese' }, snack: { name: 'Apple Slices (steamed)', prepNote: 'Peel, steam until soft, slice thin' } },
      { day: 'Sunday', breakfast: { name: 'Avocado & Egg Toast', prepNote: 'Mash avocado on toast, top with chopped hard-boiled egg' }, lunch: { name: 'Roast Chicken with Root Veg', prepNote: 'Soft roast chicken shreds with mashed roast veg (parsnip, carrot, potato)' }, dinner: { name: 'Pea & Mint Risotto', prepNote: 'Well-cooked risotto rice with peas and a tiny bit of fresh mint' }, snack: { name: 'Yogurt with Berries', prepNote: 'Full-fat yogurt with halved blueberries' } },
    ]
  },
  {
    ageRange: '10-12',
    label: '10–12 Months',
    overview: '3 meals + 2 snacks per day. Baby can now eat most family foods, chopped to appropriate size. Portions: 4–6 tablespoons per meal. Encourage self-feeding with spoon and fingers.',
    textureGuide: 'Chopped, diced, or finger-sized pieces. Should be soft enough to squish between your thumb and finger.',
    swapTips: [
      'Any meat protein works interchangeably — adjust cooking time and cut size',
      'Swap grains freely: rice ↔ pasta ↔ couscous ↔ quinoa',
      'Most fruits work as snacks — just adjust size and remove skins/seeds where needed',
    ],
    days: [
      { day: 'Monday', breakfast: { name: 'Cheese Omelette Strips', prepNote: 'Beat 1 egg with grated cheese, cook as flat omelette, cut into strips' }, lunch: { name: 'Mini Pasta Bolognese', prepNote: 'Small pasta with lean beef mince in tomato and veggie sauce' }, dinner: { name: 'Fish Cakes with Mashed Potato', prepNote: 'Mix flaked fish with mashed potato, shape into mini patties, pan-fry gently' }, snack: { name: 'Banana & Peanut Butter Toast', prepNote: 'Mashed banana on toast with thin layer of smooth peanut butter' } },
      { day: 'Tuesday', breakfast: { name: 'Porridge with Apple & Cinnamon', prepNote: 'Cook oats with grated apple, add pinch of cinnamon' }, lunch: { name: 'Chicken & Veggie Wrap', prepNote: 'Shredded chicken with grated carrot and avocado in soft tortilla, cut into strips' }, dinner: { name: 'Lentil Shepherd\'s Pie', prepNote: 'Red lentils in tomato sauce topped with mashed sweet potato, bake until golden' }, snack: { name: 'Cucumber & Hummus', prepNote: 'Cucumber sticks with hummus for dipping' } },
      { day: 'Wednesday', breakfast: { name: 'French Toast with Berries', prepNote: 'Egg-soaked bread, cooked golden, served with halved blueberries and strawberries' }, lunch: { name: 'Salmon Pasta', prepNote: 'Flaked salmon with broccoli in creamy cheese sauce over small pasta' }, dinner: { name: 'Bean & Sweet Potato Chili', prepNote: 'Mild chili with kidney beans and sweet potato, serve with rice' }, snack: { name: 'Cheese & Apple Slices', prepNote: 'Thin cheese slices with peeled apple wedges' } },
      { day: 'Thursday', breakfast: { name: 'Banana Oat Pancakes', prepNote: 'Blend banana, egg, oats — cook mini pancakes. Serve with yogurt' }, lunch: { name: 'Mini Meatballs with Couscous', prepNote: 'Tiny meatballs in tomato sauce, serve with fluffy couscous' }, dinner: { name: 'Veggie Frittata Wedges', prepNote: 'Egg baked with diced peppers, peas, and cheese, cut into wedges' }, snack: { name: 'Mango Pieces', prepNote: 'Ripe mango cut into small cubes' } },
      { day: 'Friday', breakfast: { name: 'Yogurt Parfait', prepNote: 'Layer yogurt with crushed cereal and mashed berries' }, lunch: { name: 'Tuna & Sweetcorn Sandwich', prepNote: 'Mash tuna with a little yogurt and sweetcorn, serve on soft bread strips' }, dinner: { name: 'Chicken Risotto', prepNote: 'Well-cooked risotto with shredded chicken, peas, and parmesan' }, snack: { name: 'Rice Cake & Cream Cheese', prepNote: 'Spread cream cheese on rice cake, top with mashed raspberry' } },
      { day: 'Saturday', breakfast: { name: 'Scrambled Egg on Toast', prepNote: 'Soft scrambled egg with butter on wholemeal toast fingers' }, lunch: { name: 'Fish Finger Sandwich', prepNote: 'Homemade fish fingers (fish coated in breadcrumbs, baked) in soft bread' }, dinner: { name: 'Spaghetti with Hidden Veggie Sauce', prepNote: 'Blend peppers, courgette, carrot into tomato sauce, serve over spaghetti' }, snack: { name: 'Grapes (quartered) & Cheese', prepNote: 'Always quarter grapes lengthwise — round grapes are a choking hazard' } },
      { day: 'Sunday', breakfast: { name: 'Blueberry Muffin (homemade)', prepNote: 'Oat, banana, and blueberry muffins. No added sugar needed — banana provides sweetness' }, lunch: { name: 'Roast Dinner (baby portion)', prepNote: 'Soft roast chicken, mashed potato, steamed veg, thin gravy. Cut everything small' }, dinner: { name: 'Cheesy Beans on Toast', prepNote: 'Warm baked beans (low salt) with grated cheese on toast' }, snack: { name: 'Pear & Yogurt', prepNote: 'Diced ripe pear with spoonful of natural yogurt' } },
    ]
  },
  {
    ageRange: '12-18',
    label: '12–18 Months',
    overview: '3 meals + 2 snacks. Toddler eats family food in smaller portions. Whole cow\'s milk now replaces formula (300–400ml/day). Expect mess, food throwing, and strong opinions — all completely normal.',
    textureGuide: 'Small chopped pieces, family food consistency. Cut round foods (grapes, cherry tomatoes) lengthwise. Avoid hard, raw chunks.',
    swapTips: [
      'Any family meal works — just remove baby\'s portion before adding salt/chili',
      'If toddler refuses a meal, don\'t make alternatives. Offer again another day',
      'Smoothies and dips are great ways to sneak in rejected vegetables',
    ],
    days: [
      { day: 'Monday', breakfast: { name: 'Weetabix with Banana & Milk', prepNote: 'Crush Weetabix, warm milk, top with sliced banana' }, lunch: { name: 'Cheese & Bean Toastie', prepNote: 'Mash baked beans with cheese between bread, toast in pan, cut into fingers' }, dinner: { name: 'Chicken Stir-Fry with Noodles', prepNote: 'Finely diced chicken and veggies in mild soy sauce with soft egg noodles' }, snack: { name: 'Apple Slices & Peanut Butter', prepNote: 'Thin apple wedges with smooth peanut butter for dipping' } },
      { day: 'Tuesday', breakfast: { name: 'Porridge with Almond Butter & Banana', prepNote: 'Stir smooth almond butter and mashed banana into warm porridge' }, lunch: { name: 'Tuna Pasta Bake', prepNote: 'Tuna, sweetcorn, and peas in cheese sauce, baked with pasta until golden' }, dinner: { name: 'Lamb Kofta with Pitta & Tzatziki', prepNote: 'Mini lamb meatballs with soft pitta bread and yogurt-cucumber dip' }, snack: { name: 'Grapes (quartered) & Cheese Cubes', prepNote: 'Always quarter grapes lengthwise' } },
      { day: 'Wednesday', breakfast: { name: 'Avocado Toast with Egg', prepNote: 'Mashed avocado on toast, topped with chopped hard-boiled egg' }, lunch: { name: 'Veggie Soup with Bread Soldiers', prepNote: 'Chunky vegetable soup (not blended), served with buttered toast strips' }, dinner: { name: 'Salmon Fish Cakes', prepNote: 'Mix flaked salmon, mashed potato, and dill. Shape, pan-fry, serve with peas' }, snack: { name: 'Blueberry Yogurt', prepNote: 'Halved blueberries stirred into natural yogurt' } },
      { day: 'Thursday', breakfast: { name: 'Mini Pancakes with Berries', prepNote: 'Banana oat pancakes with halved strawberries and blueberries' }, lunch: { name: 'Chicken & Avocado Wrap', prepNote: 'Shredded chicken, mashed avocado, and grated cheese in soft tortilla' }, dinner: { name: 'Beef Stew with Dumplings', prepNote: 'Slow-cooked beef with root veg, topped with mini flour dumplings' }, snack: { name: 'Hummus & Veggie Sticks', prepNote: 'Cucumber, pepper, and carrot sticks with hummus' } },
      { day: 'Friday', breakfast: { name: 'French Toast & Fruit Salad', prepNote: 'Egg-soaked bread, golden on both sides, with diced mixed fruit' }, lunch: { name: 'Fish Pie', prepNote: 'White fish and salmon in parsley sauce, topped with mashed potato' }, dinner: { name: 'Veggie Pizza Fingers', prepNote: 'Homemade pizza dough with tomato sauce, cheese, and diced veg, cut into strips' }, snack: { name: 'Banana Oat Bites', prepNote: 'Mash banana with oats, roll into balls, bake at 180°C for 15 min' } },
      { day: 'Saturday', breakfast: { name: 'Yogurt with Granola & Mango', prepNote: 'Full-fat yogurt with baby-friendly granola (soft, no whole nuts) and diced mango' }, lunch: { name: 'Mini Quiche Slices', prepNote: 'Egg, cheese, and spinach quiche, baked and cut into finger slices' }, dinner: { name: 'Spaghetti & Meatballs', prepNote: 'Lean beef or turkey meatballs in tomato sauce with spaghetti' }, snack: { name: 'Cream Cheese & Crackers', prepNote: 'Whole grain crackers with cream cheese and sliced cherry tomato' } },
      { day: 'Sunday', breakfast: { name: 'Scrambled Eggs & Smoked Salmon', prepNote: 'Soft scramble with small pieces of smoked salmon on toast' }, lunch: { name: 'Sunday Roast (toddler plate)', prepNote: 'Small portions of roast chicken, mashed potato, gravy, and soft roast veg' }, dinner: { name: 'Cheese & Tomato Pasta', prepNote: 'Simple penne with homemade tomato sauce and melted mozzarella' }, snack: { name: 'Fruit Smoothie', prepNote: 'Blend banana, berries, yogurt, and a splash of milk. Serve in open cup' } },
    ]
  }
];

// ─── BONUS 4: Picky Eater Strategies ───

export interface PickySection {
  id: string;
  title: string;
  icon: string;
  content: string[];
}

export const pickyEaterGuide: PickySection[] = [
  {
    id: 'tonight',
    title: '🍽️ What To Do Tonight',
    icon: '⚡',
    content: [
      '**Serve a safe food alongside the new food.** Always include at least one item you know your baby will eat. This reduces pressure and keeps the meal positive.',
      '**Put tiny portions of the new food on their plate.** Just 1–2 small pieces. Large portions are overwhelming and increase refusal.',
      '**Eat the same food yourself.** Babies learn by imitation. If they see you eating and enjoying broccoli, they\'re more likely to try it.',
      '**Don\'t comment on what they eat or don\'t eat.** No "just try one bite" or "good girl for eating your peas." Silence around food reduces pressure dramatically.',
      '**Offer the food, then look away.** Staring at a baby while they decide whether to eat creates performance anxiety — even in toddlers.',
      '**Let them touch, lick, squish, and play with food.** Sensory exploration is a critical step before eating. Squishing a blueberry is progress.',
      '**End the meal after 20–25 minutes.** If they haven\'t eaten, calmly remove the plate. No drama, no replacement meals. "All done? Okay, we\'ll eat again at snack time."',
    ]
  },
  {
    id: 'seven-day-reset',
    title: '📅 The 7-Day Food Reset',
    icon: '🔄',
    content: [
      '**Day 1–2: Observation.** Serve only safe/accepted foods. Note exactly what baby will eat, how much, and at what times. Don\'t introduce anything new. Just observe without judgment.',
      '**Day 3–4: One new food per meal.** Add ONE small piece of a new food to the plate alongside accepted foods. Don\'t mention it, don\'t draw attention to it. If they ignore it, that\'s fine.',
      '**Day 5–6: Repeat exposure.** Offer the same new food again — even if they rejected it. Research shows babies need 10–15 exposures before accepting a new food. Rejection on day 3 doesn\'t mean rejection forever.',
      '**Day 7: Family meal together.** Sit together and eat the same meal. Let baby see everyone eating the same food. Social eating is one of the most powerful tools for reducing pickiness.',
      '**Important:** During this reset, NO snacking between meals except water. Babies who graze all day are never hungry enough to try new things at meals.',
      '**After the reset:** Continue the pattern of always including one safe food + one new food at every meal. Over 4–6 weeks, accepted foods will gradually expand.',
    ]
  },
  {
    id: 're-offer',
    title: '🔁 How To Re-Offer Refused Foods',
    icon: '♻️',
    content: [
      '**Change the preparation, not the food.** If baby refused steamed broccoli, try roasted broccoli, broccoli in cheese sauce, broccoli in pasta, or raw broccoli with dip (for toddlers 12m+).',
      '**Change the temperature.** Some babies prefer room temperature foods. If warm porridge is rejected, try overnight oats served cold.',
      '**Change the shape.** Cut the same food into different shapes — strips, cubes, stars with a cookie cutter, or grated. Presentation matters more than you\'d think.',
      '**Mix it into accepted foods.** Blend rejected vegetables into tomato sauce, smoothies, pancake batter, or muffin mix. Once the taste becomes familiar, offer it in visible form again.',
      '**Wait 3–5 days before trying again.** Don\'t offer the same rejected food the next day — it creates negative associations. Space it out.',
      '**Track what works.** Keep a simple log: food, preparation method, reaction. Over time you\'ll see patterns — maybe baby likes all roasted vegetables but rejects steamed ones.',
      '**Never force, bribe, or reward.** "If you eat your peas, you can have fruit" teaches that peas are punishment and fruit is reward. This backfires long-term.',
    ]
  },
  {
    id: 'portions',
    title: '📏 Portion Strategy',
    icon: '📐',
    content: [
      '**Toddler stomachs are the size of their fist.** That\'s about 1–2 tablespoons of each food group per meal. If you\'re serving adult-sized portions, baby is overwhelmed before they start.',
      '**The "1 tablespoon per year of age" rule.** For each food on the plate, serve 1 tablespoon per year of age. A 1-year-old gets 1 tbsp of each food. They can always ask for more.',
      '**Start with less, offer more.** A plate with 3 small items is less intimidating than a plate overflowing with food. You can always refill.',
      '**Don\'t count calories or track exactly.** Toddlers self-regulate over the course of a week, not a day. A day of eating almost nothing followed by a day of eating everything is completely normal.',
      '**Milk fills them up.** If your toddler drinks more than 400ml of milk per day, they won\'t be hungry for solid food. Cut milk to mealtimes and water between meals.',
      '**Timing matters.** Leave at least 2 hours between meals/snacks. A toddler who snacked 30 minutes ago won\'t be interested in lunch.',
    ]
  },
  {
    id: 'scripts',
    title: '💬 Pressure-Free Scripts for Parents',
    icon: '🗣️',
    content: [
      '**Instead of "Eat your vegetables"** → Say nothing. Put them on the plate and eat your own.',
      '**Instead of "Just try one bite"** → "You can touch it, lick it, or leave it. It\'s up to you."',
      '**Instead of "You need to eat before you can leave the table"** → "Your tummy will tell you when you\'re done. Are you all done?"',
      '**Instead of "Good girl for eating your broccoli!"** → "You tried something new today!" (praise the bravery, not the eating)',
      '**Instead of "If you eat your dinner, you can have dessert"** → Serve a small dessert alongside the meal, no conditions. This takes the power away from sweets.',
      '**Instead of "You loved this yesterday, why won\'t you eat it?"** → "That\'s okay, we\'ll have it again another time."',
      '**Instead of "You\'re being so difficult"** → Take a breath. Remind yourself: food refusal is developmentally normal and is NOT a reflection of your parenting.',
      '**When grandparents or family pressure:** → "We\'re letting her decide how much to eat. Her doctor says she\'s growing perfectly. Thank you for caring!"',
    ]
  },
  {
    id: 'sensory',
    title: '🎨 Sensory-Friendly Serving Ideas',
    icon: '🧠',
    content: [
      '**Separate foods on the plate.** Many toddlers are "food separators" — they don\'t want foods touching. Use a divided plate or place small amounts with space between them.',
      '**Serve deconstructed meals.** Instead of a mixed salad, offer each component separately: lettuce in one pile, tomato in another, cheese cubes next to it. Let baby combine (or not).',
      '**Temperature check.** Serve food at room temperature if baby rejects warm food. Some children are temperature-sensitive.',
      '**Let them dip.** Dipping is a powerful tool. Offer yogurt, hummus, ketchup, or cream cheese as dips. Foods that are "yucky" alone become acceptable when dipped.',
      '**Crunchy alternatives.** If baby rejects soft textures, try lightly toasting bread, offering raw veggies (12m+), or adding breadcrumb coating to foods.',
      '**Smoothie bowls.** If baby refuses fruit, blend into a thick smoothie and serve in a bowl with toppings they can pick up. Same nutrition, different format.',
      '**Cookie cutters.** Cut sandwiches, pancakes, or frittata into star or heart shapes. It sounds silly, but shapes genuinely increase willingness to eat in toddlers.',
      '**Involve them in prep.** Toddlers who help wash vegetables, stir batter, or place toppings on pizza are significantly more likely to eat the final product.',
    ]
  },
  {
    id: 'red-flags',
    title: '🚩 When To Seek Professional Help',
    icon: '⚕️',
    content: [
      '**Most food pickiness is completely normal** and resolves on its own between ages 2–5. However, some signs warrant a conversation with your pediatrician or a feeding specialist:',
      '**Weight loss or failure to gain weight.** If your baby is dropping percentiles on their growth chart consistently over 2–3 months.',
      '**Eating fewer than 20 different foods total.** Some selectivity is normal, but extremely restricted diets may need intervention.',
      '**Gagging or vomiting with most textures.** Occasional gagging when learning is normal. Persistent gagging or vomiting with every meal is not.',
      '**Complete food group avoidance.** Refusing ALL fruits, ALL proteins, or ALL vegetables (not just some) may indicate sensory processing difficulties.',
      '**Extreme distress at mealtimes.** Crying, screaming, or leaving the table at every meal goes beyond normal pickiness.',
      '**Not progressing past purees by 10 months.** If baby refuses any texture beyond smooth purees after consistent exposure.',
      '**Difficulty chewing or swallowing.** Coughing frequently during meals, food falling out of mouth consistently, or inability to manage age-appropriate textures.',
      '**Who to contact:** Start with your pediatrician. They may refer you to a pediatric feeding therapist (speech-language pathologist specializing in feeding) or occupational therapist. Early intervention is very effective.',
    ]
  }
];
