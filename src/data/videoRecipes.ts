// Video Recipes — exclusive step-by-step video recipes hosted natively on the app CDN

export interface VideoRecipe {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  ageLabel: string;
  minAgeMonths: number;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  servings: string;
  difficulty: "Easy" | "Medium";
  videoUrl: string;
  posterUrl: string;
  videoDuration: string;
  ingredients: string[];
  steps: string[];
  storage: string;
  expertTip: string;
  nutritionHighlights: string[];
  allergenNote?: string;
}

export const videoRecipes: VideoRecipe[] = [
  {
    id: "video-cheesy-carrot-fingers",
    title: "Cheesy Carrot Fingers",
    shortTitle: "Cheesy Carrot Fingers",
    description:
      "Soft, nutritious and irresistibly cheesy — these golden carrot fingers are made with only 5 ingredients and are perfect for baby-led weaning. The soft texture is gentle on little gums, and the finger shape is ideal for tiny hands learning to self-feed.",
    ageLabel: "8 months+",
    minAgeMonths: 8,
    prepTime: "10 min",
    cookTime: "18 min",
    totalTime: "28 min",
    servings: "8–10 fingers",
    difficulty: "Easy",
    videoUrl: "/__l5e/assets-v1/4226cf11-6bd4-428f-97cb-0a58a4c4aa1e/cheesy-carrot-fingers.mp4",
    posterUrl: "/__l5e/assets-v1/b169a560-642c-4c1b-9904-f4392f17bc47/cheesy-carrot-fingers-poster.jpg",
    videoDuration: "0:25",
    ingredients: [
      "2 carrots, finely grated",
      "2 eggs",
      "¼ cup shredded mozzarella (plus extra for sprinkling on top)",
      "¼ cup all-purpose flour",
      "½ tsp baking powder",
    ],
    steps: [
      "Preheat the oven to 350°F (175°C) and line a loaf pan with parchment paper.",
      "Finely grate the carrots into a mixing bowl, using the small side of the grater for the softest texture.",
      "Add the eggs and mozzarella, and mix until well combined.",
      "Add the flour and baking powder, then mix into a thick batter.",
      "Pour the batter into the lined loaf pan and spread it evenly. Sprinkle a little extra mozzarella on top.",
      "Bake for 17–18 minutes, until set and lightly golden on top.",
      "Let it cool completely, then slice into finger-sized strips about the width of an adult finger — perfect for little hands to grip.",
    ],
    storage: "Keep in an airtight container in the fridge for up to 3 days, or freeze for up to 2 months. Reheat gently or serve at room temperature.",
    expertTip:
      "Grating the carrot very finely is the secret here — it keeps the fingers soft and moist, releases natural sweetness, and makes them safe and easy for babies practicing self-feeding.",
    nutritionHighlights: ["Vitamin A for eyes & immunity", "Protein from eggs & cheese", "Calcium for growing bones"],
  },
  {
    id: "video-pb-banana-biscuits",
    title: "3-Ingredient Peanut Butter Banana Biscuits",
    shortTitle: "PB Banana Biscuits",
    description:
      "An easy, wholesome snack the whole family will love — made with only natural ingredients: ripe banana, peanut butter and flour. No added sugar, no butter, no eggs. One batch makes around 55–60 little biscuits, perfect for snack time at home or on the go.",
    ageLabel: "6 months+",
    minAgeMonths: 6,
    prepTime: "15 min",
    cookTime: "12 min",
    totalTime: "27 min",
    servings: "55–60 biscuits",
    difficulty: "Easy",
    videoUrl: "/__l5e/assets-v1/9073819e-dc01-4bdb-b811-cd66e6db5a93/pb-banana-biscuits.mp4",
    posterUrl: "/__l5e/assets-v1/aaa68ce6-eb44-4fa2-9e5a-331c440a91e8/pb-banana-biscuits-poster.jpg",
    videoDuration: "0:22",
    ingredients: [
      "1 large very ripe banana (about 140 g, peeled)",
      "2 tbsp natural peanut butter (almond or any seed butter works too)",
      "1¼ cups (180 g) self-raising flour",
    ],
    steps: [
      "Preheat the oven to 180°C (355°F) and line a baking tray with parchment paper.",
      "Peel and mash the banana in a bowl, then stir in the peanut butter until fully combined.",
      "Add the flour and mix, finishing with your hands to bring it together into a soft dough.",
      "Roll out the dough to about ½ cm thickness.",
      "Cut out the biscuits using small cookie cutters or a knife. Gather the excess dough, roll it out again, and repeat until all the dough is used — you'll get around 55–60 biscuits.",
      "Bake for 10–12 minutes, until lightly golden and cooked through.",
      "Allow to cool completely before serving.",
    ],
    storage: "Store in a container on the bench for 3 days, in the fridge for a week, or freeze for up to 2 months.",
    expertTip:
      "The riper the banana, the sweeter the biscuits — no sugar needed. For younger babies, offer a softened biscuit (dipped briefly in milk or water) until chewing skills develop.",
    nutritionHighlights: ["Natural energy from banana", "Healthy fats & protein from nut butter", "No added sugar"],
    allergenNote:
      "Suitable from 6 months once peanut has been safely introduced. If allergens haven't been exposed yet, introduce peanut butter separately first and watch for any reaction.",
  },
  {
    id: "video-carrot-lentil-puree",
    title: "Golden Carrot, Potato & Red Lentil Purée",
    shortTitle: "Carrot Lentil Purée",
    description:
      "A silky, golden purée packed with plant-based iron and protein — one of the best first meals for your baby. Sweet carrot and creamy potato balance the lentils beautifully, while a gentle pinch of cumin adds a warm flavor that introduces baby's palate to new tastes.",
    ageLabel: "6 months+",
    minAgeMonths: 6,
    prepTime: "10 min",
    cookTime: "18 min",
    totalTime: "28 min",
    servings: "4–6 baby portions",
    difficulty: "Easy",
    videoUrl: "/__l5e/assets-v1/54069870-b0c9-47a2-90ca-7160dd20ddc2/lentil-puree.mp4",
    posterUrl: "/__l5e/assets-v1/c9c06ddd-997b-441b-9d81-606a728d700c/lentil-puree-poster.jpg",
    videoDuration: "0:26",
    ingredients: [
      "2 carrots, peeled and diced",
      "1 medium potato, peeled and diced",
      "⅓ cup (60 g) red lentils, rinsed well",
      "¼ tsp ground cumin",
      "2 cups water (or low-sodium homemade vegetable stock)",
    ],
    steps: [
      "Rinse the red lentils under cold water until the water runs clear.",
      "Peel and dice the carrots and potato into small, even cubes so they cook evenly.",
      "Add the lentils, carrots and potato to a pot and pour in the water.",
      "Bring to a boil, then lower the heat and simmer for 15–18 minutes, until everything is completely soft.",
      "Stir in the ground cumin and cook for 1 more minute.",
      "Blend until silky smooth, adding a little of the cooking liquid as needed to reach the perfect texture for your baby.",
      "Let it cool to a safe temperature and serve in a baby bowl.",
    ],
    storage: "Keep in the fridge for up to 3 days, or freeze in ice cube trays for up to 3 months — defrost one cube at a time for perfect portions.",
    expertTip:
      "Red lentils are one of the richest plant sources of iron — essential from 6 months as baby's natural iron stores start to run low. The vitamin A in carrots and the gentle cumin also support digestion and immunity.",
    nutritionHighlights: ["Iron-rich for development", "Plant protein from lentils", "Smooth stage-1 texture"],
  },
  {
    id: "video-cheesy-baby-tots",
    title: "3-Ingredient Cheesy Baby Tots",
    shortTitle: "Cheesy Baby Tots",
    description:
      "Soft, melty mini veggie tots made with just potato, carrot and cheese. Their shape makes them perfect for little hands learning the pincer grasp, and they're baked — not fried — for a healthy, golden finish your baby will adore.",
    ageLabel: "6 months+",
    minAgeMonths: 6,
    prepTime: "15 min",
    cookTime: "15 min",
    totalTime: "30 min",
    servings: "12–14 tots",
    difficulty: "Easy",
    videoUrl: "/__l5e/assets-v1/3024c89e-6aa6-4cd5-82d3-9b6d82dc1f71/cheesy-baby-tots.mp4",
    posterUrl: "/__l5e/assets-v1/30fb2ccc-2764-4ece-a3d3-244feb18f572/cheesy-baby-tots-poster.jpg",
    videoDuration: "0:23",
    ingredients: [
      "1 large potato, peeled and chopped",
      "1 large carrot, grated",
      "¼ cup cheese (mild cheddar or mozzarella)",
    ],
    steps: [
      "Preheat the oven to 200°C (390°F) and line a baking tray with parchment paper.",
      "Peel and chop the potato into chunks.",
      "Steam or boil the potato together with the grated carrot until completely soft.",
      "Drain very well — this is key for tots that hold their shape — then mash everything together.",
      "Stir in the cheese until evenly combined.",
      "Shape the mixture into small balls or tots, easy for little hands to grip.",
      "Bake for about 15 minutes, until lightly golden. Cool before serving.",
    ],
    storage: "Refrigerate in an airtight container for up to 3 days, or freeze for up to 2 months. Reheat in the oven to bring back the golden finish.",
    expertTip:
      "Draining the mash thoroughly is the secret to tots that don't fall apart. Their soft, melty texture makes them an ideal early finger food for babies starting to self-feed.",
    nutritionHighlights: ["Energy from potato", "Vitamin A from carrot", "Calcium & protein from cheese"],
  },
];

export const getVideoRecipeById = (id: string): VideoRecipe | undefined =>
  videoRecipes.find((r) => r.id === id);
