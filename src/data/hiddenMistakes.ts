// The 3 Hidden Mistakes — core educational content from Emily Harter's VSL
// "3 erros de combinação alimentar que a maioria das mães comete todos os dias"

export interface HiddenMistake {
  id: "iron-calcium" | "sweet-before-meal" | "texture-window";
  badge: string;
  title: string;
  oneLiner: string;
  whyItHurts: string;
  examples: string[];
  science: string;
  fix: string[];
  source: string;
}

export const hiddenMistakes: HiddenMistake[] = [
  {
    id: "iron-calcium",
    badge: "Mistake #1",
    title: "Iron + Calcium in the Same Meal",
    oneLiner:
      "Oats with milk. Spinach with cheese. Lentils with yogurt. They look perfect — they are the opposite.",
    whyItHurts:
      "Iron and calcium use the same intestinal transporter to be absorbed. When they arrive together, they compete. One blocks the other. Your baby chews, swallows — and absorbs only a fraction of what they should.",
    examples: [
      "Oatmeal cooked in cow's milk",
      "Spinach with melted cheese",
      "Lentil stew followed by yogurt",
      "Iron-fortified cereal with formula at the same meal",
    ],
    science:
      "The WHO classifies iron deficiency as the #1 nutritional gap in babies worldwide. In most cases, the problem isn't the lack of iron-rich food — it's that iron arrives at the gut at the same time as calcium.",
    fix: [
      "Separate iron-rich and calcium-rich foods by at least 2 hours.",
      "Pair iron with vitamin C (orange, kiwi, bell pepper) — boosts absorption up to 3x.",
      "Save dairy for snacks, not for the iron-heavy main meal.",
    ],
    source: "World Health Organization · Infant Feeding Guidelines",
  },
  {
    id: "sweet-before-meal",
    badge: "Mistake #2",
    title: "Sweet Foods Before the Main Meal",
    oneLiner:
      "Fruit, sweetened yogurt, biscuits, juice or compote 'to open the appetite'. It looks logical. It is exactly the problem.",
    whyItHurts:
      "Fructose triggers GLP-1, the satiety hormone — your baby fills up before reaching the iron, protein and zinc they truly need. The vitamin C window closes before iron arrives. The sugar spike crashes 30 minutes later as irritability and refusal.",
    examples: [
      "Banana given as 'starter' before lunch",
      "Sweetened yogurt 30 min before dinner",
      "A piece of biscuit 'just to calm baby' pre-meal",
      "Natural fruit juice before the main plate",
    ],
    science:
      "Sweet foods aren't the enemy — the timing is. Given AFTER the main meal, they boost nutrient absorption and finish the meal pleasantly. Given before, they sabotage the most important meal of the day.",
    fix: [
      "Always serve protein, vegetables and grains FIRST.",
      "Fruit and sweet foods come at the END — as dessert, not as starter.",
      "Use vitamin-C fruits at the SAME meal as iron foods to amplify absorption.",
    ],
    source: "Academy of Nutrition and Dietetics · Pediatric Practice",
  },
  {
    id: "texture-window",
    badge: "Mistake #3 — The Most Silent",
    title: "The Texture Window Nobody Told You About",
    oneLiner:
      "Between 8 and 10 months, your baby's brain opens a critical neurological window to accept new textures. After it closes, every texture becomes a battle.",
    whyItHurts:
      "If this window isn't used, the nervous system learns to reject what's different. Smooth oatmeal week after week — comfortable for both of you — can be silently delaying the sensory exposure your baby needs RIGHT NOW.",
    examples: [
      "Same smooth puree consistency past 9 months",
      "Avoiding lumps because baby 'gags a little'",
      "Skipping finger foods until after the first birthday",
      "Repeating the same 5–6 foods on rotation",
    ],
    science:
      "The American Academy of Pediatrics warns that babies not exposed to varied textures in this window are 3x more likely to develop severe selective eating by age 3 — meaning years of nutritional gaps and mealtime frustration.",
    fix: [
      "From 8 months: introduce mashed foods with soft lumps.",
      "From 9 months: soft finger foods (banana strips, avocado pieces, well-cooked carrot).",
      "Expect gagging — it's the reflex that PROTECTS from choking, not a sign of danger.",
      "Offer one new texture at every meal. Don't wait for 'readiness' — create it.",
    ],
    source: "American Academy of Pediatrics · Feeding & Nutrition",
  },
];

// Foods classified for the Smart Combination Checker (Mistake #1)
export const HIGH_IRON_FOODS = [
  "iron", "spinach", "lentil", "lentils", "beans", "beef", "liver",
  "chickpea", "chickpeas", "quinoa", "oat", "oats", "oatmeal",
  "fortified cereal", "tofu", "egg yolk", "kale", "broccoli",
];

export const HIGH_CALCIUM_FOODS = [
  "milk", "cheese", "yogurt", "yoghurt", "cottage cheese", "ricotta",
  "kefir", "formula", "calcium",
];

export const VITAMIN_C_FOODS = [
  "orange", "kiwi", "strawberry", "strawberries", "bell pepper",
  "pepper", "tomato", "broccoli", "lemon", "papaya", "mango",
];

export const SWEET_FOODS = [
  "fruit", "banana", "apple", "pear", "grape", "berry", "berries",
  "yogurt", "compote", "juice", "biscuit", "cookie", "honey", "syrup",
];
