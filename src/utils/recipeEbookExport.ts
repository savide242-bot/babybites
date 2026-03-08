// Premium eBook PDF with recipe images — magazine-style layout

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
  '6-9 months': '#ec4899',
  '9-12 months': '#f59e0b',
  '12-18 months': '#10b981',
  '18-24 months': '#6366f1',
  '24+ months': '#8b5cf6',
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
    `<span style="display:inline-block;padding:10px 22px;border-radius:30px;font-size:12px;font-weight:700;background:${AGE_COLORS[ag] || '#6366f1'}12;color:${AGE_COLORS[ag] || '#6366f1'};border:2px solid ${AGE_COLORS[ag] || '#6366f1'}40;margin:5px;letter-spacing:0.5px;">
      ${AGE_ICONS[ag] || '🍴'} ${ag}
    </span>`
  ).join('');

  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff5f7 0%,#ffffff 40%,#fffbeb 100%);">
      <div style="position:absolute;top:24px;left:24px;right:24px;bottom:24px;border:2px solid #ec489920;border-radius:28px;pointer-events:none;"></div>

      <div style="width:110px;height:110px;border-radius:30px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 12px 40px #ec489930;">
        <span style="font-size:54px;">👩‍🍳</span>
      </div>

      <div style="font-size:13px;font-weight:800;color:#ec4899;letter-spacing:10px;text-transform:uppercase;margin-bottom:10px;">BABYBITES</div>
      <div style="width:60px;height:1px;background:linear-gradient(to right,#ec4899,#f59e0b);margin:0 auto 40px;"></div>

      <h1 style="font-size:46px;font-weight:900;color:#0f172a;margin:0 0 6px;line-height:1.15;letter-spacing:-1px;">The Complete</h1>
      <h1 style="font-size:46px;font-weight:900;background:linear-gradient(135deg,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 16px;line-height:1.15;letter-spacing:-1px;">Recipe Book</h1>
      <p style="font-size:15px;color:#64748b;margin:0 0 6px;font-style:italic;">Nutritious recipes for every stage of growth</p>
      <p style="font-size:12px;color:#94a3b8;margin:0 0 44px;font-weight:500;">${today} Edition · Illustrated</p>

      <div style="display:flex;justify-content:center;gap:44px;margin-bottom:44px;">
        <div style="text-align:center;">
          <div style="font-size:38px;font-weight:900;color:#ec4899;line-height:1;">${recipeCount}</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Recipes</div>
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,transparent,#e2e8f0,transparent);"></div>
        <div style="text-align:center;">
          <div style="font-size:38px;font-weight:900;color:#f59e0b;line-height:1;">${ageGroups.length}</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Age Groups</div>
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,transparent,#e2e8f0,transparent);"></div>
        <div style="text-align:center;">
          <div style="font-size:38px;line-height:1;">📸</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">With Photos</div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;justify-content:center;max-width:480px;">${badges}</div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// INTRO PAGE
// ──────────────────────────────────────────────
function buildIntroPage(): string {
  return `
    <div class="content-page">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px #ec489925;">
          <span style="font-size:26px;">📖</span>
        </div>
        <div>
          <h2 style="font-size:24px;font-weight:800;color:#0f172a;margin:0;">About This Book</h2>
          <p style="font-size:10px;color:#94a3b8;margin:4px 0 0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Guide to Baby Nutrition</p>
        </div>
      </div>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b,#10b981);border-radius:2px;margin-bottom:26px;"></div>

      <p style="font-size:13px;line-height:1.9;color:#475569;margin:0 0 16px;">
        Welcome to the <strong style="color:#ec4899;">BabyBites Recipe Book</strong> — your beautifully illustrated collection of nutritious and delicious recipes. Each recipe includes a photo, carefully organized by age group.
      </p>
      <p style="font-size:13px;line-height:1.9;color:#475569;margin:0 0 22px;">
        Every recipe has been developed with age-specific nutritional needs in mind, featuring safe ingredients, detailed instructions, and complete nutritional information.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px;">
        <div style="border-left:4px solid #ec4899;background:linear-gradient(135deg,#fdf2f8,#fff5f7);border-radius:0 12px 12px 0;padding:16px 18px;">
          <div style="font-size:11px;font-weight:800;color:#ec4899;margin-bottom:5px;">🍽️ How to Use</div>
          <p style="font-size:10.5px;line-height:1.65;color:#64748b;margin:0;">Browse by age group. Each recipe includes photo, prep time, servings, ingredients, step-by-step instructions, and nutrition facts.</p>
        </div>
        <div style="border-left:4px solid #f59e0b;background:linear-gradient(135deg,#fffbeb,#fef9c3);border-radius:0 12px 12px 0;padding:16px 18px;">
          <div style="font-size:11px;font-weight:800;color:#f59e0b;margin-bottom:5px;">⚠️ Food Safety</div>
          <p style="font-size:10.5px;line-height:1.65;color:#64748b;margin:0;">Always check allergens. Introduce new foods one at a time and wait 3-5 days to observe reactions. Consult your pediatrician.</p>
        </div>
        <div style="border-left:4px solid #10b981;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:0 12px 12px 0;padding:16px 18px;">
          <div style="font-size:11px;font-weight:800;color:#10b981;margin-bottom:5px;">📸 Photo Guide</div>
          <p style="font-size:10.5px;line-height:1.65;color:#64748b;margin:0;">Each recipe features a photo showing the finished dish, so you know exactly what to expect before you start cooking.</p>
        </div>
        <div style="border-left:4px solid #6366f1;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:0 12px 12px 0;padding:16px 18px;">
          <div style="font-size:11px;font-weight:800;color:#6366f1;margin-bottom:5px;">📊 Nutrition Info</div>
          <p style="font-size:10.5px;line-height:1.65;color:#64748b;margin:0;">Complete macro and vitamin breakdown. Track calories, protein, carbs, fat, and fiber per serving for every recipe.</p>
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
    const color = AGE_COLORS[ag] || '#6366f1';
    const icon = AGE_ICONS[ag] || '🍴';
    const recipes = grouped[ag];
    const displayRecipes = recipes.slice(0, 8);
    const hasMore = recipes.length > 8;

    const items = displayRecipes.map(r => `
      <div style="display:flex;align-items:baseline;padding:2px 0;border-bottom:1px dotted #f1f5f9;">
        <span style="color:${color};font-weight:700;margin-right:5px;min-width:22px;font-size:9.5px;">${globalIndex[r.id]}.</span>
        <span style="font-size:10px;color:#475569;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.title}</span>
      </div>
    `).join('');

    const moreRow = hasMore ? `
      <div style="padding:3px 0;font-size:9px;color:#94a3b8;font-style:italic;">+ ${recipes.length - 8} more recipes</div>
    ` : '';

    return `
      <div style="margin-bottom:14px;break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:6px;padding:5px 0 4px;border-bottom:2px solid ${color}20;">
          <span style="font-size:12px;">${icon}</span>
          <span style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;">${ag}</span>
          <span style="font-size:9px;color:#94a3b8;margin-left:auto;">${recipes.length} recipes</span>
        </div>
        ${items}
        ${moreRow}
      </div>
    `;
  }).join('');

  return `
    <div class="content-page">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
        <div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px #ec489925;">
          <span style="font-size:22px;">📑</span>
        </div>
        <h2 style="font-size:24px;font-weight:800;color:#0f172a;margin:0;">Table of Contents</h2>
      </div>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:2px;margin-bottom:22px;"></div>
      <div style="column-count:2;column-gap:28px;">
        ${tocSections}
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// AGE GROUP DIVIDER
// ──────────────────────────────────────────────
function buildAgeGroupDivider(ageGroup: string, count: number): string {
  const color = AGE_COLORS[ageGroup] || '#6366f1';
  const icon = AGE_ICONS[ageGroup] || '🍴';
  const desc = AGE_DESCRIPTIONS[ageGroup] || '';

  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,${color}06 0%,white 50%,${color}04 100%);">
      <div style="width:100px;height:100px;border-radius:28px;background:linear-gradient(135deg,${color},${color}cc);display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 12px 40px ${color}35;">
        <span style="font-size:50px;">${icon}</span>
      </div>

      <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:6px;margin-bottom:10px;">Age Group</div>
      <div style="font-size:40px;font-weight:900;color:${color};margin-bottom:18px;letter-spacing:-1px;">${ageGroup}</div>

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
        <div style="width:40px;height:2px;background:${color};opacity:0.25;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color}50;"></div>
        <div style="width:40px;height:2px;background:${color};opacity:0.25;"></div>
      </div>

      <p style="font-size:14px;color:#64748b;font-style:italic;margin:0 0 12px;max-width:400px;line-height:1.7;">${desc}</p>
      <div style="font-size:16px;color:#475569;font-weight:700;">${count} recipe${count > 1 ? 's' : ''}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:5px;">in this section</div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// RECIPE PAGE (1 recipe per page)
// ──────────────────────────────────────────────
function buildRecipePage(recipe: RecipeForEbook, globalNum: number, totalRecipes: number): string {
  const color = AGE_COLORS[recipe.ageGroup] || '#6366f1';

  // Hero image with overlays
  const imageHtml = recipe.image ? `
    <div style="width:100%;height:200px;border-radius:14px;overflow:hidden;margin-bottom:14px;position:relative;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
      <img src="${recipe.image}" style="width:100%;height:100%;object-fit:cover;display:block;" crossorigin="anonymous" />
      <div style="position:absolute;bottom:0;left:0;right:0;height:70px;background:linear-gradient(to top,rgba(0,0,0,0.55),transparent);"></div>
      <div style="position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800;box-shadow:0 2px 8px ${color}60;">${globalNum}</div>
      <div style="position:absolute;bottom:10px;left:12px;display:flex;gap:5px;flex-wrap:wrap;">
        <span style="padding:3px 10px;border-radius:16px;font-size:8.5px;font-weight:700;background:rgba(255,255,255,0.95);color:${color};">${recipe.category}</span>
        <span style="padding:3px 10px;border-radius:16px;font-size:8.5px;font-weight:700;background:rgba(255,255,255,0.95);color:#475569;">⏱ ${recipe.prepTime}</span>
        <span style="padding:3px 10px;border-radius:16px;font-size:8.5px;font-weight:700;background:rgba(255,255,255,0.95);color:#475569;">🍽 ${recipe.servings}</span>
      </div>
    </div>
  ` : `
    <div style="width:100%;padding:14px 20px;border-radius:14px;background:linear-gradient(135deg,${color}10,${color}05);display:flex;align-items:center;gap:14px;margin-bottom:14px;border:1px solid ${color}15;">
      <div style="width:34px;height:34px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:800;">${globalNum}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <span style="padding:3px 10px;border-radius:14px;font-size:8.5px;font-weight:700;background:${color}12;color:${color};">${recipe.category}</span>
        <span style="font-size:8.5px;color:#64748b;">⏱ ${recipe.prepTime} · 🍽 ${recipe.servings}</span>
      </div>
    </div>
  `;

  // Title
  const headerHtml = `
    <div style="margin-bottom:10px;">
      <h3 style="font-size:16px;font-weight:800;color:#0f172a;margin:0 0 3px;line-height:1.25;">${recipe.title}</h3>
      <p style="font-size:10px;color:#64748b;font-style:italic;margin:0;line-height:1.5;">${recipe.description}</p>
    </div>
  `;

  // Ingredients — 2 columns
  const half = Math.ceil(recipe.ingredients.length / 2);
  const col1 = recipe.ingredients.slice(0, half);
  const col2 = recipe.ingredients.slice(half);
  const ingredientItem = (item: string) => `
    <div style="display:flex;align-items:baseline;gap:4px;padding:1.5px 0;font-size:9.5px;color:#475569;line-height:1.45;">
      <span style="color:${color};flex-shrink:0;font-size:7px;">●</span>
      <span>${item}</span>
    </div>
  `;

  const ingredientsHtml = `
    <div>
      <div style="font-size:9px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;border-bottom:1.5px solid ${color}20;padding-bottom:3px;">📋 Ingredients</div>
      <div style="display:flex;gap:10px;">
        <div style="flex:1;">${col1.map(ingredientItem).join('')}</div>
        ${col2.length > 0 ? `<div style="flex:1;">${col2.map(ingredientItem).join('')}</div>` : ''}
      </div>
    </div>
  `;

  // Instructions
  const stepsHtml = recipe.instructions.map((step, i) => `
    <div style="display:flex;gap:6px;margin-bottom:4px;">
      <div style="width:16px;height:16px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:800;flex-shrink:0;margin-top:1px;">${i + 1}</div>
      <p style="font-size:9.5px;line-height:1.55;color:#475569;margin:0;flex:1;">${step}</p>
    </div>
  `).join('');

  const instructionsHtml = `
    <div>
      <div style="font-size:9px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:5px;border-bottom:1.5px solid ${color}20;padding-bottom:3px;">👣 Instructions</div>
      ${stepsHtml}
    </div>
  `;

  // Nutrition grid
  const nutritionItems = [
    { label: 'Cal', value: recipe.nutrition.calories, icon: '🔥' },
    { label: 'Protein', value: recipe.nutrition.protein, icon: '💪' },
    { label: 'Carbs', value: recipe.nutrition.carbs, icon: '🌾' },
    { label: 'Fat', value: recipe.nutrition.fat, icon: '🥑' },
    { label: 'Fiber', value: recipe.nutrition.fiber, icon: '🥬' },
  ];
  const nutritionCells = nutritionItems.map(n => `
    <div style="text-align:center;flex:1;padding:5px 2px;">
      <div style="font-size:10px;">${n.icon}</div>
      <div style="font-size:9.5px;font-weight:800;color:#0f172a;margin-top:1px;">${n.value}</div>
      <div style="font-size:7.5px;color:#94a3b8;font-weight:600;">${n.label}</div>
    </div>
  `).join('');

  // Vitamins
  const vitaminsHtml = recipe.nutrition.vitamins?.length > 0
    ? recipe.nutrition.vitamins.slice(0, 6).map(v => `<span style="display:inline-block;padding:2px 7px;border-radius:8px;font-size:8px;font-weight:600;background:#ecfdf5;color:#10b981;border:1px solid #a7f3d0;margin:1px;">${v}</span>`).join('')
    : '';

  // Allergens
  const allergensHtml = recipe.allergens.length > 0
    ? recipe.allergens.map(a => `<span style="display:inline-block;padding:2px 7px;border-radius:8px;font-size:8px;font-weight:600;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;margin:1px;">${a}</span>`).join('')
    : '<span style="font-size:8px;color:#10b981;font-weight:600;">None</span>';

  // Bottom card
  const bottomHtml = `
    <div style="background:#f8fafc;border-radius:10px;padding:8px 12px;margin-top:8px;border:1px solid #f1f5f9;">
      <div style="display:flex;">${nutritionCells}</div>
      ${vitaminsHtml ? `<div style="border-top:1px solid #e2e8f0;padding-top:5px;margin-top:4px;">${vitaminsHtml}</div>` : ''}
      <div style="display:flex;gap:14px;border-top:1px solid #e2e8f0;padding-top:5px;margin-top:4px;">
        <div style="flex:1;"><span style="font-size:8px;font-weight:700;color:#ef4444;">⚠️ </span>${allergensHtml}</div>
        <div style="flex:1;"><span style="font-size:8px;font-weight:700;color:#6366f1;">🧊 </span><span style="font-size:8px;color:#64748b;">${recipe.storage}</span></div>
      </div>
    </div>
  `;

  // Footer
  const footerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:8px;border-top:1px solid #f1f5f9;">
      <span style="font-size:7.5px;color:#cbd5e1;font-weight:600;">BabyBites Recipe Book</span>
      <span style="font-size:7.5px;color:#cbd5e1;font-weight:600;">${recipe.ageGroup}</span>
      <span style="font-size:7.5px;color:#cbd5e1;font-weight:600;">Recipe ${globalNum} of ${totalRecipes}</span>
    </div>
  `;

  return `
    <div class="recipe-page">
      ${imageHtml}
      ${headerHtml}
      <div style="display:flex;gap:16px;flex:1;min-height:0;">
        <div style="flex:4;">${ingredientsHtml}</div>
        <div style="width:1px;background:linear-gradient(to bottom,${color}25,transparent);flex-shrink:0;"></div>
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
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff5f7 0%,#ffffff 50%,#fffbeb 100%);">
      <div style="width:90px;height:90px;border-radius:24px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 12px 40px #ec489930;">
        <span style="font-size:44px;">👩‍🍳</span>
      </div>

      <div style="font-size:26px;font-weight:900;background:linear-gradient(135deg,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;">BabyBites</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:36px;font-weight:500;">Recipe Book — Illustrated eBook Edition</div>

      <div style="width:60px;height:2px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:1px;margin-bottom:36px;"></div>

      <div style="max-width:420px;padding:22px 28px;background:#fdf2f8;border-radius:16px;margin-bottom:30px;border:1px solid #fce7f3;">
        <p style="font-size:11.5px;line-height:1.75;color:#64748b;margin:0 0 6px;">
          <strong style="color:#ec4899;">Disclaimer:</strong> These recipes are for educational purposes. Always check allergens and consult your pediatrician before introducing new foods.
        </p>
        <p style="font-size:11.5px;line-height:1.75;color:#64748b;margin:0;">
          Every child is unique — adapt recipes to your baby's specific needs.
        </p>
      </div>

      <p style="font-size:10px;color:#94a3b8;margin:0 0 4px;">Generated by BabyBites</p>
      <p style="font-size:10px;color:#cbd5e1;margin:0 0 24px;">${today} · All rights reserved</p>

      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;">👶</span>
        <span style="font-size:10px;color:#94a3b8;font-style:italic;">Cooked with love for little ones</span>
        <span style="font-size:18px;">💕</span>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// PRINT STYLES — precise A4 alignment
// ──────────────────────────────────────────────
const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif;
    color: #1e293b;
    background: white;
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

  /* Full-page sections (cover, dividers, back) */
  .full-page {
    position: relative;
    min-height: 100vh;
    padding: 40px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  /* Content pages (intro, TOC) */
  .content-page {
    padding: 40px 44px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  /* Recipe pages — fixed height, flex layout to prevent overflow */
  .recipe-page {
    padding: 24px 36px 16px;
    page-break-before: always;
    page-break-inside: avoid;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }

  .page-break {
    page-break-before: always;
    height: 0;
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

  printWindow.document.write(`<!DOCTYPE html><html><head><title>BabyBites — Recipe Book</title><style>${PRINT_STYLES}</style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close();

  // Wait for images to load before triggering print
  setTimeout(() => { printWindow.print(); }, 3000);
};
