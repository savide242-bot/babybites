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

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${recipe.title} - BabyBites</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Nunito', -apple-system, sans-serif;
    color: #2d2d2d;
    background: #fff;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }

  /* HEADER */
  .header {
    text-align: center;
    padding: 16px 0 12px;
    border-bottom: 3px solid #ff8c69;
    margin-bottom: 16px;
  }
  .logo-text {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, #ff8c69, #e85d75);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }
  .logo-sub {
    font-size: 10px;
    color: #999;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* HERO */
  .hero {
    text-align: center;
    margin-bottom: 20px;
  }
  .recipe-title {
    font-size: 24px;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 8px;
    line-height: 1.2;
  }
  .badge-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }
  .badge-age {
    background: #fff3e6;
    color: #e67700;
    border: 1px solid #ffd8a8;
  }
  .badge-category {
    background: #e6f9f0;
    color: #0ca678;
    border: 1px solid #96f2d7;
  }
  .badge-time {
    background: #f3f0ff;
    color: #7048e8;
    border: 1px solid #d0bfff;
  }
  .badge-servings {
    background: #fff0f6;
    color: #d6336c;
    border: 1px solid #fcc2d7;
  }

  .recipe-image {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border-radius: 16px;
    margin-bottom: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }

  .description {
    font-size: 13px;
    color: #555;
    text-align: center;
    padding: 0 10px;
    margin-bottom: 20px;
  }

  /* SECTIONS */
  .section {
    margin-bottom: 20px;
    break-inside: avoid;
  }
  .section-title {
    font-size: 15px;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 2px solid #ffe3d6;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .section-icon {
    font-size: 18px;
  }

  /* INGREDIENTS */
  .ingredients-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 16px;
  }
  .ingredient-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    padding: 4px 0;
  }
  .checkbox {
    font-size: 14px;
    color: #ff8c69;
    flex-shrink: 0;
    margin-top: -1px;
  }

  /* INSTRUCTIONS */
  .step-card {
    display: flex;
    gap: 12px;
    padding: 10px 12px;
    background: #fafafa;
    border-radius: 10px;
    margin-bottom: 8px;
    border-left: 3px solid #ff8c69;
  }
  .step-number {
    width: 26px;
    height: 26px;
    background: linear-gradient(135deg, #ff8c69, #e85d75);
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
  }
  .step-text {
    font-size: 12px;
    line-height: 1.5;
    color: #333;
  }

  /* NUTRITION */
  .nutrition-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .nutrition-card {
    text-align: center;
    padding: 10px 6px;
    background: linear-gradient(135deg, #fff5f2, #fff0eb);
    border-radius: 12px;
    border: 1px solid #ffe3d6;
  }
  .nutrition-value {
    font-size: 16px;
    font-weight: 800;
    color: #e85d75;
  }
  .nutrition-label {
    font-size: 9px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  }

  .vitamins-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 10px;
  }
  .vitamin-badge {
    padding: 3px 8px;
    background: #e6f9f0;
    color: #0ca678;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 600;
  }

  /* ALLERGENS */
  .allergens-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .allergen-badge {
    padding: 4px 10px;
    background: #fff3bf;
    color: #e67700;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid #ffd43b;
  }
  .no-allergens {
    font-size: 12px;
    color: #0ca678;
    font-weight: 600;
  }

  /* STORAGE */
  .storage-box {
    padding: 10px 14px;
    background: #f0f4ff;
    border-radius: 10px;
    font-size: 12px;
    color: #4263eb;
    border: 1px solid #dbe4ff;
  }

  /* FOOTER */
  .footer {
    text-align: center;
    padding: 16px 0 8px;
    margin-top: 20px;
    border-top: 2px solid #ffe3d6;
  }
  .footer-text {
    font-size: 11px;
    color: #aaa;
  }
  .footer-brand {
    font-weight: 800;
    background: linear-gradient(135deg, #ff8c69, #e85d75);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  @media print {
    body { background: #fff; }
    .page { padding: 12px; max-width: 100%; }
    .step-card { break-inside: avoid; }
    .section { break-inside: avoid; }
    .nutrition-grid { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="logo-text">🍼 BabyBites</div>
    <div class="logo-sub">Nutritious recipes for little ones</div>
  </div>

  <!-- HERO -->
  <div class="hero">
    <h1 class="recipe-title">${recipe.title}</h1>
    <div class="badge-row">
      <span class="badge badge-age">👶 ${recipe.ageGroup}</span>
      <span class="badge badge-category">📂 ${recipe.category}</span>
      <span class="badge badge-time">⏱ ${recipe.prepTime}</span>
      <span class="badge badge-servings">🍽 ${recipe.servings}</span>
    </div>
    <img src="${recipe.image}" class="recipe-image" alt="${recipe.title}" onerror="this.style.display='none'" />
    <p class="description">${recipe.description}</p>
  </div>

  <!-- INGREDIENTS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">🥕</span> Ingredients</div>
    <div class="ingredients-grid">${ingredientsHTML}</div>
  </div>

  <!-- INSTRUCTIONS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">👩‍🍳</span> Instructions</div>
    ${instructionsHTML}
  </div>

  <!-- NUTRITION -->
  <div class="section">
    <div class="section-title"><span class="section-icon">📊</span> Nutrition</div>
    <div class="nutrition-grid">
      <div class="nutrition-card">
        <div class="nutrition-value">${recipe.nutrition.calories}</div>
        <div class="nutrition-label">Calories</div>
      </div>
      <div class="nutrition-card">
        <div class="nutrition-value">${recipe.nutrition.protein}</div>
        <div class="nutrition-label">Protein</div>
      </div>
      <div class="nutrition-card">
        <div class="nutrition-value">${recipe.nutrition.carbs}</div>
        <div class="nutrition-label">Carbs</div>
      </div>
      <div class="nutrition-card">
        <div class="nutrition-value">${recipe.nutrition.fat}</div>
        <div class="nutrition-label">Fat</div>
      </div>
      <div class="nutrition-card">
        <div class="nutrition-value">${recipe.nutrition.fiber}</div>
        <div class="nutrition-label">Fiber</div>
      </div>
    </div>
    <div class="vitamins-row">${vitaminsHTML}</div>
  </div>

  <!-- ALLERGENS -->
  <div class="section">
    <div class="section-title"><span class="section-icon">⚠️</span> Allergens</div>
    <div class="allergens-row">${allergensHTML}</div>
  </div>

  <!-- STORAGE -->
  <div class="section">
    <div class="section-title"><span class="section-icon">❄️</span> Storage Tips</div>
    <div class="storage-box">${recipe.storage}</div>
  </div>

  ${recipe.healthBenefits ? `
  <div class="section">
    <div class="section-title"><span class="section-icon">💚</span> Health Benefits</div>
    <div class="storage-box" style="background:#e6f9f0;border-color:#96f2d7;color:#0ca678;">${recipe.healthBenefits}</div>
  </div>` : ""}

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-text">Made with love by <span class="footer-brand">BabyBites</span> 💕</div>
  </div>
</div>
</body>
</html>`;

  // Create iframe, write content, and trigger print
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create print document");
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for images/fonts to load, then print
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      // Clean up after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
};
