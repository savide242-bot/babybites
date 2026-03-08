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
  '6-9 months': 'Primeiras papas e purés — texturas suaves para os primeiros sabores',
  '9-12 months': 'Texturas mais consistentes e finger foods para explorar',
  '12-18 months': 'Refeições variadas com mais sabores e combinações',
  '18-24 months': 'Pratos completos para pequenos exploradores',
  '24+ months': 'Receitas criativas para crianças em crescimento',
};

function buildCoverPage(recipeCount: number, ageGroups: string[], today: string): string {
  const badges = ageGroups.map(ag =>
    `<td style="padding:4px;">
      <div style="display:inline-block;padding:6px 14px;border-radius:20px;font-size:10px;font-weight:700;border:2px solid ${AGE_COLORS[ag] || '#6366f1'};color:${AGE_COLORS[ag] || '#6366f1'};">
        ${AGE_ICONS[ag] || '🍴'} ${ag}
      </div>
    </td>`
  ).join('');

  return `
    <div style="text-align:center;padding:70px 40px 60px;position:relative;">
      <div style="position:absolute;top:20px;left:20px;right:20px;bottom:20px;border:3px solid #ec4899;border-radius:20px;opacity:0.15;"></div>
      <div style="position:absolute;top:28px;left:28px;right:28px;bottom:28px;border:1px solid #f59e0b;border-radius:16px;opacity:0.1;"></div>

      <table style="margin:0 auto 16px;border-collapse:collapse;">
        <tr>
          <td style="width:90px;height:90px;border-radius:24px;background:linear-gradient(135deg,#ec4899,#f59e0b);text-align:center;vertical-align:middle;">
            <span style="font-size:44px;">👩‍🍳</span>
          </td>
        </tr>
      </table>

      <div style="font-size:14px;font-weight:800;color:#ec4899;letter-spacing:6px;text-transform:uppercase;margin-bottom:36px;">BABYBITES</div>

      <table style="margin:0 auto 28px;border-collapse:collapse;">
        <tr>
          <td style="width:40px;height:2px;background:#ec4899;"></td>
          <td style="width:16px;"></td>
          <td style="width:8px;height:8px;border-radius:50%;background:#f59e0b;"></td>
          <td style="width:16px;"></td>
          <td style="width:40px;height:2px;background:#f59e0b;"></td>
        </tr>
      </table>

      <h1 style="font-size:34px;font-weight:800;color:#1e293b;margin:0 0 8px;line-height:1.2;">Livro de Receitas</h1>
      <h1 style="font-size:28px;font-weight:800;color:#ec4899;margin:0 0 8px;line-height:1.2;">Nutrição Infantil</h1>
      <p style="font-size:15px;color:#64748b;margin:0 0 6px;font-style:italic;">Receitas saudáveis para cada fase do crescimento</p>
      <p style="font-size:13px;color:#94a3b8;margin:0 0 44px;">Edição ${today}</p>

      <table style="margin:0 auto 44px;border-collapse:collapse;">
        <tr>
          <td style="text-align:center;padding:12px 24px;border-right:2px solid #e2e8f0;">
            <div style="font-size:32px;font-weight:800;color:#ec4899;">${recipeCount}</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Receitas</div>
          </td>
          <td style="text-align:center;padding:12px 24px;border-right:2px solid #e2e8f0;">
            <div style="font-size:32px;font-weight:800;color:#f59e0b;">${ageGroups.length}</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Faixas Etárias</div>
          </td>
          <td style="text-align:center;padding:12px 24px;">
            <div style="font-size:32px;">📖</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">eBook</div>
          </td>
        </tr>
      </table>

      <table style="margin:0 auto;border-collapse:collapse;">
        <tr>${badges}</tr>
      </table>
    </div>
  `;
}

function buildIntroPage(): string {
  return `
    <div style="padding:50px 44px;">
      <table style="margin-bottom:28px;border-collapse:collapse;">
        <tr>
          <td style="width:50px;vertical-align:middle;">
            <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#f59e0b);text-align:center;line-height:42px;">
              <span style="font-size:22px;">📖</span>
            </div>
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <div style="font-size:24px;font-weight:800;color:#1e293b;">Sobre Este Livro</div>
          </td>
        </tr>
      </table>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:2px;margin-bottom:24px;"></div>

      <p style="font-size:13px;line-height:1.8;color:#475569;margin:0 0 16px;">
        Bem-vindo ao <strong style="color:#ec4899;">BabyBites Livro de Receitas</strong> — a sua coleção completa de receitas nutritivas e deliciosas, cuidadosamente organizadas por faixa etária para acompanhar cada fase do crescimento do seu bebé.
      </p>

      <p style="font-size:13px;line-height:1.8;color:#475569;margin:0 0 16px;">
        Cada receita foi desenvolvida considerando as necessidades nutricionais específicas de cada idade, com ingredientes seguros, instruções detalhadas e informação nutricional completa para que possa alimentar o seu pequeno com confiança.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="width:4px;background:#ec4899;border-radius:2px;"></td>
          <td style="padding:16px 20px;background:#fdf2f8;border-radius:0 10px 10px 0;">
            <div style="font-size:12px;font-weight:700;color:#ec4899;margin-bottom:6px;">🍽️ Como Utilizar</div>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              As receitas estão organizadas por faixa etária. Navegue pelo índice para encontrar receitas adequadas à idade do seu bebé. Cada receita inclui tempo de preparação, porções, ingredientes, instruções passo a passo e informação nutricional.
            </p>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="width:4px;background:#f59e0b;border-radius:2px;"></td>
          <td style="padding:16px 20px;background:#fffbeb;border-radius:0 10px 10px 0;">
            <div style="font-size:12px;font-weight:700;color:#f59e0b;margin-bottom:6px;">⚠️ Segurança Alimentar</div>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              Verifique sempre os alergénios antes de preparar qualquer receita. Introduza novos alimentos um de cada vez e aguarde 3-5 dias para observar possíveis reações. Consulte o pediatra se tiver dúvidas.
            </p>
          </td>
        </tr>
      </table>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="width:4px;background:#10b981;border-radius:2px;"></td>
          <td style="padding:16px 20px;background:#ecfdf5;border-radius:0 10px 10px 0;">
            <div style="font-size:12px;font-weight:700;color:#10b981;margin-bottom:6px;">✅ Legenda de Cada Receita</div>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              <strong>⏱️ Tempo</strong> de preparação • <strong>🍽️ Porções</strong> • <strong>📋 Ingredientes</strong> com checkboxes • <strong>👣 Instruções</strong> numeradas • <strong>📊 Nutrição</strong> detalhada • <strong>⚠️ Alergénios</strong> • <strong>🧊 Armazenamento</strong>
            </p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildTOCPage(grouped: Record<string, RecipeForEbook[]>, globalIndex: Record<string, number>): string {
  const ageGroups = Object.keys(grouped);

  const tocSections = ageGroups.map(ag => {
    const color = AGE_COLORS[ag] || '#6366f1';
    const icon = AGE_ICONS[ag] || '🍴';
    const recipes = grouped[ag];

    // Show first 15 recipes then "..." if more
    const displayRecipes = recipes.slice(0, 15);
    const hasMore = recipes.length > 15;

    const items = displayRecipes.map(r => `
      <tr>
        <td style="padding:2px 0;font-size:10px;color:#475569;border-bottom:1px dotted #f1f5f9;">
          <span style="color:${color};font-weight:700;margin-right:4px;">${globalIndex[r.id]}.</span> ${r.title}
        </td>
      </tr>
    `).join('');

    const moreRow = hasMore ? `
      <tr>
        <td style="padding:4px 0;font-size:10px;color:#94a3b8;font-style:italic;">
          ... e mais ${recipes.length - 15} receitas
        </td>
      </tr>
    ` : '';

    return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;">
        <tr>
          <td style="padding:6px 0 4px;">
            <span style="font-size:13px;margin-right:4px;">${icon}</span>
            <span style="font-size:12px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;">${ag}</span>
            <span style="font-size:10px;color:#94a3b8;margin-left:6px;">(${recipes.length} receitas)</span>
          </td>
        </tr>
        ${items}
        ${moreRow}
      </table>
    `;
  }).join('');

  return `
    <div style="padding:36px 44px;">
      <table style="width:100%;margin-bottom:20px;border-collapse:collapse;">
        <tr>
          <td style="width:50px;vertical-align:middle;">
            <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#f59e0b);text-align:center;line-height:42px;">
              <span style="font-size:22px;">📑</span>
            </div>
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <div style="font-size:24px;font-weight:800;color:#1e293b;">Índice</div>
          </td>
        </tr>
      </table>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:2px;margin-bottom:22px;"></div>
      ${tocSections}
    </div>
  `;
}

function buildAgeGroupDivider(ageGroup: string, count: number): string {
  const color = AGE_COLORS[ageGroup] || '#6366f1';
  const icon = AGE_ICONS[ageGroup] || '🍴';
  const desc = AGE_DESCRIPTIONS[ageGroup] || '';

  return `
    <div style="text-align:center;padding:110px 40px 80px;">
      <table style="margin:0 auto 20px;border-collapse:collapse;">
        <tr>
          <td style="width:80px;height:80px;border-radius:20px;background:${color};text-align:center;vertical-align:middle;">
            <span style="font-size:40px;">${icon}</span>
          </td>
        </tr>
      </table>

      <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:4px;margin-bottom:10px;">Faixa Etária</div>
      <div style="font-size:30px;font-weight:800;color:${color};margin-bottom:12px;">${ageGroup}</div>

      <table style="margin:0 auto 16px;border-collapse:collapse;">
        <tr>
          <td style="width:30px;height:2px;background:${color};opacity:0.3;"></td>
          <td style="width:12px;"></td>
          <td style="width:8px;height:8px;border-radius:50%;background:${color};"></td>
          <td style="width:12px;"></td>
          <td style="width:30px;height:2px;background:${color};opacity:0.3;"></td>
        </tr>
      </table>

      <p style="font-size:13px;color:#64748b;margin:0 0 8px;font-style:italic;">${desc}</p>
      <div style="font-size:14px;color:#475569;font-weight:600;">${count} receita${count > 1 ? 's' : ''} nesta secção</div>
    </div>
  `;
}

function buildRecipe(recipe: RecipeForEbook, globalNum: number): string {
  const color = AGE_COLORS[recipe.ageGroup] || '#6366f1';

  // Ingredients in two columns
  const half = Math.ceil(recipe.ingredients.length / 2);
  const col1 = recipe.ingredients.slice(0, half);
  const col2 = recipe.ingredients.slice(half);
  const maxRows = Math.max(col1.length, col2.length);

  let ingredientRows = '';
  for (let i = 0; i < maxRows; i++) {
    const left = col1[i] ? `<span style="color:${color};margin-right:4px;">☐</span> ${col1[i]}` : '';
    const right = col2[i] ? `<span style="color:${color};margin-right:4px;">☐</span> ${col2[i]}` : '';
    ingredientRows += `
      <tr>
        <td style="padding:2px 8px 2px 0;font-size:10px;color:#475569;vertical-align:top;width:50%;">${left}</td>
        <td style="padding:2px 0 2px 8px;font-size:10px;color:#475569;vertical-align:top;width:50%;">${right}</td>
      </tr>
    `;
  }

  // Instructions
  const instructionsHtml = recipe.instructions.map((step, i) => `
    <table style="width:100%;margin-bottom:6px;border-collapse:collapse;">
      <tr>
        <td style="width:22px;vertical-align:top;padding-top:2px;">
          <div style="width:18px;height:18px;border-radius:50%;background:${color};text-align:center;line-height:18px;color:white;font-size:9px;font-weight:700;">${i + 1}</div>
        </td>
        <td style="padding-left:8px;font-size:10px;line-height:1.6;color:#475569;vertical-align:top;">${step}</td>
      </tr>
    </table>
  `).join('');

  // Nutrition grid
  const nutritionItems = [
    { label: 'Calorias', value: recipe.nutrition.calories, icon: '🔥' },
    { label: 'Proteína', value: recipe.nutrition.protein, icon: '💪' },
    { label: 'Hidratos', value: recipe.nutrition.carbs, icon: '🌾' },
    { label: 'Gordura', value: recipe.nutrition.fat, icon: '🥑' },
    { label: 'Fibra', value: recipe.nutrition.fiber, icon: '🥬' },
  ];
  const nutritionCells = nutritionItems.map(n => `
    <td style="text-align:center;padding:6px 4px;width:20%;">
      <div style="font-size:10px;">${n.icon}</div>
      <div style="font-size:10px;font-weight:700;color:#1e293b;">${n.value}</div>
      <div style="font-size:8px;color:#94a3b8;">${n.label}</div>
    </td>
  `).join('');

  // Allergens
  const allergensHtml = recipe.allergens.length > 0
    ? recipe.allergens.map(a => `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:#fef2f2;color:#ef4444;border:1px solid #fecaca;margin:2px;">${a}</span>`).join(' ')
    : '<span style="font-size:9px;color:#94a3b8;">Nenhum alergénio identificado</span>';

  // Vitamins
  const vitaminsHtml = recipe.nutrition.vitamins && recipe.nutrition.vitamins.length > 0
    ? recipe.nutrition.vitamins.map(v => `<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:600;background:#ecfdf5;color:#10b981;border:1px solid #a7f3d0;margin:2px;">${v}</span>`).join(' ')
    : '';

  return `
    <div style="margin-bottom:28px;page-break-inside:avoid;">
      <!-- Recipe header -->
      <table style="width:100%;margin-bottom:10px;border-collapse:collapse;">
        <tr>
          <td style="width:36px;vertical-align:top;">
            <div style="width:32px;height:32px;border-radius:8px;background:${color};text-align:center;line-height:32px;color:white;font-size:13px;font-weight:800;">${globalNum}</div>
          </td>
          <td style="padding-left:10px;vertical-align:top;">
            <div style="font-size:14px;font-weight:800;color:#1e293b;line-height:1.3;margin-bottom:4px;">${recipe.title}</div>
            <table style="border-collapse:collapse;">
              <tr>
                <td style="padding-right:6px;">
                  <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:8px;font-weight:700;background:${color}15;color:${color};border:1px solid ${color}30;">${recipe.category}</span>
                </td>
                <td style="padding-right:6px;">
                  <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:8px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;">⏱️ ${recipe.prepTime}</span>
                </td>
                <td>
                  <span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:8px;color:#64748b;background:#f8fafc;border:1px solid #e2e8f0;">🍽️ ${recipe.servings}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <p style="font-size:10px;color:#64748b;font-style:italic;margin:0 0 10px 42px;line-height:1.5;">${recipe.description}</p>

      <!-- Two-column: Ingredients + Instructions -->
      <table style="width:100%;border-collapse:collapse;margin-left:42px;">
        <tr>
          <td style="width:45%;vertical-align:top;padding-right:12px;">
            <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">📋 Ingredientes</div>
            <table style="width:100%;border-collapse:collapse;">
              ${ingredientRows}
            </table>
          </td>
          <td style="width:55%;vertical-align:top;padding-left:12px;border-left:1px solid #f1f5f9;">
            <div style="font-size:10px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">👣 Instruções</div>
            ${instructionsHtml}
          </td>
        </tr>
      </table>

      <!-- Nutrition -->
      <table style="width:calc(100% - 42px);margin:10px 0 6px 42px;border-collapse:collapse;background:#f8fafc;border-radius:8px;">
        <tr>${nutritionCells}</tr>
      </table>

      <!-- Vitamins -->
      ${vitaminsHtml ? `<div style="margin:4px 0 4px 42px;">${vitaminsHtml}</div>` : ''}

      <!-- Allergens + Storage -->
      <table style="width:calc(100% - 42px);margin:6px 0 0 42px;border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top;padding-right:12px;width:50%;">
            <span style="font-size:9px;font-weight:700;color:#ef4444;">⚠️ Alergénios: </span>${allergensHtml}
          </td>
          <td style="vertical-align:top;padding-left:12px;width:50%;">
            <span style="font-size:9px;font-weight:700;color:#6366f1;">🧊 Armazenamento: </span>
            <span style="font-size:9px;color:#64748b;">${recipe.storage}</span>
          </td>
        </tr>
      </table>

      <!-- Separator -->
      <table style="width:100%;margin-top:16px;border-collapse:collapse;">
        <tr>
          <td style="height:1px;background:${color};opacity:0.12;"></td>
        </tr>
      </table>
    </div>
  `;
}

function buildBackCover(today: string): string {
  return `
    <div style="text-align:center;padding:100px 50px 60px;">
      <table style="margin:0 auto 20px;border-collapse:collapse;">
        <tr>
          <td style="width:70px;height:70px;border-radius:20px;background:linear-gradient(135deg,#ec4899,#f59e0b);text-align:center;vertical-align:middle;">
            <span style="font-size:36px;">👩‍🍳</span>
          </td>
        </tr>
      </table>

      <div style="font-size:22px;font-weight:800;color:#ec4899;margin-bottom:8px;">BabyBites</div>
      <div style="font-size:13px;color:#64748b;margin-bottom:40px;">Livro de Receitas — Edição eBook</div>

      <table style="margin:0 auto 40px;border-collapse:collapse;">
        <tr>
          <td style="width:60px;height:2px;background:linear-gradient(to right,#ec4899,#f59e0b);border-radius:1px;"></td>
        </tr>
      </table>

      <table style="width:80%;margin:0 auto 30px;border-collapse:collapse;">
        <tr>
          <td style="padding:20px 24px;background:#fdf2f8;border-radius:12px;text-align:center;">
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0 0 8px;">
              <strong style="color:#ec4899;">Aviso Legal:</strong> Estas receitas são para fins educativos. Verifique sempre os alergénios e consulte o pediatra antes de introduzir novos alimentos.
            </p>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              Cada criança é única — adapte as receitas às necessidades específicas do seu bebé.
            </p>
          </td>
        </tr>
      </table>

      <p style="font-size:11px;color:#94a3b8;margin:0 0 6px;">Gerado automaticamente por BabyBites</p>
      <p style="font-size:11px;color:#cbd5e1;margin:0;">${today} • Todos os direitos reservados</p>

      <table style="margin:30px auto 0;border-collapse:collapse;">
        <tr>
          <td style="font-size:20px;padding:0 4px;">👶</td>
          <td style="font-size:11px;color:#94a3b8;font-style:italic;">Cozinhado com amor para os pequeninos</td>
          <td style="font-size:20px;padding:0 4px;">💕</td>
        </tr>
      </table>
    </div>
  `;
}

export const exportRecipeEbook = (allRecipes: RecipeForEbook[]) => {
  const today = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });

  // Group by age
  const grouped: Record<string, RecipeForEbook[]> = {};
  for (const ag of AGE_GROUP_ORDER) {
    const agRecipes = allRecipes.filter(r => r.ageGroup === ag);
    if (agRecipes.length > 0) grouped[ag] = agRecipes;
  }

  const ageGroupsUsed = Object.keys(grouped);

  // Global index
  const globalIndex: Record<string, number> = {};
  let counter = 1;
  for (const ag of ageGroupsUsed) {
    for (const r of grouped[ag]) {
      globalIndex[r.id] = counter++;
    }
  }

  const wrap = (html: string, forceBreak = false) => 
    `<div style="${forceBreak ? 'page-break-before:always;' : ''}">${html}</div>`;

  const allSections = [
    wrap(buildCoverPage(allRecipes.length, ageGroupsUsed, today), false),
    wrap(buildIntroPage(), true),
    wrap(buildTOCPage(grouped, globalIndex), true),
  ];

  for (const ag of ageGroupsUsed) {
    allSections.push(wrap(buildAgeGroupDivider(ag, grouped[ag].length), true));
    
    const agRecipes = grouped[ag];
    const recipesHtml = agRecipes.map(r => buildRecipe(r, globalIndex[r.id])).join('');
    allSections.push(wrap(`<div style="padding:20px 44px;">${recipesHtml}</div>`, true));
  }

  allSections.push(wrap(buildBackCover(today), true));

  const fullHtml = allSections.join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permita popups para gerar o PDF.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>BabyBites — Livro de Receitas</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: white; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @page { size: A4; margin: 10mm; }
      </style>
    </head>
    <body>${fullHtml}</body>
    </html>
  `);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};
