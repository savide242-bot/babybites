// Uses browser native print for reliable PDF generation

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

function buildCoverPage(articleCount: number, categories: string[], today: string): string {
  const badges = categories.map(cat =>
    `<span style="display:inline-block;padding:8px 20px;border-radius:24px;font-size:12px;font-weight:700;border:2px solid ${CATEGORY_COLORS[cat] || '#6366f1'};color:${CATEGORY_COLORS[cat] || '#6366f1'};margin:4px;">
      ${CATEGORY_ICONS[cat] || '📖'} ${cat}
    </span>`
  ).join('');

  return `
    <div style="text-align:center;padding:100px 50px 80px;position:relative;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:3px solid #ec4899;border-radius:24px;opacity:0.12;"></div>
      <div style="position:absolute;top:40px;left:40px;right:40px;bottom:40px;border:1.5px solid #8b5cf6;border-radius:18px;opacity:0.08;"></div>

      <div style="width:100px;height:100px;border-radius:28px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
        <span style="font-size:50px;">🍼</span>
      </div>

      <div style="font-size:15px;font-weight:800;color:#ec4899;letter-spacing:8px;text-transform:uppercase;margin-bottom:50px;">BABYBITES</div>

      <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:40px;">
        <div style="width:50px;height:2px;background:#ec4899;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:#8b5cf6;"></div>
        <div style="width:50px;height:2px;background:#8b5cf6;"></div>
      </div>

      <h1 style="font-size:42px;font-weight:800;color:#1e293b;margin:0 0 8px;line-height:1.2;">The Complete Guide to</h1>
      <h1 style="font-size:42px;font-weight:800;color:#ec4899;margin:0 0 24px;line-height:1.2;">Baby Nutrition</h1>
      <p style="font-size:17px;color:#64748b;margin:0 0 8px;font-style:italic;">Expert Pediatric Nutrition Knowledge Hub</p>
      <p style="font-size:14px;color:#94a3b8;margin:0 0 60px;">${today} Edition</p>

      <div style="display:flex;justify-content:center;gap:40px;margin-bottom:60px;">
        <div style="text-align:center;">
          <div style="font-size:36px;font-weight:800;color:#ec4899;">${articleCount}</div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Articles</div>
        </div>
        <div style="width:2px;background:#e2e8f0;"></div>
        <div style="text-align:center;">
          <div style="font-size:36px;font-weight:800;color:#8b5cf6;">${categories.length}</div>
          <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Categories</div>
        </div>
        <div style="width:2px;background:#e2e8f0;"></div>
        <div style="text-align:center;">
          <div style="font-size:36px;">📚</div>
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
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:24px;">📖</span>
        </div>
        <h2 style="font-size:28px;font-weight:800;color:#1e293b;margin:0;">About This Guide</h2>
      </div>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:32px;"></div>

      <p style="font-size:14px;line-height:1.9;color:#475569;margin:0 0 20px;">
        Welcome to the <strong style="color:#ec4899;">BabyBites Knowledge Hub</strong> — your comprehensive, evidence-based guide to infant nutrition. This eBook has been carefully crafted for parents, caregivers, and health professionals who want to give their babies the best start in life.
      </p>

      <p style="font-size:14px;line-height:1.9;color:#475569;margin:0 0 20px;">
        Every article is developed based on the latest recommendations from leading pediatric health organizations, including the WHO and AAP, covering essential topics such as feeding, health, development, and sleep.
      </p>

      <div style="border-left:4px solid #ec4899;background:#fdf2f8;border-radius:0 12px 12px 0;padding:20px 24px;margin:28px 0;">
        <div style="font-size:13px;font-weight:700;color:#ec4899;margin-bottom:8px;">💡 How to Use This Guide</div>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          Browse the Table of Contents to find specific topics, or read sequentially for a complete learning experience. Each category has a color-coded introduction page for easy navigation.
        </p>
      </div>

      <p style="font-size:14px;line-height:1.9;color:#475569;margin:0 0 20px;">
        Articles are organized into thematic categories, each identified by a unique color and icon. Within each category, key points are numbered for easy reference and sharing with your pediatrician.
      </p>

      <div style="border-left:4px solid #8b5cf6;background:#f5f3ff;border-radius:0 12px 12px 0;padding:20px 24px;margin:28px 0;">
        <div style="font-size:13px;font-weight:700;color:#8b5cf6;margin-bottom:8px;">⚠️ Important Note</div>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          This guide is for educational purposes only. Always consult your baby's pediatrician before making changes to their diet or routine. Every child is unique and recommendations should be adapted individually.
        </p>
      </div>
    </div>
  `;
}

function buildTOCPage(groupedArticles: Record<string, AdviceArticle[]>, globalIndex: Record<number, number>): string {
  const categories = Object.keys(groupedArticles);

  const tocSections = categories.map(cat => {
    const color = CATEGORY_COLORS[cat] || '#6366f1';
    const icon = CATEGORY_ICONS[cat] || '📖';
    const articles = groupedArticles[cat];

    const items = articles.map(a => `
      <div style="display:flex;align-items:baseline;padding:6px 0;border-bottom:1px dotted #e2e8f0;">
        <span style="color:${color};font-weight:700;margin-right:8px;min-width:24px;">${globalIndex[a.id]}.</span>
        <span style="font-size:13px;color:#475569;flex:1;">${a.title}</span>
      </div>
    `).join('');

    return `
      <div style="margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:8px;padding:10px 0 8px;">
          <span style="font-size:16px;">${icon}</span>
          <span style="font-size:14px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1.5px;">${cat}</span>
          <span style="font-size:12px;color:#94a3b8;margin-left:8px;">(${articles.length} article${articles.length > 1 ? 's' : ''})</span>
        </div>
        ${items}
      </div>
    `;
  }).join('');

  return `
    <div style="padding:50px 50px;">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;">
        <div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:24px;">📑</span>
        </div>
        <h2 style="font-size:28px;font-weight:800;color:#1e293b;margin:0;">Table of Contents</h2>
      </div>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:32px;"></div>
      ${tocSections}
    </div>
  `;
}

function buildCategoryDivider(category: string, count: number): string {
  const color = CATEGORY_COLORS[category] || '#6366f1';
  const icon = CATEGORY_ICONS[category] || '📖';

  return `
    <div style="text-align:center;padding:140px 50px 100px;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="width:90px;height:90px;border-radius:22px;background:${color};display:flex;align-items:center;justify-content:center;margin-bottom:28px;box-shadow:0 8px 30px ${color}40;">
        <span style="font-size:44px;">${icon}</span>
      </div>

      <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:5px;margin-bottom:14px;">Chapter</div>
      <div style="font-size:36px;font-weight:800;color:${color};margin-bottom:20px;">${category}</div>

      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
        <div style="width:36px;height:2px;background:${color};opacity:0.3;"></div>
        <div style="width:10px;height:10px;border-radius:50%;background:${color};"></div>
        <div style="width:36px;height:2px;background:${color};opacity:0.3;"></div>
      </div>

      <div style="font-size:15px;color:#64748b;">${count} article${count > 1 ? 's' : ''} in this section</div>
    </div>
  `;
}

function buildArticle(article: AdviceArticle, globalNum: number): string {
  const color = CATEGORY_COLORS[article.category] || '#6366f1';

  const contentHtml = article.content.map((p, pi) => `
    <div style="display:flex;gap:12px;margin-bottom:12px;">
      <div style="width:24px;height:24px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;flex-shrink:0;margin-top:2px;">${pi + 1}</div>
      <p style="font-size:13px;line-height:1.8;color:#475569;margin:0;flex:1;">${p}</p>
    </div>
  `).join('');

  return `
    <div style="margin-bottom:36px;page-break-inside:avoid;">
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:16px;">
        <div style="width:42px;height:42px;border-radius:12px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:800;flex-shrink:0;">${globalNum}</div>
        <div>
          <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:2px;margin-bottom:3px;">${article.category}</div>
          <div style="font-size:18px;font-weight:800;color:#1e293b;line-height:1.3;">${article.title}</div>
        </div>
      </div>

      <p style="font-size:13px;color:#64748b;font-style:italic;margin:0 0 18px 56px;line-height:1.7;">${article.description}</p>

      <div style="margin-left:56px;">
        ${contentHtml}
      </div>

      <div style="height:1px;background:linear-gradient(to right,${color}20,${color}08);margin-top:28px;"></div>
    </div>
  `;
}

function buildBackCover(today: string): string {
  return `
    <div style="text-align:center;padding:120px 60px 80px;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <div style="width:80px;height:80px;border-radius:22px;background:linear-gradient(135deg,#ec4899,#8b5cf6);display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
        <span style="font-size:40px;">🍼</span>
      </div>

      <div style="font-size:26px;font-weight:800;color:#ec4899;margin-bottom:8px;">BabyBites</div>
      <div style="font-size:14px;color:#64748b;margin-bottom:50px;">Knowledge Hub — eBook Edition</div>

      <div style="width:70px;height:2px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:1px;margin-bottom:50px;"></div>

      <div style="max-width:500px;padding:24px 32px;background:#fdf2f8;border-radius:16px;margin-bottom:40px;">
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0 0 10px;">
          <strong style="color:#ec4899;">Disclaimer:</strong> This guide is exclusively for educational and informational purposes. It does not replace professional medical advice.
        </p>
        <p style="font-size:13px;line-height:1.8;color:#64748b;margin:0;">
          Always consult your baby's pediatrician for personalized guidance on feeding and child health.
        </p>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;">Generated by BabyBites</p>
      <p style="font-size:12px;color:#cbd5e1;margin:0 0 30px;">${today} • All rights reserved</p>

      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:22px;">💕</span>
        <span style="font-size:12px;color:#94a3b8;font-style:italic;">Made with love for little ones</span>
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
  @page { size: A4; margin: 14mm 12mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .page-break { page-break-before: always; }
`;

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

  const sections: string[] = [
    buildCoverPage(articles.length, categoriesUsed, today),
    `<div class="page-break"></div>`,
    buildIntroPage(),
    `<div class="page-break"></div>`,
    buildTOCPage(grouped, globalIndex),
  ];

  for (const cat of categoriesUsed) {
    sections.push(`<div class="page-break"></div>`);
    sections.push(buildCategoryDivider(cat, grouped[cat].length));
    sections.push(`<div class="page-break"></div>`);
    
    const articlesHtml = grouped[cat].map(a => buildArticle(a, globalIndex[a.id])).join('');
    sections.push(`<div style="padding:30px 50px;">${articlesHtml}</div>`);
  }

  sections.push(`<div class="page-break"></div>`);
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
