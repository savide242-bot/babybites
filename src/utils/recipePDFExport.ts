import html2pdf from 'html2pdf.js';

interface RecipeForPDF {
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  prepTime: string;
  servings: string;
  image: string;
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
  healthBenefits?: string;
}

export const exportRecipePDF = (recipe: RecipeForPDF) => {
  const ingredientsHTML = recipe.ingredients
    .map(
      (ing) =>
        `<div class="ingredient-item"><span class="checkbox">☐</span><span>${ing}</span></div>`
    )
    .join("");

  const instructionsHTML = recipe.instructions
    .map(
      (step, i) =>
        `<div class="step-card"><div class="step-number">${i + 1}</div><div class="step-text">${step}</div></div>`
    )
    .join("");

  const allergensHTML = recipe.allergens.length
    ? recipe.allergens
        .map((a) => `<span class="allergen-badge">${a}</span>`)
        .join("")
    : '<span class="no-allergens">No known allergens</span>';

  const vitaminsHTML = recipe.nutrition.vitamins
    .map((v) => `<span class="vitamin-badge">${v}</span>`)
    .join("");

  const container = document.createElement("div");
  container.innerHTML = `
<div class="page" style="max-width:600px;margin:0 auto;padding:20px;font-family:'Nunito',-apple-system,sans-serif;color:#2d2d2d;line-height:1.6;">
  <div style="text-align:center;padding:16px 0 12px;border-bottom:3px solid #ff8c69;margin-bottom:16px;">
    <div style="font-size:22px;font-weight:800;color:#ff8c69;letter-spacing:-0.5px;">🍼 BabyBites</div>
    <div style="font-size:10px;color:#999;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">Nutritious recipes for little ones</div>
  </div>

  <div style="text-align:center;margin-bottom:20px;">
    <h1 style="font-size:24px;font-weight:800;color:#1a1a1a;margin-bottom:8px;line-height:1.2;">${recipe.title}</h1>
    <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#fff3e6;color:#e67700;border:1px solid #ffd8a8;">👶 ${recipe.ageGroup}</span>
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#e6f9f0;color:#0ca678;border:1px solid #96f2d7;">📂 ${recipe.category}</span>
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#f3f0ff;color:#7048e8;border:1px solid #d0bfff;">⏱ ${recipe.prepTime}</span>
      <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:#fff0f6;color:#d6336c;border:1px solid #fcc2d7;">🍽 ${recipe.servings}</span>
    </div>
    <img src="${recipe.image}" style="width:100%;max-height:260px;object-fit:cover;border-radius:16px;margin-bottom:12px;" alt="${recipe.title}" crossorigin="anonymous" />
    <p style="font-size:13px;color:#555;text-align:center;padding:0 10px;margin-bottom:20px;">${recipe.description}</p>
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #ffe3d6;">🥕 Ingredients</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;">${ingredientsHTML}</div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #ffe3d6;">👩‍🍳 Instructions</div>
    ${instructionsHTML}
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #ffe3d6;">📊 Nutrition</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
      <div style="text-align:center;padding:10px 6px;background:#fff5f2;border-radius:12px;border:1px solid #ffe3d6;">
        <div style="font-size:16px;font-weight:800;color:#e85d75;">${recipe.nutrition.calories}</div>
        <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Calories</div>
      </div>
      <div style="text-align:center;padding:10px 6px;background:#fff5f2;border-radius:12px;border:1px solid #ffe3d6;">
        <div style="font-size:16px;font-weight:800;color:#e85d75;">${recipe.nutrition.protein}</div>
        <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Protein</div>
      </div>
      <div style="text-align:center;padding:10px 6px;background:#fff5f2;border-radius:12px;border:1px solid #ffe3d6;">
        <div style="font-size:16px;font-weight:800;color:#e85d75;">${recipe.nutrition.carbs}</div>
        <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Carbs</div>
      </div>
      <div style="text-align:center;padding:10px 6px;background:#fff5f2;border-radius:12px;border:1px solid #ffe3d6;">
        <div style="font-size:16px;font-weight:800;color:#e85d75;">${recipe.nutrition.fat}</div>
        <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Fat</div>
      </div>
      <div style="text-align:center;padding:10px 6px;background:#fff5f2;border-radius:12px;border:1px solid #ffe3d6;">
        <div style="font-size:16px;font-weight:800;color:#e85d75;">${recipe.nutrition.fiber}</div>
        <div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">Fiber</div>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;">${vitaminsHTML}</div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #ffe3d6;">⚠️ Allergens</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">${allergensHTML}</div>
  </div>

  <div style="margin-bottom:20px;">
    <div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #ffe3d6;">❄️ Storage Tips</div>
    <div style="padding:10px 14px;background:#f0f4ff;border-radius:10px;font-size:12px;color:#4263eb;border:1px solid #dbe4ff;">${recipe.storage}</div>
  </div>

  ${recipe.healthBenefits ? `
  <div style="margin-bottom:20px;">
    <div style="font-size:15px;font-weight:800;color:#1a1a1a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #ffe3d6;">💚 Health Benefits</div>
    <div style="padding:10px 14px;background:#e6f9f0;border-radius:10px;font-size:12px;color:#0ca678;border:1px solid #96f2d7;">${recipe.healthBenefits}</div>
  </div>` : ""}

  <div style="text-align:center;padding:16px 0 8px;margin-top:20px;border-top:2px solid #ffe3d6;">
    <div style="font-size:11px;color:#aaa;">Made with love by <span style="font-weight:800;color:#ff8c69;">BabyBites</span> 💕</div>
  </div>
</div>`;

  // Style ingredient items and step cards inline for html2pdf
  container.querySelectorAll('.ingredient-item').forEach(el => {
    (el as HTMLElement).style.cssText = 'display:flex;align-items:flex-start;gap:6px;font-size:12px;padding:4px 0;';
  });
  container.querySelectorAll('.checkbox').forEach(el => {
    (el as HTMLElement).style.cssText = 'font-size:14px;color:#ff8c69;flex-shrink:0;';
  });
  container.querySelectorAll('.step-card').forEach(el => {
    (el as HTMLElement).style.cssText = 'display:flex;gap:12px;padding:10px 12px;background:#fafafa;border-radius:10px;margin-bottom:8px;border-left:3px solid #ff8c69;';
  });
  container.querySelectorAll('.step-number').forEach(el => {
    (el as HTMLElement).style.cssText = 'width:26px;height:26px;min-width:26px;background:#ff8c69;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;';
  });
  container.querySelectorAll('.step-text').forEach(el => {
    (el as HTMLElement).style.cssText = 'font-size:12px;line-height:1.5;color:#333;';
  });
  container.querySelectorAll('.allergen-badge').forEach(el => {
    (el as HTMLElement).style.cssText = 'padding:4px 10px;background:#fff3bf;color:#e67700;border-radius:12px;font-size:11px;font-weight:700;border:1px solid #ffd43b;';
  });
  container.querySelectorAll('.no-allergens').forEach(el => {
    (el as HTMLElement).style.cssText = 'font-size:12px;color:#0ca678;font-weight:600;';
  });
  container.querySelectorAll('.vitamin-badge').forEach(el => {
    (el as HTMLElement).style.cssText = 'padding:3px 8px;background:#e6f9f0;color:#0ca678;border-radius:12px;font-size:10px;font-weight:600;';
  });

  // Temporarily add to DOM for rendering
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  const sanitizedTitle = recipe.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

  const opt = {
    margin: [5, 5, 5, 5],
    filename: `BabyBites-${sanitizedTitle}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      allowTaint: true,
      logging: false
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  html2pdf()
    .set(opt)
    .from(container.firstElementChild)
    .save()
    .then(() => {
      document.body.removeChild(container);
    })
    .catch((err: Error) => {
      console.error('PDF generation error:', err);
      document.body.removeChild(container);
      throw err;
    });
};
