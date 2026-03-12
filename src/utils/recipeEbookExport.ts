// Premium eBook PDF — Elegant Serif Edition

interface RecipeForEbook {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  prepTime: string;
  servings: string;
  image?: string;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
    vitamins: string[];
  };
  allergens: string[];
  storage: string;
}

const AGE_GROUP_ORDER = ['6-9 months', '9-12 months', '12-18 months', '18-24 months', '24+ months'];

const AGE_COLORS: Record<string, string> = {
  '6-9 months': '#c2185b',
  '9-12 months': '#e65100',
  '12-18 months': '#2e7d32',
  '18-24 months': '#4527a0',
  '24+ months': '#6a1b9a',
};

const AGE_ICONS: Record<string, string> = {
  '6-9 months': '🍼',
  '9-12 months': '🥣',
  '12-18 months': '🥄',
  '18-24 months': '🍽️',
  '24+ months': '👶',
};

const AGE_DESCRIPTIONS: Record<string, string> = {
  '6-9 months': 'First purees and smooth textures — introducing your baby to the world of flavors',
  '9-12 months': 'Thicker textures and finger foods — building confidence with new tastes',
  '12-18 months': 'Varied meals with bolder flavors and exciting combinations',
  '18-24 months': 'Complete dishes for adventurous little eaters',
  '24+ months': 'Creative recipes for growing toddlers',
};

// ──────────────────────────────────────────────
// COVER PAGE
// ──────────────────────────────────────────────
function buildCoverPage(recipeCount: number, ageGroups: string[], today: string): string {
  const badges = ageGroups.map(ag =>
    `<span style="display:inline-block;padding:8px 20px;border-radius:24px;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:${AGE_COLORS[ag] || '#4527a0'};border:1.5px solid ${AGE_COLORS[ag] || '#4527a0'}30;margin:4px;letter-spacing:0.3px;">
      ${AGE_ICONS[ag] || '🍴'} ${ag}
    </span>`
  ).join('');

  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fffdf9;">
      <div style="position:absolute;top:32px;left:32px;right:32px;bottom:32px;border:1.5px solid #d4a574;border-radius:4px;pointer-events:none;"></div>
      <div style="position:absolute;top:38px;left:38px;right:38px;bottom:38px;border:0.5px solid #d4a57440;pointer-events:none;"></div>

      <div style="font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:#d4a574;letter-spacing:8px;text-transform:uppercase;margin-bottom:32px;">BabyBites</div>

      <div style="width:50px;height:1px;background:#d4a574;margin:0 auto 40px;"></div>

      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:52px;font-weight:700;color:#2c1810;margin:0 0 8px;line-height:1.15;letter-spacing:-0.5px;">The Complete</h1>
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:52px;font-weight:700;font-style:italic;color:#c2185b;margin:0 0 20px;line-height:1.15;">Recipe Book</h1>
      
      <p style="font-family:'Inter',sans-serif;font-size:14px;color:#8b7355;margin:0 0 6px;font-weight:400;">Nutritious recipes for every stage of growth</p>
      <p style="font-family:'Inter',sans-serif;font-size:11px;color:#b8a990;margin:0 0 48px;font-weight:400;">${today} · Illustrated Edition</p>

      <div style="display:flex;justify-content:center;gap:56px;margin-bottom:48px;">
        <div style="text-align:center;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#c2185b;line-height:1;">${recipeCount}</div>
          <div style="font-family:'Inter',sans-serif;font-size:9px;color:#b8a990;text-transform:uppercase;letter-spacing:3px;margin-top:8px;font-weight:500;">Recipes</div>
        </div>
        <div style="width:1px;background:#d4a57430;"></div>
        <div style="text-align:center;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:700;color:#e65100;line-height:1;">${ageGroups.length}</div>
          <div style="font-family:'Inter',sans-serif;font-size:9px;color:#b8a990;text-transform:uppercase;letter-spacing:3px;margin-top:8px;font-weight:500;">Age Groups</div>
        </div>
        <div style="width:1px;background:#d4a57430;"></div>
        <div style="text-align:center;">
          <div style="font-size:42px;line-height:1;">📸</div>
          <div style="font-family:'Inter',sans-serif;font-size:9px;color:#b8a990;text-transform:uppercase;letter-spacing:3px;margin-top:8px;font-weight:500;">With Photos</div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;justify-content:center;max-width:500px;">${badges}</div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// INTRO PAGE
// ──────────────────────────────────────────────
function buildIntroPage(): string {
  return `
    <div class="content-page">
      <div style="text-align:center;margin-bottom:32px;">
        <div style="font-family:'Inter',sans-serif;font-size:10px;color:#b8a990;text-transform:uppercase;letter-spacing:4px;margin-bottom:12px;">Introduction</div>
        <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#2c1810;margin:0 0 16px;">About This Book</h2>
        <div style="width:40px;height:1px;background:#d4a574;margin:0 auto;"></div>
      </div>

      <p style="font-family:'Inter',sans-serif;font-size:13px;line-height:2;color:#5a4a3a;margin:0 0 18px;text-align:justify;">
        Welcome to the <strong style="color:#c2185b;">BabyBites Recipe Book</strong> — your beautifully illustrated collection of nutritious and delicious recipes. Each recipe includes a photo, carefully organized by age group.
      </p>
      <p style="font-family:'Inter',sans-serif;font-size:13px;line-height:2;color:#5a4a3a;margin:0 0 28px;text-align:justify;">
        Every recipe has been developed with age-specific nutritional needs in mind, featuring safe ingredients, detailed instructions, and complete nutritional information.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0 0 24px;">
        <div style="border-left:3px solid #c2185b;padding:18px 20px;background:#fdf2f4;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:#c2185b;margin-bottom:8px;">How to Use</div>
          <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.7;color:#5a4a3a;margin:0;">Browse by age group. Each recipe includes photo, prep time, servings, ingredients, step-by-step instructions, and nutrition facts.</p>
        </div>
        <div style="border-left:3px solid #e65100;padding:18px 20px;background:#fff8f0;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:#e65100;margin-bottom:8px;">Food Safety</div>
          <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.7;color:#5a4a3a;margin:0;">Always check allergens. Introduce new foods one at a time and wait 3–5 days. Consult your pediatrician.</p>
        </div>
        <div style="border-left:3px solid #2e7d32;padding:18px 20px;background:#f0f9f1;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:#2e7d32;margin-bottom:8px;">Photo Guide</div>
          <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.7;color:#5a4a3a;margin:0;">Each recipe features a photo showing the finished dish, so you know exactly what to expect before you start cooking.</p>
        </div>
        <div style="border-left:3px solid #4527a0;padding:18px 20px;background:#f3f0ff;">
          <div style="font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:#4527a0;margin-bottom:8px;">Nutrition Info</div>
          <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.7;color:#5a4a3a;margin:0;">Complete macro and vitamin breakdown. Track calories, protein, carbs, fat, and fiber per serving.</p>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// TABLE OF CONTENTS
// ──────────────────────────────────────────────
function buildTOCPage(grouped: Record<string, RecipeForEbook[]>, globalIndex: Record<string, number>): string {
  const ageGroups = Object.keys(grouped);

  const tocSections = ageGroups.map(ag => {
    const color = AGE_COLORS[ag] || '#4527a0';
    const icon = AGE_ICONS[ag] || '🍴';
    const recipes = grouped[ag];
    const displayRecipes = recipes.slice(0, 8);
    const hasMore = recipes.length > 8;

    const items = displayRecipes.map(r => `
      <div style="display:flex;align-items:baseline;padding:3px 0;border-bottom:1px dotted #e8ddd0;">
        <span style="font-family:'Inter',sans-serif;color:${color};font-weight:600;margin-right:6px;min-width:24px;font-size:10px;">${globalIndex[r.id]}.</span>
        <span style="font-family:'Inter',sans-serif;font-size:10.5px;color:#5a4a3a;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.title}</span>
      </div>
    `).join('');

    const moreRow = hasMore ? `
      <div style="padding:4px 0;font-family:'Inter',sans-serif;font-size:10px;color:#b8a990;font-style:italic;">+ ${recipes.length - 8} more recipes</div>
    ` : '';

    return `
      <div style="margin-bottom:16px;break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0 5px;border-bottom:2px solid ${color}25;">
          <span style="font-size:13px;">${icon}</span>
          <span style="font-family:'Playfair Display',Georgia,serif;font-size:12px;font-weight:700;color:${color};">${ag}</span>
          <span style="font-family:'Inter',sans-serif;font-size:9px;color:#b8a990;margin-left:auto;">${recipes.length} recipes</span>
        </div>
        ${items}
        ${moreRow}
      </div>
    `;
  }).join('');

  return `
    <div class="content-page">
      <div style="text-align:center;margin-bottom:28px;">
        <div style="font-family:'Inter',sans-serif;font-size:10px;color:#b8a990;text-transform:uppercase;letter-spacing:4px;margin-bottom:12px;">Contents</div>
        <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#2c1810;margin:0 0 16px;">Table of Contents</h2>
        <div style="width:40px;height:1px;background:#d4a574;margin:0 auto;"></div>
      </div>
      <div style="column-count:2;column-gap:32px;">
        ${tocSections}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// AGE GROUP DIVIDER
// ──────────────────────────────────────────────
function buildAgeGroupDivider(ageGroup: string, count: number): string {
  const color = AGE_COLORS[ageGroup] || '#4527a0';
  const icon = AGE_ICONS[ageGroup] || '🍴';
  const desc = AGE_DESCRIPTIONS[ageGroup] || '';

  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fffdf9;">
      <div style="position:absolute;top:32px;left:32px;right:32px;bottom:32px;border:1px solid ${color}20;pointer-events:none;"></div>

      <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:500;color:#b8a990;text-transform:uppercase;letter-spacing:6px;margin-bottom:24px;">Age Group</div>
      
      <div style="font-size:56px;margin-bottom:24px;">${icon}</div>

      <div style="font-family:'Playfair Display',Georgia,serif;font-size:44px;font-weight:700;color:${color};margin-bottom:20px;letter-spacing:-0.5px;">${ageGroup}</div>

      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
        <div style="width:40px;height:1px;background:${color}40;"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:${color};"></div>
        <div style="width:40px;height:1px;background:${color}40;"></div>
      </div>

      <p style="font-family:'Playfair Display',Georgia,serif;font-size:16px;color:#8b7355;font-style:italic;margin:0 0 16px;max-width:420px;line-height:1.8;">${desc}</p>
      <div style="font-family:'Inter',sans-serif;font-size:14px;color:#5a4a3a;font-weight:600;">${count} recipe${count > 1 ? 's' : ''}</div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// RECIPE PAGE (1 recipe per page)
// ──────────────────────────────────────────────
function buildRecipePage(recipe: RecipeForEbook, globalNum: number, totalRecipes: number): string {
  const color = AGE_COLORS[recipe.ageGroup] || '#4527a0';

  // Hero image
  const imageHtml = recipe.image ? `
    <div style="width:100%;height:240px;border-radius:4px;overflow:hidden;margin-bottom:16px;position:relative;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <img src="${recipe.image}" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous" />
      <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(to top,rgba(0,0,0,0.5),transparent);"></div>
      <div style="position:absolute;top:12px;right:12px;font-family:'Inter',sans-serif;padding:4px 12px;border-radius:4px;background:${color};color:white;font-size:11px;font-weight:700;">#${globalNum}</div>
      <div style="position:absolute;bottom:12px;left:14px;display:flex;gap:6px;flex-wrap:wrap;">
        <span style="font-family:'Inter',sans-serif;padding:4px 12px;border-radius:4px;font-size:9px;font-weight:600;background:rgba(255,255,255,0.95);color:${color};">${recipe.category}</span>
        <span style="font-family:'Inter',sans-serif;padding:4px 12px;border-radius:4px;font-size:9px;font-weight:600;background:rgba(255,255,255,0.95);color:#5a4a3a;">⏱ ${recipe.prepTime}</span>
        <span style="font-family:'Inter',sans-serif;padding:4px 12px;border-radius:4px;font-size:9px;font-weight:600;background:rgba(255,255,255,0.95);color:#5a4a3a;">🍽 ${recipe.servings}</span>
      </div>
    </div>
  ` : `
    <div style="width:100%;padding:16px 22px;border-radius:4px;background:${color}08;display:flex;align-items:center;gap:14px;margin-bottom:16px;border:1px solid ${color}15;">
      <div style="font-family:'Inter',sans-serif;width:36px;height:36px;border-radius:4px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">${globalNum}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span style="font-family:'Inter',sans-serif;padding:3px 10px;border-radius:4px;font-size:9px;font-weight:600;background:${color}12;color:${color};">${recipe.category}</span>
        <span style="font-family:'Inter',sans-serif;font-size:9px;color:#8b7355;">⏱ ${recipe.prepTime} · 🍽 ${recipe.servings}</span>
      </div>
    </div>
  `;

  // Title
  const headerHtml = `
    <div style="margin-bottom:14px;">
      <h3 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#2c1810;margin:0 0 4px;line-height:1.25;">${recipe.title}</h3>
      <p style="font-family:'Inter',sans-serif;font-size:11px;color:#8b7355;font-style:italic;margin:0;line-height:1.6;">${recipe.description}</p>
    </div>
  `;

  // Ingredients
  const ingredientItem = (item: string) => `
    <div style="display:flex;align-items:baseline;gap:6px;padding:2.5px 0;font-family:'Inter',sans-serif;font-size:11px;color:#5a4a3a;line-height:1.5;">
      <span style="color:${color};flex-shrink:0;font-size:6px;">●</span>
      <span>${item}</span>
    </div>
  `;

  const ingredientsHtml = `
    <div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:${color};margin-bottom:8px;border-bottom:1px solid ${color}20;padding-bottom:5px;">Ingredients</div>
      ${recipe.ingredients.map(ingredientItem).join('')}
    </div>
  `;

  // Instructions
  const stepsHtml = recipe.instructions.map((step, i) => `
    <div style="display:flex;gap:8px;margin-bottom:6px;">
      <div style="font-family:'Playfair Display',Georgia,serif;width:20px;height:20px;border-radius:50%;border:1.5px solid ${color};display:flex;align-items:center;justify-content:center;color:${color};font-size:10px;font-weight:700;flex-shrink:0;margin-top:1px;">${i + 1}</div>
      <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.6;color:#5a4a3a;margin:0;flex:1;">${step}</p>
    </div>
  `).join('');

  const instructionsHtml = `
    <div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;color:${color};margin-bottom:8px;border-bottom:1px solid ${color}20;padding-bottom:5px;">Instructions</div>
      ${stepsHtml}
    </div>
  `;

  // Nutrition
  const nutritionItems = [
    { label: 'Calories', value: recipe.nutrition.calories, icon: '🔥' },
    { label: 'Protein', value: recipe.nutrition.protein, icon: '💪' },
    { label: 'Carbs', value: recipe.nutrition.carbs, icon: '🌾' },
    { label: 'Fat', value: recipe.nutrition.fat, icon: '🥑' },
    { label: 'Fiber', value: recipe.nutrition.fiber, icon: '🥬' },
  ];
  const nutritionCells = nutritionItems.map(n => `
    <div style="text-align:center;flex:1;padding:6px 3px;">
      <div style="font-size:11px;">${n.icon}</div>
      <div style="font-family:'Playfair Display',Georgia,serif;font-size:11px;font-weight:700;color:#2c1810;margin-top:2px;">${n.value}</div>
      <div style="font-family:'Inter',sans-serif;font-size:8px;color:#b8a990;font-weight:500;margin-top:1px;">${n.label}</div>
    </div>
  `).join('');

  // Vitamins
  const vitaminsHtml = recipe.nutrition.vitamins?.length > 0
    ? recipe.nutrition.vitamins.slice(0, 6).map(v => `<span style="display:inline-block;font-family:'Inter',sans-serif;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:500;background:#f0f9f1;color:#2e7d32;border:1px solid #c8e6c9;margin:1px;">${v}</span>`).join('')
    : '';

  // Allergens
  const allergensHtml = recipe.allergens.length > 0
    ? recipe.allergens.map(a => `<span style="display:inline-block;font-family:'Inter',sans-serif;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:500;background:#fdf2f4;color:#c2185b;border:1px solid #f8bbd0;margin:1px;">${a}</span>`).join('')
    : '<span style="font-family:\'Inter\',sans-serif;font-size:9px;color:#2e7d32;font-weight:500;">None</span>';

  // Bottom card
  const bottomHtml = `
    <div style="background:#faf8f5;border-radius:4px;padding:10px 14px;margin-top:10px;border:1px solid #e8ddd0;">
      <div style="display:flex;">${nutritionCells}</div>
      ${vitaminsHtml ? `<div style="border-top:1px solid #e8ddd0;padding-top:6px;margin-top:5px;">${vitaminsHtml}</div>` : ''}
      <div style="display:flex;gap:16px;border-top:1px solid #e8ddd0;padding-top:6px;margin-top:5px;">
        <div style="flex:1;"><span style="font-family:'Inter',sans-serif;font-size:9px;font-weight:600;color:#c2185b;">Allergens: </span>${allergensHtml}</div>
        <div style="flex:1;"><span style="font-family:'Inter',sans-serif;font-size:9px;font-weight:600;color:#4527a0;">Storage: </span><span style="font-family:'Inter',sans-serif;font-size:9px;color:#8b7355;">${recipe.storage}</span></div>
      </div>
    </div>
  `;

  // Footer
  const footerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:10px;border-top:1px solid #e8ddd0;">
      <span style="font-family:'Inter',sans-serif;font-size:8px;color:#b8a990;font-weight:500;">BabyBites Recipe Book</span>
      <span style="font-family:'Playfair Display',Georgia,serif;font-size:8px;color:#b8a990;font-style:italic;">${recipe.ageGroup}</span>
      <span style="font-family:'Inter',sans-serif;font-size:8px;color:#b8a990;font-weight:500;">Recipe ${globalNum} of ${totalRecipes}</span>
    </div>
  `;

  return `
    <div class="recipe-page">
      ${imageHtml}
      ${headerHtml}
      <div style="display:flex;gap:20px;flex:1;min-height:0;">
        <div style="flex:4;">${ingredientsHtml}</div>
        <div style="width:1px;background:${color}15;flex-shrink:0;"></div>
        <div style="flex:5;">${instructionsHtml}</div>
      </div>
      ${bottomHtml}
      ${footerHtml}
    </div>
  `;
}

// ──────────────────────────────────────────────
// BACK COVER
// ──────────────────────────────────────────────
function buildBackCover(today: string): string {
  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fffdf9;">
      <div style="position:absolute;top:32px;left:32px;right:32px;bottom:32px;border:1px solid #d4a57430;pointer-events:none;"></div>

      <div style="font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;font-style:italic;color:#c2185b;margin-bottom:8px;">BabyBites</div>
      <div style="font-family:'Inter',sans-serif;font-size:12px;color:#8b7355;margin-bottom:40px;font-weight:400;">Recipe Book — Illustrated Edition</div>

      <div style="width:40px;height:1px;background:#d4a574;margin:0 auto 40px;"></div>

      <div style="max-width:400px;padding:24px 28px;border:1px solid #e8ddd0;border-radius:4px;margin-bottom:36px;">
        <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.8;color:#8b7355;margin:0 0 8px;">
          <strong style="color:#c2185b;">Disclaimer:</strong> These recipes are for educational purposes. Always check allergens and consult your pediatrician before introducing new foods.
        </p>
        <p style="font-family:'Inter',sans-serif;font-size:11px;line-height:1.8;color:#8b7355;margin:0;">
          Every child is unique — adapt recipes to your baby's specific needs.
        </p>
      </div>

      <p style="font-family:'Inter',sans-serif;font-size:10px;color:#b8a990;margin:0 0 4px;">Generated by BabyBites</p>
      <p style="font-family:'Inter',sans-serif;font-size:10px;color:#d4c5b0;margin:0 0 28px;">${today} · All rights reserved</p>

      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">👶</span>
        <span style="font-family:'Playfair Display',Georgia,serif;font-size:11px;color:#b8a990;font-style:italic;">Cooked with love for little ones</span>
        <span style="font-size:16px;">💕</span>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// PRINT STYLES
// ──────────────────────────────────────────────
const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #2c1810;
    background: #fffdf9;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  img {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A4;
    margin: 10mm 12mm;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    img { max-width: 100% !important; }
    .full-page, .recipe-page, .content-page {
      page-break-after: always;
    }
  }

  .full-page {
    position: relative;
    min-height: 100vh;
    padding: 48px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  .content-page {
    padding: 48px 52px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  .recipe-page {
    padding: 28px 40px 18px;
    page-break-before: always;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }
`;

// ──────────────────────────────────────────────
// EXPORT FUNCTION
// ──────────────────────────────────────────────
export const exportRecipeEbook = (allRecipes: RecipeForEbook[]) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const grouped: Record<string, RecipeForEbook[]> = {};
  for (const ag of AGE_GROUP_ORDER) {
    const agRecipes = allRecipes.filter(r => r.ageGroup === ag);
    if (agRecipes.length > 0) grouped[ag] = agRecipes;
  }

  const ageGroupsUsed = Object.keys(grouped);

  const globalIndex: Record<string, number> = {};
  let counter = 1;
  for (const ag of ageGroupsUsed) {
    for (const r of grouped[ag]) {
      globalIndex[r.id] = counter++;
    }
  }

  const totalRecipes = allRecipes.length;

  const sections: string[] = [
    buildCoverPage(totalRecipes, ageGroupsUsed, today),
    buildIntroPage(),
    buildTOCPage(grouped, globalIndex),
  ];

  for (const ag of ageGroupsUsed) {
    sections.push(buildAgeGroupDivider(ag, grouped[ag].length));
    for (const r of grouped[ag]) {
      sections.push(buildRecipePage(r, globalIndex[r.id], totalRecipes));
    }
  }

  sections.push(buildBackCover(today));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html><html><head><title>BabyBites — Recipe Book</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><style>${PRINT_STYLES}</style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close();

  setTimeout(() => { printWindow.print(); }, 3000);
};
