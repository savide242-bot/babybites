// Uses browser native print for reliable PDF generation

interface RecipeForEbook {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  prepTime: string;
  servings: string;
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
    `<span style="display:inline-block;padding:8px 18px;border-radius:24px;font-size:11px;font-weight:700;border:2px solid ${AGE_COLORS[ag] || '#6366f1'};color:${AGE_COLORS[ag] || '#6366f1'};margin:4px;">
      ${AGE_ICONS[ag] || '🍴'} ${ag}
    </span>`
  ).join('');

  return `
    <div style="text-align:center;padding:90px 50px 70px;position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:3px solid #ec4899;border-radius:24px;opacity:0.12;"></div>
      <div style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;border:1.5px solid #f59e0b;border-radius:18px;opacity:0.08;"></div>

      <div style="width:100px;height:100px;border-radius:28px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <span style="font-size:50px;">👩‍🍳</span>
      </div>

      <div style="font-size:15px;font-weight:800;color:#ec4899;letter-spacing:8px;text-transform:uppercase;margin-bottom:50px;">BABYBITES</div>

      <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:40px;">
        <div style="width:50px;height:2px;background:#ec4899;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:#f59e0b;"></div>
        <div style="width:50px;height:2px;background:#f59e0b;"></div>
      </div>

      <h1 style="font-size:42px;font-weight:800;color:#1e293b;margin:0 0 8px;line-height:1.2;">The Complete</h1>
      <h1 style="font-size:42px;font-weight:800;color:#ec4899;margin:0 0 10px;line-height:1.2;">Recipe Book</h1>
      <p style="font-size:17px;color:#64748b;margin:0 0 8px;font-style:italic;">Nutritious recipes for every stage of growth</p>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 55px;">${today} Edition</p>

      <div style="display:flex;justify-content:center;gap:40px;margin-bottom:55px;">
        <div style="text-align:center;">
          <div style="font-size:36px;font-weight:800;color:#ec4899;">${recipeCount}</div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Recipes</div>
        </div>
        <div style="width:2px;background:#e2e8f0;"></div>
        <div style="text-align:center;">
          <div style="font-size:36px;font-weight:800;color:#f59e0b;">${ageGroups.length}</div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Age Groups</div>
        </div>
        <div style="width:2px;background:#e2e8f0;"></div>
        <div style="text-align:center;">
          <div style="font-size:36px;">📖</div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">eBook</div>
        </div>
      </div>

      <div style="display:flex;flex-wrap:wrap;justify-content:center;">${badges}</div>
    </div>
  `;
}

function buildIntroPage(): string {
  return `
    <div style="padding:60px 50px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:24px;">📖</span>
        </div>
        <h2 style="font-size:28px;font-weight:800;color:#1e293b;margin:0;">About This Book</h2>
      </div>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:2px;margin-bottom:32px;"></div>

      <p style="font-size:14px;line-height:1.9;color:#475569;margin:0 0 20px;">
        Welcome to the <strong style="color:#ec4899;">BabyBites Recipe Book</strong> — your complete collection of nutritious and delicious recipes, carefully organized by age group to support every stage of your baby's growth.
      </p>

      <p style="font-size:14px;line-height:1.9;color:#475569;margin:0 0 20px;">
        Every recipe has been developed with age-specific nutritional needs in mind, featuring safe ingredients, detailed instructions, and complete nutritional information so you can feed your little one with confidence.
      </p>

      <div style="border-left:4px solid #ec4899;background:#fdf2f8;border-radius:0 12px 12px 0;padding:20px 24px;margin:28px 0;">
        <div style="font-size:13px;font-weight:700;color:#ec4899;margin-bottom:8px;">🍽️ How to Use</div>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          Recipes are organized by age group. Browse the Table of Contents to find recipes suitable for your baby's age. Each recipe includes prep time, servings, ingredients, step-by-step instructions, and full nutritional info.
        </p>
      </div>

      <div style="border-left:4px solid #f59e0b;background:#fffbeb;border-radius:0 12px 12px 0;padding:20px 24px;margin:28px 0;">
        <div style="font-size:13px;font-weight:700;color:#f59e0b;margin-bottom:8px;">⚠️ Food Safety</div>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          Always check allergens before preparing any recipe. Introduce new foods one at a time and wait 3-5 days to observe any reactions. Consult your pediatrician if you have concerns.
        </p>
      </div>

      <div style="border-left:4px solid #10b981;background:#ecfdf5;border-radius:0 12px 12px 0;padding:20px 24px;margin:28px 0;">
        <div style="font-size:13px;font-weight:700;color:#10b981;margin-bottom:8px;">✅ Recipe Guide</div>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          <strong>⏱️ Prep Time</strong> • <strong>🍽️ Servings</strong> • <strong>📋 Ingredients</strong> with checkboxes • <strong>👣 Instructions</strong> numbered steps • <strong>📊 Nutrition</strong> details • <strong>⚠️ Allergens</strong> • <strong>🧊 Storage</strong>
        </p>
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

    const displayRecipes = recipes.slice(0, 12);
    const hasMore = recipes.length > 12;

    const items = displayRecipes.map(r => `
      <div style="display:flex;align-items:baseline;padding:3px 0;border-bottom:1px dotted #f1f5f9;">
        <span style="color:${color};font-weight:700;margin-right:6px;min-width:28px;font-size:11px;">${globalIndex[r.id]}.</span>
        <span style="font-size:11px;color:#475569;flex:1;">${r.title}</span>
      </div>
    `).join('');

    const moreRow = hasMore ? `
      <div style="padding:6px 0;font-size:11px;color:#94a3b8;font-style:italic;">
        ... and ${recipes.length - 12} more recipes
      </div>
    ` : '';

    return `
      <div style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0 6px;">
          <span style="font-size:14px;">${icon}</span>
          <span style="font-size:13px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;">${ag}</span>
          <span style="font-size:11px;color:#94a3b8;margin-left:6px;">(${recipes.length} recipes)</span>
        </div>
        ${items}
        ${moreRow}
      </div>
    `;
  }).join('');

  return `
    <div style="padding:50px 50px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:24px;">📑</span>
        </div>
        <h2 style="font-size:28px;font-weight:800;color:#1e293b;margin:0;">Table of Contents</h2>
      </div>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:2px;margin-bottom:32px;"></div>
      ${tocSections}
    </div>
  `;
}

function buildAgeGroupDivider(ageGroup: string, count: number): string {
  const color = AGE_COLORS[ageGroup] || '#6366f1';
  const icon = AGE_ICONS[ageGroup] || '🍴';
  const desc = AGE_DESCRIPTIONS[ageGroup] || '';

  return `
    <div style="text-align:center;padding:140px 50px 100px;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="width:90px;height:90px;border-radius:22px;background:${color};display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 8px 30px ${color}40;">
        <span style="font-size:44px;">${icon}</span>
      </div>

      <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:5px;margin-bottom:14px;">Age Group</div>
      <div style="font-size:36px;font-weight:800;color:${color};margin-bottom:20px;">${ageGroup}</div>

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <div style="width:36px;height:2px;background:${color};opacity:0.3;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
        <div style="width:36px;height:2px;background:${color};opacity:0.3;"></div>
      </div>

      <p style="font-size:14px;color:#64748b;font-style:italic;margin:0 0 10px;max-width:400px;">${desc}</p>
      <div style="font-size:16px;color:#475569;font-weight:600;">${count} recipe${count > 1 ? 's' : ''} in this section</div>
    </div>
  `;
}

function buildRecipe(recipe: RecipeForEbook, globalNum: number): string {
  const color = AGE_COLORS[recipe.ageGroup] || '#6366f1';

  // Ingredients in two columns
  const half = Math.ceil(recipe.ingredients.length / 2);
  const col1 = recipe.ingredients.slice(0, half);
  const col2 = recipe.ingredients.slice(half);

  const ingredientCol = (items: string[]) => items.map(item => `
    <div style="display:flex;align-items:flex-start;gap:6px;padding:3px 0;font-size:11px;color:#475569;">
      <span style="color:${color};flex-shrink:0;">☐</span>
      <span>${item}</span>
    </div>
  `).join('');

  // Instructions
  const instructionsHtml = recipe.instructions.map((step, i) => `
    <div style="display:flex;gap:10px;margin-bottom:8px;">
      <div style="width:20px;height:20px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;flex-shrink:0;margin-top:1px;">${i + 1}</div>
      <p style="font-size:11px;line-height:1.7;color:#475569;margin:0;flex:1;">${step}</p>
    </div>
  `).join('');

  // Nutrition
  const nutritionItems = [
    { label: 'Calories', value: recipe.nutrition.calories, icon: '🔥' },
    { label: 'Protein', value: recipe.nutrition.protein, icon: '💪' },
    { label: 'Carbs', value: recipe.nutrition.carbs, icon: '🌾' },
    { label: 'Fat', value: recipe.nutrition.fat, icon: '🥑' },
    { label: 'Fiber', value: recipe.nutrition.fiber, icon: '🥬' },
  ];
  const nutritionCells = nutritionItems.map(n => `
    <div style="text-align:center;flex:1;padding:8px 4px;">
      <div style="font-size:12px;">${n.icon}</div>
      <div style="font-size:11px;font-weight:700;color:#1e293b;margin-top:2px;">${n.value}</div>
      <div style="font-size:9px;color:#94a3b8;margin-top:1px;">${n.label}</div>
    </div>
  `).join('');

  // Allergens
  const allergensHtml = recipe.allergens.length > 0
    ? recipe.allergens.map(a => `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;margin:2px;">${a}</span>`).join(' ')
    : '<span style="font-size:10px;color:#10b981;font-weight:600;">No known allergens</span>';

  // Vitamins
  const vitaminsHtml = recipe.nutrition.vitamins && recipe.nutrition.vitamins.length > 0
    ? recipe.nutrition.vitamins.map(v => `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:600;background:#ecfdf5;color:#10b981;border:1px solid #a7f3d0;margin:2px;">${v}</span>`).join(' ')
    : '';

  return `
    <div style="margin-bottom:32px;page-break-inside:avoid;">
      <!-- Header -->
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;">
        <div style="width:36px;height:36px;border-radius:10px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:800;flex-shrink:0;">${globalNum}</div>
        <div style="flex:1;">
          <div style="font-size:16px;font-weight:800;color:#1e293b;line-height:1.3;margin-bottom:6px;">${recipe.title}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:9px;font-weight:700;background:${color}15;color:${color};border:1px solid ${color}30;">${recipe.category}</span>
            <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:9px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;">⏱️ ${recipe.prepTime}</span>
            <span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:9px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;">🍽️ ${recipe.servings}</span>
          </div>
        </div>
      </div>

      <p style="font-size:11px;color:#64748b;font-style:italic;margin:0 0 14px 50px;line-height:1.6;">${recipe.description}</p>

      <!-- Two columns -->
      <div style="display:flex;gap:20px;margin-left:50px;">
        <div style="flex:4;">
          <div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">📋 Ingredients</div>
          <div style="display:flex;gap:16px;">
            <div style="flex:1;">${ingredientCol(col1)}</div>
            <div style="flex:1;">${ingredientCol(col2)}</div>
          </div>
        </div>
        <div style="width:1px;background:#f1f5f9;"></div>
        <div style="flex:5;">
          <div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">👣 Instructions</div>
          ${instructionsHtml}
        </div>
      </div>

      <!-- Nutrition bar -->
      <div style="display:flex;background:#f8fafc;border-radius:10px;margin:14px 0 8px 50px;overflow:hidden;">
        ${nutritionCells}
      </div>

      <!-- Vitamins -->
      ${vitaminsHtml ? `<div style="margin:6px 0 6px 50px;">${vitaminsHtml}</div>` : ''}

      <!-- Allergens + Storage -->
      <div style="display:flex;gap:20px;margin:8px 0 0 50px;">
        <div style="flex:1;">
          <span style="font-size:10px;font-weight:700;color:#ef4444;">⚠️ Allergens: </span>${allergensHtml}
        </div>
        <div style="flex:1;">
          <span style="font-size:10px;font-weight:700;color:#6366f1;">🧊 Storage: </span>
          <span style="font-size:10px;color:#64748b;">${recipe.storage}</span>
        </div>
      </div>

      <!-- Separator -->
      <div style="height:1px;background:linear-gradient(to right,${color}20,${color}08);margin-top:22px;"></div>
    </div>
  `;
}

function buildBackCover(today: string): string {
  return `
    <div style="text-align:center;padding:120px 60px 80px;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="width:80px;height:80px;border-radius:22px;background:linear-gradient(135deg,#ec4899,#f59e0b);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:40px;">👩‍🍳</span>
      </div>

      <div style="font-size:26px;font-weight:800;color:#ec4899;margin-bottom:8px;">BabyBites</div>
      <div style="font-size:14px;color:#64748b;margin-bottom:50px;">Recipe Book — eBook Edition</div>

      <div style="width:70px;height:2px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:1px;margin-bottom:50px;"></div>

      <div style="max-width:500px;padding:24px 32px;background:#fdf2f8;border-radius:16px;margin-bottom:40px;">
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0 0 10px;">
          <strong style="color:#ec4899;">Disclaimer:</strong> These recipes are for educational purposes. Always check allergens and consult your pediatrician before introducing new foods.
        </p>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          Every child is unique — adapt recipes to your baby's specific needs.
        </p>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;">Generated by BabyBites</p>
      <p style="font-size:12px;color:#cbd5e1;margin:0 0 30px;">${today} • All rights reserved</p>

      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:22px;">👶</span>
        <span style="font-size:12px;color:#94a3b8;font-style:italic;">Cooked with love for little ones</span>
        <span style="font-size:22px;">💕</span>
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
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 12mm 10mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
    sections.push(`<div class="page-break"></div>`);
    
    const recipesHtml = grouped[ag].map(r => buildRecipe(r, globalIndex[r.id])).join('');
    sections.push(`<div style="padding:30px 50px;">${recipesHtml}</div>`);
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

  setTimeout(() => { printWindow.print(); }, 600);
};
