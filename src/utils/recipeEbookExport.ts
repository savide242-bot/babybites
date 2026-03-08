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

function buildCoverPage(recipeCount: number, ageGroups: string[], today: string): string {
  const badges = ageGroups.map(ag =>
    `<span style="display:inline-block;padding:10px 22px;border-radius:30px;font-size:12px;font-weight:700;background:${AGE_COLORS[ag] || '#6366f1'}12;color:${AGE_COLORS[ag] || '#6366f1'};border:2px solid ${AGE_COLORS[ag] || '#6366f1'}40;margin:5px;letter-spacing:0.5px;">
      ${AGE_ICONS[ag] || '🍴'} ${ag}
    </span>`
  ).join('');

  return `
    <div style="text-align:center;padding:0;position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff5f7 0%,#ffffff 40%,#fffbeb 100%);">
      <div style="position:absolute;top:24px;left:24px;right:24px;bottom:24px;border:2px solid #ec489920;border-radius:28px;"></div>
      <div style="position:absolute;top:32px;left:32px;right:32px;bottom:32px;border:1px solid #f59e0b15;border-radius:22px;"></div>

      <div style="width:110px;height:110px;border-radius:30px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 12px 40px #ec489930;">
        <span style="font-size:54px;">👩‍🍳</span>
      </div>

      <div style="font-size:13px;font-weight:800;color:#ec4899;letter-spacing:10px;text-transform:uppercase;margin-bottom:10px;">BABYBITES</div>
      <div style="width:60px;height:1px;background:linear-gradient(to right,#ec4899,#f59e0b);margin:0 auto 40px;"></div>

      <h1 style="font-size:48px;font-weight:900;color:#0f172a;margin:0 0 6px;line-height:1.15;letter-spacing:-1px;">The Complete</h1>
      <h1 style="font-size:48px;font-weight:900;background:linear-gradient(135deg,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 16px;line-height:1.15;letter-spacing:-1px;">Recipe Book</h1>
      <p style="font-size:16px;color:#64748b;margin:0 0 6px;font-style:italic;font-weight:400;">Nutritious recipes for every stage of growth</p>
      <p style="font-size:13px;color:#94a3b8;margin:0 0 50px;font-weight:500;">${today} Edition • With Photos</p>

      <div style="display:flex;justify-content:center;gap:50px;margin-bottom:50px;">
        <div style="text-align:center;">
          <div style="font-size:40px;font-weight:900;color:#ec4899;line-height:1;">${recipeCount}</div>
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Recipes</div>
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,transparent,#e2e8f0,transparent);"></div>
        <div style="text-align:center;">
          <div style="font-size:40px;font-weight:900;color:#f59e0b;line-height:1;">${ageGroups.length}</div>
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Age Groups</div>
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,transparent,#e2e8f0,transparent);"></div>
        <div style="text-align:center;">
          <div style="font-size:40px;line-height:1;">📸</div>
          <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Illustrated</div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;justify-content:center;max-width:500px;">${badges}</div>
    </div>
  `;
}

function buildIntroPage(): string {
  return `
    <div style="padding:60px 55px;background:white;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
        <div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px #ec489925;">
          <span style="font-size:26px;">📖</span>
        </div>
        <div>
          <h2 style="font-size:26px;font-weight:800;color:#0f172a;margin:0;">About This Book</h2>
          <p style="font-size:11px;color:#94a3b8;margin:4px 0 0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Guide to Baby Nutrition</p>
        </div>
      </div>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b,#10b981);border-radius:2px;margin-bottom:30px;"></div>

      <p style="font-size:13.5px;line-height:2;color:#475569;margin:0 0 18px;">
        Welcome to the <strong style="color:#ec4899;">BabyBites Recipe Book</strong> — your beautifully illustrated collection of nutritious and delicious recipes. Each recipe includes a stunning photo, carefully organized by age group to support every stage of your baby's growth.
      </p>

      <p style="font-size:13.5px;line-height:2;color:#475569;margin:0 0 24px;">
        Every recipe has been developed with age-specific nutritional needs in mind, featuring safe ingredients, detailed instructions, and complete nutritional information.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:24px 0;">
        <div style="border-left:4px solid #ec4899;background:linear-gradient(135deg,#fdf2f8,#fff5f7);border-radius:0 14px 14px 0;padding:18px 20px;">
          <div style="font-size:12px;font-weight:800;color:#ec4899;margin-bottom:6px;">🍽️ How to Use</div>
          <p style="font-size:11.5px;line-height:1.7;color:#64748b;margin:0;">Browse by age group. Each recipe includes photo, prep time, servings, ingredients, step-by-step instructions, and full nutrition facts.</p>
        </div>
        <div style="border-left:4px solid #f59e0b;background:linear-gradient(135deg,#fffbeb,#fef9c3);border-radius:0 14px 14px 0;padding:18px 20px;">
          <div style="font-size:12px;font-weight:800;color:#f59e0b;margin-bottom:6px;">⚠️ Food Safety</div>
          <p style="font-size:11.5px;line-height:1.7;color:#64748b;margin:0;">Always check allergens. Introduce new foods one at a time and wait 3-5 days to observe reactions. Consult your pediatrician.</p>
        </div>
        <div style="border-left:4px solid #10b981;background:linear-gradient(135deg,#ecfdf5,#d1fae5);border-radius:0 14px 14px 0;padding:18px 20px;">
          <div style="font-size:12px;font-weight:800;color:#10b981;margin-bottom:6px;">📸 Photo Guide</div>
          <p style="font-size:11.5px;line-height:1.7;color:#64748b;margin:0;">Each recipe features a photo showing the finished dish, so you know exactly what to expect before you start cooking.</p>
        </div>
        <div style="border-left:4px solid #6366f1;background:linear-gradient(135deg,#eef2ff,#e0e7ff);border-radius:0 14px 14px 0;padding:18px 20px;">
          <div style="font-size:12px;font-weight:800;color:#6366f1;margin-bottom:6px;">📊 Nutrition Info</div>
          <p style="font-size:11.5px;line-height:1.7;color:#64748b;margin:0;">Complete macro and vitamin breakdown for every recipe. Track calories, protein, carbs, fat, and fiber per serving.</p>
        </div>
      </div>
    </div>
  `;
}

function buildTOCPage(grouped: Record<string, RecipeForEbook[]>, globalIndex: Record<string, number>): string {
  const ageGroups = Object.keys(grouped);

  const tocSections = ageGroups.map(ag => {
    const color = AGE_COLORS[ag] || '#6366f1';
    const icon = AGE_ICONS[ag] || '🍴';
    const recipes = grouped[ag];
    const displayRecipes = recipes.slice(0, 10);
    const hasMore = recipes.length > 10;

    const items = displayRecipes.map(r => `
      <div style="display:flex;align-items:baseline;padding:2.5px 0;border-bottom:1px dotted #f1f5f9;">
        <span style="color:${color};font-weight:700;margin-right:6px;min-width:24px;font-size:10px;">${globalIndex[r.id]}.</span>
        <span style="font-size:10.5px;color:#475569;flex:1;">${r.title}</span>
      </div>
    `).join('');

    const moreRow = hasMore ? `
      <div style="padding:4px 0;font-size:10px;color:#94a3b8;font-style:italic;">... and ${recipes.length - 10} more recipes</div>
    ` : '';

    return `
      <div style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0 5px;">
          <span style="font-size:13px;">${icon}</span>
          <span style="font-size:12px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;">${ag}</span>
          <span style="font-size:10px;color:#94a3b8;margin-left:4px;">(${recipes.length})</span>
        </div>
        ${items}
        ${moreRow}
      </div>
    `;
  }).join('');

  return `
    <div style="padding:50px 55px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px #ec489925;">
          <span style="font-size:24px;">📑</span>
        </div>
        <h2 style="font-size:26px;font-weight:800;color:#0f172a;margin:0;">Table of Contents</h2>
      </div>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:2px;margin-bottom:28px;"></div>
      <div style="column-count:2;column-gap:30px;">
        ${tocSections}
      </div>
    </div>
  `;
}

function buildAgeGroupDivider(ageGroup: string, count: number): string {
  const color = AGE_COLORS[ageGroup] || '#6366f1';
  const icon = AGE_ICONS[ageGroup] || '🍴';
  const desc = AGE_DESCRIPTIONS[ageGroup] || '';

  return `
    <div style="text-align:center;padding:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,${color}08 0%,white 50%,${color}05 100%);">
      <div style="width:100px;height:100px;border-radius:28px;background:linear-gradient(135deg,${color},${color}cc);display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 12px 40px ${color}35;">
        <span style="font-size:50px;">${icon}</span>
      </div>

      <div style="font-size:11px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:6px;margin-bottom:12px;">Age Group</div>
      <div style="font-size:42px;font-weight:900;color:${color};margin-bottom:20px;letter-spacing:-1px;">${ageGroup}</div>

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
        <div style="width:40px;height:2px;background:${color};opacity:0.25;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color}50;"></div>
        <div style="width:40px;height:2px;background:${color};opacity:0.25;"></div>
      </div>

      <p style="font-size:15px;color:#64748b;font-style:italic;margin:0 0 12px;max-width:420px;line-height:1.7;">${desc}</p>
      <div style="font-size:18px;color:#475569;font-weight:700;">${count} recipe${count > 1 ? 's' : ''}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:6px;">in this section</div>
    </div>
  `;
}

function buildRecipePage(recipe: RecipeForEbook, globalNum: number): string {
  const color = AGE_COLORS[recipe.ageGroup] || '#6366f1';

  // Image section — hero style
  const imageHtml = recipe.image ? `
    <div style="width:100%;height:220px;border-radius:16px;overflow:hidden;margin-bottom:18px;box-shadow:0 8px 30px rgba(0,0,0,0.1);position:relative;">
      <img src="${recipe.image}" style="width:100%;height:100%;object-fit:cover;" crossorigin="anonymous" />
      <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(to top,rgba(0,0,0,0.5),transparent);"></div>
      <div style="position:absolute;bottom:12px;left:16px;display:flex;gap:6px;">
        <span style="padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;background:white;color:${color};">${recipe.category}</span>
        <span style="padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;background:white;color:#475569;">⏱️ ${recipe.prepTime}</span>
        <span style="padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;background:white;color:#475569;">🍽️ ${recipe.servings}</span>
      </div>
      <div style="position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:800;box-shadow:0 4px 12px ${color}50;">${globalNum}</div>
    </div>
  ` : `
    <div style="width:100%;height:80px;border-radius:16px;background:linear-gradient(135deg,${color}15,${color}08);display:flex;align-items:center;padding:0 24px;margin-bottom:18px;border:1px solid ${color}20;">
      <div style="width:36px;height:36px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:15px;font-weight:800;margin-right:16px;">${globalNum}</div>
      <div style="flex:1;">
        <span style="padding:4px 12px;border-radius:20px;font-size:9px;font-weight:700;background:${color}15;color:${color};border:1px solid ${color}30;margin-right:6px;">${recipe.category}</span>
        <span style="font-size:9px;color:#64748b;">⏱️ ${recipe.prepTime} · 🍽️ ${recipe.servings}</span>
      </div>
    </div>
  `;

  // Title + description
  const headerHtml = `
    <div style="margin-bottom:14px;">
      <h3 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 4px;line-height:1.3;">${recipe.title}</h3>
      <p style="font-size:11px;color:#64748b;font-style:italic;margin:0;line-height:1.6;">${recipe.description}</p>
    </div>
  `;

  // Ingredients — compact 2-col
  const half = Math.ceil(recipe.ingredients.length / 2);
  const col1 = recipe.ingredients.slice(0, half);
  const col2 = recipe.ingredients.slice(half);
  const ingredientItem = (item: string) => `
    <div style="display:flex;align-items:flex-start;gap:5px;padding:2px 0;font-size:10px;color:#475569;line-height:1.5;">
      <span style="color:${color};flex-shrink:0;font-size:8px;margin-top:2px;">●</span>
      <span>${item}</span>
    </div>
  `;
  const ingredientsHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:18px;height:2px;background:${color};border-radius:1px;"></span>
        📋 INGREDIENTS
      </div>
      <div style="display:flex;gap:14px;">
        <div style="flex:1;">${col1.map(ingredientItem).join('')}</div>
        <div style="flex:1;">${col2.map(ingredientItem).join('')}</div>
      </div>
    </div>
  `;

  // Instructions — numbered steps
  const stepsHtml = recipe.instructions.map((step, i) => `
    <div style="display:flex;gap:8px;margin-bottom:5px;">
      <div style="width:18px;height:18px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:9px;font-weight:800;flex-shrink:0;margin-top:1px;">${i + 1}</div>
      <p style="font-size:10px;line-height:1.65;color:#475569;margin:0;flex:1;">${step}</p>
    </div>
  `).join('');
  const instructionsHtml = `
    <div style="margin-bottom:12px;">
      <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
        <span style="display:inline-block;width:18px;height:2px;background:${color};border-radius:1px;"></span>
        👣 INSTRUCTIONS
      </div>
      ${stepsHtml}
    </div>
  `;

  // Nutrition bar
  const nutritionItems = [
    { label: 'Calories', value: recipe.nutrition.calories, icon: '🔥' },
    { label: 'Protein', value: recipe.nutrition.protein, icon: '💪' },
    { label: 'Carbs', value: recipe.nutrition.carbs, icon: '🌾' },
    { label: 'Fat', value: recipe.nutrition.fat, icon: '🥑' },
    { label: 'Fiber', value: recipe.nutrition.fiber, icon: '🥬' },
  ];
  const nutritionCells = nutritionItems.map(n => `
    <div style="text-align:center;flex:1;padding:6px 2px;">
      <div style="font-size:11px;">${n.icon}</div>
      <div style="font-size:10px;font-weight:800;color:#0f172a;margin-top:1px;">${n.value}</div>
      <div style="font-size:8px;color:#94a3b8;margin-top:1px;font-weight:600;">${n.label}</div>
    </div>
  `).join('');

  // Vitamins
  const vitaminsHtml = recipe.nutrition.vitamins?.length > 0
    ? recipe.nutrition.vitamins.map(v => `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:8.5px;font-weight:600;background:#ecfdf5;color:#10b981;border:1px solid #a7f3d0;margin:1px;">${v}</span>`).join(' ')
    : '';

  // Allergens
  const allergensHtml = recipe.allergens.length > 0
    ? recipe.allergens.map(a => `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:8.5px;font-weight:600;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;margin:1px;">${a}</span>`).join(' ')
    : '<span style="font-size:9px;color:#10b981;font-weight:600;">None</span>';

  // Bottom section
  const bottomHtml = `
    <div style="background:#f8fafc;border-radius:12px;padding:10px 14px;margin-top:8px;">
      <div style="display:flex;margin-bottom:6px;">${nutritionCells}</div>
      ${vitaminsHtml ? `<div style="margin-bottom:6px;">${vitaminsHtml}</div>` : ''}
      <div style="display:flex;gap:16px;border-top:1px solid #e2e8f0;padding-top:6px;">
        <div style="flex:1;"><span style="font-size:9px;font-weight:700;color:#ef4444;">⚠️ Allergens: </span>${allergensHtml}</div>
        <div style="flex:1;"><span style="font-size:9px;font-weight:700;color:#6366f1;">🧊 Storage: </span><span style="font-size:9px;color:#64748b;">${recipe.storage}</span></div>
      </div>
    </div>
  `;

  return `
    <div style="padding:28px 40px;page-break-before:always;page-break-inside:avoid;">
      ${imageHtml}
      ${headerHtml}
      <div style="display:flex;gap:18px;">
        <div style="flex:4;">
          ${ingredientsHtml}
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,${color}30,transparent);"></div>
        <div style="flex:5;">
          ${instructionsHtml}
        </div>
      </div>
      ${bottomHtml}
    </div>
  `;
}

function buildBackCover(today: string): string {
  return `
    <div style="text-align:center;padding:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff5f7 0%,#ffffff 50%,#fffbeb 100%);">
      <div style="width:90px;height:90px;border-radius:24px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 12px 40px #ec489930;">
        <span style="font-size:44px;">👩‍🍳</span>
      </div>

      <div style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#ec4899,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;">BabyBites</div>
      <div style="font-size:13px;color:#64748b;margin-bottom:40px;font-weight:500;">Recipe Book — Illustrated eBook Edition</div>

      <div style="width:60px;height:2px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:1px;margin-bottom:40px;"></div>

      <div style="max-width:460px;padding:24px 32px;background:#fdf2f8;border-radius:18px;margin-bottom:36px;border:1px solid #fce7f3;">
        <p style="font-size:12.5px;line-height:1.8;color:#64748b;margin:0 0 8px;">
          <strong style="color:#ec4899;">Disclaimer:</strong> These recipes are for educational purposes. Always check allergens and consult your pediatrician before introducing new foods.
        </p>
        <p style="font-size:12.5px;line-height:1.8;color:#64748b;margin:0;">
          Every child is unique — adapt recipes to your baby's specific needs and preferences.
        </p>
      </div>

      <p style="font-size:11px;color:#94a3b8;margin:0 0 4px;">Generated by BabyBites</p>
      <p style="font-size:11px;color:#cbd5e1;margin:0 0 28px;">${today} • All rights reserved</p>

      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:20px;">👶</span>
        <span style="font-size:11px;color:#94a3b8;font-style:italic;">Cooked with love for little ones</span>
        <span style="font-size:20px;">💕</span>
      </div>
    </div>
  `;
}

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
  @page { size: A4; margin: 8mm 8mm; }
  @media print {
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    img { max-width: 100% !important; }
  }
  .page-break { page-break-before: always; }
`;

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

  const sections: string[] = [
    buildCoverPage(allRecipes.length, ageGroupsUsed, today),
    `<div class="page-break"></div>`,
    buildIntroPage(),
    `<div class="page-break"></div>`,
    buildTOCPage(grouped, globalIndex),
  ];

  for (const ag of ageGroupsUsed) {
    sections.push(`<div class="page-break"></div>`);
    sections.push(buildAgeGroupDivider(ag, grouped[ag].length));

    // Each recipe gets its own page with hero image
    for (const r of grouped[ag]) {
      sections.push(buildRecipePage(r, globalIndex[r.id]));
    }
  }

  sections.push(`<div class="page-break"></div>`);
  sections.push(buildBackCover(today));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html><html><head><title>BabyBites — Recipe Book</title><style>${PRINT_STYLES}</style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close();

  // Longer timeout to allow images to load
  setTimeout(() => { printWindow.print(); }, 2500);
};
