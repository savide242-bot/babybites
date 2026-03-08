// Premium Advice eBook PDF — clean page-per-article layout

interface AdviceArticle {
  id: number;
  title: string;
  description: string;
  category: string;
  content: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Feeding: '#ec4899',
  Health: '#ef4444',
  Nutrition: '#8b5cf6',
  Development: '#06b6d4',
  Behavior: '#f43f5e',
  Tips: '#64748b',
  Sleep: '#6366f1',
};

const CATEGORY_ICONS: Record<string, string> = {
  Feeding: '🍼',
  Health: '❤️',
  Nutrition: '🥦',
  Development: '🧒',
  Behavior: '🧠',
  Tips: '💡',
  Sleep: '🌙',
};

// ──────────────────────────────────────────────
// COVER PAGE
// ──────────────────────────────────────────────
function buildCoverPage(articleCount: number, categories: string[], today: string): string {
  const badges = categories.map(cat =>
    `<span style="display:inline-block;padding:10px 22px;border-radius:30px;font-size:12px;font-weight:700;background:${CATEGORY_COLORS[cat] || '#6366f1'}12;color:${CATEGORY_COLORS[cat] || '#6366f1'};border:2px solid ${CATEGORY_COLORS[cat] || '#6366f1'}40;margin:5px;letter-spacing:0.5px;">
      ${CATEGORY_ICONS[cat] || '📖'} ${cat}
    </span>`
  ).join('');

  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff5f7 0%,#ffffff 40%,#f5f3ff 100%);">
      <div style="position:absolute;top:24px;left:24px;right:24px;bottom:24px;border:2px solid #ec489920;border-radius:28px;pointer-events:none;"></div>

      <div style="width:110px;height:110px;border-radius:30px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 12px 40px #ec489930;">
        <span style="font-size:54px;">🍼</span>
      </div>

      <div style="font-size:13px;font-weight:800;color:#ec4899;letter-spacing:10px;text-transform:uppercase;margin-bottom:10px;">BABYBITES</div>
      <div style="width:60px;height:1px;background:linear-gradient(to right,#ec4899,#8b5cf6);margin:0 auto 40px;"></div>

      <h1 style="font-size:44px;font-weight:900;color:#0f172a;margin:0 0 6px;line-height:1.15;letter-spacing:-1px;">The Complete Guide to</h1>
      <h1 style="font-size:44px;font-weight:900;background:linear-gradient(135deg,#ec4899,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:0 0 16px;line-height:1.15;letter-spacing:-1px;">Baby Nutrition</h1>
      <p style="font-size:15px;color:#64748b;margin:0 0 6px;font-style:italic;">Expert Pediatric Nutrition Knowledge Hub</p>
      <p style="font-size:12px;color:#94a3b8;margin:0 0 44px;font-weight:500;">${today} Edition</p>

      <div style="display:flex;justify-content:center;gap:44px;margin-bottom:44px;">
        <div style="text-align:center;">
          <div style="font-size:38px;font-weight:900;color:#ec4899;line-height:1;">${articleCount}</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Articles</div>
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,transparent,#e2e8f0,transparent);"></div>
        <div style="text-align:center;">
          <div style="font-size:38px;font-weight:900;color:#8b5cf6;line-height:1;">${categories.length}</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">Categories</div>
        </div>
        <div style="width:1px;background:linear-gradient(to bottom,transparent,#e2e8f0,transparent);"></div>
        <div style="text-align:center;">
          <div style="font-size:38px;line-height:1;">📚</div>
          <div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:700;">eBook</div>
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
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
        <div style="width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px #ec489925;">
          <span style="font-size:26px;">📖</span>
        </div>
        <div>
          <h2 style="font-size:24px;font-weight:800;color:#0f172a;margin:0;">About This Guide</h2>
          <p style="font-size:10px;color:#94a3b8;margin:4px 0 0;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Evidence-Based Baby Nutrition</p>
        </div>
      </div>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:26px;"></div>

      <p style="font-size:13.5px;line-height:1.9;color:#475569;margin:0 0 16px;">
        Welcome to the <strong style="color:#ec4899;">BabyBites Knowledge Hub</strong> — your comprehensive, evidence-based guide to infant nutrition. This eBook has been carefully crafted for parents, caregivers, and health professionals.
      </p>
      <p style="font-size:13.5px;line-height:1.9;color:#475569;margin:0 0 22px;">
        Every article is developed based on the latest recommendations from leading pediatric health organizations, including the WHO and AAP.
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px;">
        <div style="border-left:4px solid #ec4899;background:linear-gradient(135deg,#fdf2f8,#fff5f7);border-radius:0 12px 12px 0;padding:16px 18px;">
          <div style="font-size:11px;font-weight:800;color:#ec4899;margin-bottom:5px;">💡 How to Use</div>
          <p style="font-size:10.5px;line-height:1.65;color:#64748b;margin:0;">Browse by category. Each article includes numbered key points for easy reference and sharing with your pediatrician.</p>
        </div>
        <div style="border-left:4px solid #8b5cf6;background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:0 12px 12px 0;padding:16px 18px;">
          <div style="font-size:11px;font-weight:800;color:#8b5cf6;margin-bottom:5px;">⚠️ Important</div>
          <p style="font-size:10.5px;line-height:1.65;color:#64748b;margin:0;">This guide is for educational purposes only. Always consult your pediatrician before making changes to your baby's diet.</p>
        </div>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// TABLE OF CONTENTS
// ──────────────────────────────────────────────
function buildTOCPage(groupedArticles: Record<string, AdviceArticle[]>, globalIndex: Record<number, number>): string {
  const categories = Object.keys(groupedArticles);

  const tocSections = categories.map(cat => {
    const color = CATEGORY_COLORS[cat] || '#6366f1';
    const icon = CATEGORY_ICONS[cat] || '📖';
    const articles = groupedArticles[cat];

    const items = articles.map(a => `
      <div style="display:flex;align-items:baseline;padding:3px 0;border-bottom:1px dotted #f1f5f9;">
        <span style="color:${color};font-weight:700;margin-right:6px;min-width:22px;font-size:10px;">${globalIndex[a.id]}.</span>
        <span style="font-size:11px;color:#475569;flex:1;">${a.title}</span>
      </div>
    `).join('');

    return `
      <div style="margin-bottom:18px;break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0 5px;border-bottom:2px solid ${color}20;">
          <span style="font-size:14px;">${icon}</span>
          <span style="font-size:12px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;">${cat}</span>
          <span style="font-size:10px;color:#94a3b8;margin-left:auto;">${articles.length} article${articles.length > 1 ? 's' : ''}</span>
        </div>
        ${items}
      </div>
    `;
  }).join('');

  return `
    <div class="content-page">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
        <div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px #ec489925;">
          <span style="font-size:22px;">📑</span>
        </div>
        <h2 style="font-size:24px;font-weight:800;color:#0f172a;margin:0;">Table of Contents</h2>
      </div>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:22px;"></div>
      ${tocSections}
    </div>
  `;
}

// ──────────────────────────────────────────────
// CATEGORY DIVIDER
// ──────────────────────────────────────────────
function buildCategoryDivider(category: string, count: number): string {
  const color = CATEGORY_COLORS[category] || '#6366f1';
  const icon = CATEGORY_ICONS[category] || '📖';

  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,${color}06 0%,white 50%,${color}04 100%);">
      <div style="width:100px;height:100px;border-radius:28px;background:linear-gradient(135deg,${color},${color}cc);display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 12px 40px ${color}35;">
        <span style="font-size:50px;">${icon}</span>
      </div>

      <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;letter-spacing:6px;margin-bottom:10px;">Chapter</div>
      <div style="font-size:40px;font-weight:900;color:${color};margin-bottom:18px;letter-spacing:-1px;">${category}</div>

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:22px;">
        <div style="width:40px;height:2px;background:${color};opacity:0.25;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${color};box-shadow:0 0 12px ${color}50;"></div>
        <div style="width:40px;height:2px;background:${color};opacity:0.25;"></div>
      </div>

      <div style="font-size:16px;color:#475569;font-weight:700;">${count} article${count > 1 ? 's' : ''}</div>
      <div style="font-size:11px;color:#94a3b8;margin-top:5px;">in this chapter</div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// ARTICLE PAGE (1 article per page)
// ──────────────────────────────────────────────
function buildArticlePage(article: AdviceArticle, globalNum: number, totalArticles: number): string {
  const color = CATEGORY_COLORS[article.category] || '#6366f1';
  const icon = CATEGORY_ICONS[article.category] || '📖';

  const contentHtml = article.content.map((p, pi) => `
    <div style="display:flex;gap:10px;margin-bottom:10px;">
      <div style="width:22px;height:22px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:10px;font-weight:700;flex-shrink:0;margin-top:2px;">${pi + 1}</div>
      <p style="font-size:12px;line-height:1.8;color:#475569;margin:0;flex:1;">${p}</p>
    </div>
  `).join('');

  return `
    <div class="article-page">
      <!-- Header bar -->
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:2px solid ${color}15;">
        <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,${color},${color}cc);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px ${color}30;">
          <span style="font-size:22px;color:white;font-weight:800;">${globalNum}</span>
        </div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
            <span style="font-size:12px;">${icon}</span>
            <span style="font-size:9px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:2px;">${article.category}</span>
          </div>
          <h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0;line-height:1.25;">${article.title}</h3>
        </div>
      </div>

      <!-- Description -->
      <div style="background:${color}08;border-left:3px solid ${color};border-radius:0 10px 10px 0;padding:12px 16px;margin-bottom:16px;">
        <p style="font-size:11.5px;color:#64748b;font-style:italic;margin:0;line-height:1.7;">${article.description}</p>
      </div>

      <!-- Content -->
      <div style="flex:1;">
        ${contentHtml}
      </div>

      <!-- Footer -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:10px;border-top:1px solid #f1f5f9;">
        <span style="font-size:7.5px;color:#cbd5e1;font-weight:600;">BabyBites Knowledge Hub</span>
        <span style="font-size:7.5px;color:#cbd5e1;font-weight:600;">${article.category}</span>
        <span style="font-size:7.5px;color:#cbd5e1;font-weight:600;">Article ${globalNum} of ${totalArticles}</span>
      </div>
    </div>
  `;
}

// ──────────────────────────────────────────────
// BACK COVER
// ──────────────────────────────────────────────
function buildBackCover(today: string): string {
  return `
    <div class="full-page" style="text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff5f7 0%,#ffffff 50%,#f5f3ff 100%);">
      <div style="width:90px;height:90px;border-radius:24px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;margin-bottom:24px;box-shadow:0 12px 40px #ec489930;">
        <span style="font-size:44px;">🍼</span>
      </div>

      <div style="font-size:26px;font-weight:900;background:linear-gradient(135deg,#ec4899,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px;">BabyBites</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:36px;font-weight:500;">Knowledge Hub — eBook Edition</div>

      <div style="width:60px;height:2px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:1px;margin-bottom:36px;"></div>

      <div style="max-width:420px;padding:22px 28px;background:#fdf2f8;border-radius:16px;margin-bottom:30px;border:1px solid #fce7f3;">
        <p style="font-size:11.5px;line-height:1.75;color:#64748b;margin:0 0 6px;">
          <strong style="color:#ec4899;">Disclaimer:</strong> This guide is exclusively for educational and informational purposes. It does not replace professional medical advice.
        </p>
        <p style="font-size:11.5px;line-height:1.75;color:#64748b;margin:0;">
          Always consult your baby's pediatrician for personalized guidance on feeding and child health.
        </p>
      </div>

      <p style="font-size:10px;color:#94a3b8;margin:0 0 4px;">Generated by BabyBites</p>
      <p style="font-size:10px;color:#cbd5e1;margin:0 0 24px;">${today} · All rights reserved</p>

      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:18px;">💕</span>
        <span style="font-size:10px;color:#94a3b8;font-style:italic;">Made with love for little ones</span>
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

  @page {
    size: A4;
    margin: 10mm 12mm;
  }

  @media print {
    body {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .full-page, .content-page, .article-page {
      page-break-after: always;
    }
  }

  .full-page {
    position: relative;
    min-height: 100vh;
    padding: 40px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  .content-page {
    padding: 40px 44px;
    page-break-after: always;
    page-break-inside: avoid;
  }

  .article-page {
    padding: 30px 40px 20px;
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
export const exportAdvicePDF = (articles: AdviceArticle[]) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const categoryOrder = ['Feeding', 'Health', 'Nutrition', 'Development', 'Behavior', 'Tips', 'Sleep'];

  const grouped: Record<string, AdviceArticle[]> = {};
  for (const cat of categoryOrder) {
    const catArticles = articles.filter(a => a.category === cat);
    if (catArticles.length > 0) grouped[cat] = catArticles;
  }

  const categoriesUsed = Object.keys(grouped);

  const globalIndex: Record<number, number> = {};
  let counter = 1;
  for (const cat of categoriesUsed) {
    for (const a of grouped[cat]) {
      globalIndex[a.id] = counter++;
    }
  }

  const totalArticles = articles.length;

  const sections: string[] = [
    buildCoverPage(totalArticles, categoriesUsed, today),
    buildIntroPage(),
    buildTOCPage(grouped, globalIndex),
  ];

  for (const cat of categoriesUsed) {
    sections.push(buildCategoryDivider(cat, grouped[cat].length));
    // Each article gets its own page — no cramming
    for (const a of grouped[cat]) {
      sections.push(buildArticlePage(a, globalIndex[a.id], totalArticles));
    }
  }

  sections.push(buildBackCover(today));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate the PDF.');
    return;
  }

  printWindow.document.write(`<!DOCTYPE html><html><head><title>BabyBites — Knowledge Hub eBook</title><style>${PRINT_STYLES}</style></head><body>${sections.join('')}</body></html>`);
  printWindow.document.close();

  setTimeout(() => { printWindow.print(); }, 600);
};
