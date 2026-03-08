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

// Use CSS page-break-before on section wrappers instead of special divs

function buildCoverPage(articleCount: number, categories: string[], today: string): string {
  const badges = categories.map(cat =>
    `<td style="padding:4px;">
      <div style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:11px;font-weight:700;border:2px solid ${CATEGORY_COLORS[cat] || '#6366f1'};color:${CATEGORY_COLORS[cat] || '#6366f1'};">
        ${CATEGORY_ICONS[cat] || '📖'} ${cat}
      </div>
    </td>`
  ).join('');

  return `
    <div style="text-align:center;padding:80px 40px 60px;position:relative;">
      <!-- Decorative border frame -->
      <div style="position:absolute;top:20px;left:20px;right:20px;bottom:20px;border:3px solid #ec4899;border-radius:20px;opacity:0.15;"></div>
      <div style="position:absolute;top:28px;left:28px;right:28px;bottom:28px;border:1px solid #8b5cf6;border-radius:16px;opacity:0.1;"></div>

      <!-- Logo -->
      <table style="margin:0 auto 16px;border-collapse:collapse;">
        <tr>
          <td style="width:90px;height:90px;border-radius:24px;background:linear-gradient(135deg,#ec4899,#8b5cf6);text-align:center;vertical-align:middle;">
            <span style="font-size:44px;">🍼</span>
          </td>
        </tr>
      </table>

      <div style="font-size:14px;font-weight:800;color:#ec4899;letter-spacing:6px;text-transform:uppercase;margin-bottom:40px;">BABYBITES</div>

      <!-- Decorative line -->
      <table style="margin:0 auto 32px;border-collapse:collapse;">
        <tr>
          <td style="width:40px;height:2px;background:#ec4899;"></td>
          <td style="width:16px;"></td>
          <td style="width:8px;height:8px;border-radius:50%;background:#8b5cf6;"></td>
          <td style="width:16px;"></td>
          <td style="width:40px;height:2px;background:#8b5cf6;"></td>
        </tr>
      </table>

      <h1 style="font-size:34px;font-weight:800;color:#1e293b;margin:0 0 8px;line-height:1.2;">Guia Completo de</h1>
      <h1 style="font-size:34px;font-weight:800;color:#ec4899;margin:0 0 20px;line-height:1.2;">Nutrição Infantil</h1>
      <p style="font-size:16px;color:#64748b;margin:0 0 8px;font-style:italic;">Expert Pediatric Nutrition Knowledge Hub</p>
      <p style="font-size:13px;color:#94a3b8;margin:0 0 50px;">Edição ${today}</p>

      <!-- Stats -->
      <table style="margin:0 auto 50px;border-collapse:collapse;">
        <tr>
          <td style="text-align:center;padding:12px 30px;border-right:2px solid #e2e8f0;">
            <div style="font-size:32px;font-weight:800;color:#ec4899;">${articleCount}</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Artigos</div>
          </td>
          <td style="text-align:center;padding:12px 30px;border-right:2px solid #e2e8f0;">
            <div style="font-size:32px;font-weight:800;color:#8b5cf6;">${categories.length}</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">Categorias</div>
          </td>
          <td style="text-align:center;padding:12px 30px;">
            <div style="font-size:32px;">📚</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-top:4px;">eBook</div>
          </td>
        </tr>
      </table>

      <!-- Category badges -->
      <table style="margin:0 auto;border-collapse:collapse;">
        <tr>${badges}</tr>
      </table>
    </div>
  `;
}

function buildIntroPage(): string {
  return `
    <div style="padding:50px 44px;">
      <table style="margin-bottom:30px;border-collapse:collapse;">
        <tr>
          <td style="width:50px;vertical-align:middle;">
            <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#8b5cf6);text-align:center;line-height:42px;">
              <span style="font-size:22px;">📖</span>
            </div>
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <div style="font-size:24px;font-weight:800;color:#1e293b;">Sobre Este Guia</div>
          </td>
        </tr>
      </table>

      <div style="height:3px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:28px;"></div>

      <p style="font-size:13px;line-height:1.8;color:#475569;margin:0 0 18px;">
        Bem-vindo ao <strong style="color:#ec4899;">BabyBites Knowledge Hub</strong> — o seu guia completo e baseado em evidências científicas para a nutrição infantil. Este eBook foi cuidadosamente elaborado para pais, cuidadores e profissionais de saúde que desejam oferecer o melhor início de vida aos seus bebés.
      </p>

      <p style="font-size:13px;line-height:1.8;color:#475569;margin:0 0 18px;">
        Cada artigo foi desenvolvido com base nas mais recentes recomendações de organizações de saúde pediátrica, incluindo a OMS e a AAP, abrangendo temas essenciais como alimentação, saúde, desenvolvimento e sono.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr>
          <td style="width:4px;background:#ec4899;border-radius:2px;"></td>
          <td style="padding:16px 20px;background:#fdf2f8;border-radius:0 10px 10px 0;">
            <div style="font-size:12px;font-weight:700;color:#ec4899;margin-bottom:6px;">💡 Como Utilizar Este Guia</div>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              Navegue pelo Índice para encontrar temas específicos, ou leia sequencialmente para uma formação completa. Cada categoria tem uma página de introdução com código de cores para facilitar a navegação.
            </p>
          </td>
        </tr>
      </table>

      <p style="font-size:13px;line-height:1.8;color:#475569;margin:0 0 18px;">
        Os artigos estão organizados em categorias temáticas, cada uma identificada por uma cor e ícone únicos. Dentro de cada categoria, os pontos-chave são numerados para facilitar a referência e a partilha com o seu pediatra.
      </p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr>
          <td style="width:4px;background:#8b5cf6;border-radius:2px;"></td>
          <td style="padding:16px 20px;background:#f5f3ff;border-radius:0 10px 10px 0;">
            <div style="font-size:12px;font-weight:700;color:#8b5cf6;margin-bottom:6px;">⚠️ Nota Importante</div>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              Este guia é apenas para fins educativos. Consulte sempre o pediatra do seu bebé antes de fazer alterações na alimentação ou rotina. Cada criança é única e as recomendações devem ser adaptadas individualmente.
            </p>
          </td>
        </tr>
      </table>
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
      <tr>
        <td style="padding:5px 0;font-size:12px;color:#475569;border-bottom:1px dotted #e2e8f0;">
          <span style="color:${color};font-weight:700;margin-right:6px;">${globalIndex[a.id]}.</span> ${a.title}
        </td>
      </tr>
    `).join('');

    return `
      <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
        <tr>
          <td style="padding:8px 0 6px;">
            <span style="font-size:14px;margin-right:6px;">${icon}</span>
            <span style="font-size:13px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:1px;">${cat}</span>
            <span style="font-size:11px;color:#94a3b8;margin-left:8px;">(${articles.length} artigos)</span>
          </td>
        </tr>
        ${items}
      </table>
    `;
  }).join('');

  return `
    <div style="padding:40px 44px;">
      <table style="width:100%;margin-bottom:24px;border-collapse:collapse;">
        <tr>
          <td style="width:50px;vertical-align:middle;">
            <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#ec4899,#8b5cf6);text-align:center;line-height:42px;">
              <span style="font-size:22px;">📑</span>
            </div>
          </td>
          <td style="padding-left:14px;vertical-align:middle;">
            <div style="font-size:24px;font-weight:800;color:#1e293b;">Índice</div>
          </td>
        </tr>
      </table>
      <div style="height:3px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:2px;margin-bottom:28px;"></div>
      ${tocSections}
    </div>
  `;
}

function buildCategoryDivider(category: string, count: number): string {
  const color = CATEGORY_COLORS[category] || '#6366f1';
  const icon = CATEGORY_ICONS[category] || '📖';

  return `
    <div style="text-align:center;padding:120px 40px 80px;">
      <table style="margin:0 auto 24px;border-collapse:collapse;">
        <tr>
          <td style="width:80px;height:80px;border-radius:20px;background:${color};text-align:center;vertical-align:middle;">
            <span style="font-size:40px;">${icon}</span>
          </td>
        </tr>
      </table>

      <div style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:4px;margin-bottom:12px;">Categoria</div>
      <div style="font-size:32px;font-weight:800;color:${color};margin-bottom:16px;">${category}</div>

      <table style="margin:0 auto 24px;border-collapse:collapse;">
        <tr>
          <td style="width:30px;height:2px;background:${color};opacity:0.3;"></td>
          <td style="width:12px;"></td>
          <td style="width:8px;height:8px;border-radius:50%;background:${color};"></td>
          <td style="width:12px;"></td>
          <td style="width:30px;height:2px;background:${color};opacity:0.3;"></td>
        </tr>
      </table>

      <div style="font-size:14px;color:#64748b;">${count} artigo${count > 1 ? 's' : ''} nesta secção</div>
    </div>
  `;
}

function buildArticle(article: AdviceArticle, globalNum: number): string {
  const color = CATEGORY_COLORS[article.category] || '#6366f1';

  const contentHtml = article.content.map((p, pi) => `
    <table style="width:100%;margin-bottom:10px;border-collapse:collapse;">
      <tr>
        <td style="width:28px;vertical-align:top;padding-top:3px;">
          <div style="width:22px;height:22px;border-radius:50%;background:${color};text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;">${pi + 1}</div>
        </td>
        <td style="padding-left:10px;font-size:12px;line-height:1.7;color:#475569;vertical-align:top;">${p}</td>
      </tr>
    </table>
  `).join('');

  return `
    <div style="margin-bottom:32px;">
      <!-- Article header -->
      <table style="width:100%;margin-bottom:14px;border-collapse:collapse;">
        <tr>
          <td style="width:44px;vertical-align:middle;">
            <div style="width:38px;height:38px;border-radius:10px;background:${color};text-align:center;line-height:38px;color:white;font-size:16px;font-weight:800;">${globalNum}</div>
          </td>
          <td style="padding-left:12px;vertical-align:middle;">
            <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;">${article.category}</div>
            <div style="font-size:16px;font-weight:800;color:#1e293b;line-height:1.3;">${article.title}</div>
          </td>
        </tr>
      </table>

      <p style="font-size:12px;color:#64748b;font-style:italic;margin:0 0 16px 50px;line-height:1.6;">${article.description}</p>

      <div style="margin-left:50px;">
        ${contentHtml}
      </div>

      <!-- Separator -->
      <table style="width:100%;margin-top:24px;border-collapse:collapse;">
        <tr>
          <td style="height:1px;background:${color};opacity:0.15;"></td>
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
          <td style="width:70px;height:70px;border-radius:20px;background:linear-gradient(135deg,#ec4899,#8b5cf6);text-align:center;vertical-align:middle;">
            <span style="font-size:36px;">🍼</span>
          </td>
        </tr>
      </table>

      <div style="font-size:22px;font-weight:800;color:#ec4899;margin-bottom:8px;">BabyBites</div>
      <div style="font-size:13px;color:#64748b;margin-bottom:40px;">Knowledge Hub — eBook Edition</div>

      <table style="margin:0 auto 40px;border-collapse:collapse;">
        <tr>
          <td style="width:60px;height:2px;background:linear-gradient(to right,#ec4899,#8b5cf6);border-radius:1px;"></td>
        </tr>
      </table>

      <table style="width:80%;margin:0 auto 30px;border-collapse:collapse;">
        <tr>
          <td style="padding:20px 24px;background:#fdf2f8;border-radius:12px;text-align:center;">
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0 0 8px;">
              <strong style="color:#ec4899;">Aviso Legal:</strong> Este guia é exclusivamente para fins educativos e informativos. Não substitui aconselhamento médico profissional.
            </p>
            <p style="font-size:12px;line-height:1.7;color:#64748b;margin:0;">
              Consulte sempre o pediatra do seu bebé para orientação personalizada sobre alimentação e saúde infantil.
            </p>
          </td>
        </tr>
      </table>

      <p style="font-size:11px;color:#94a3b8;margin:0 0 6px;">Gerado automaticamente por BabyBites</p>
      <p style="font-size:11px;color:#cbd5e1;margin:0;">${today} • Todos os direitos reservados</p>

      <table style="margin:30px auto 0;border-collapse:collapse;">
        <tr>
          <td style="font-size:20px;padding:0 4px;">💕</td>
          <td style="font-size:11px;color:#94a3b8;font-style:italic;">Feito com amor para os pequeninos</td>
          <td style="font-size:20px;padding:0 4px;">💕</td>
        </tr>
      </table>
    </div>
  `;
}

export const exportAdvicePDF = (articles: AdviceArticle[]) => {
  const today = new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' });
  const categoryOrder = ['Feeding', 'Health', 'Nutrition', 'Development', 'Behavior', 'Tips', 'Sleep'];

  // Group articles by category
  const grouped: Record<string, AdviceArticle[]> = {};
  for (const cat of categoryOrder) {
    const catArticles = articles.filter(a => a.category === cat);
    if (catArticles.length > 0) grouped[cat] = catArticles;
  }

  const categoriesUsed = Object.keys(grouped);

  // Build global index (1-based sequential numbering)
  const globalIndex: Record<number, number> = {};
  let counter = 1;
  for (const cat of categoriesUsed) {
    for (const a of grouped[cat]) {
      globalIndex[a.id] = counter++;
    }
  }

  // Build sections - each major section wrapped with page-break-before
  const wrap = (html: string, forceBreak = false) => 
    `<div style="${forceBreak ? 'page-break-before:always;' : ''}">${html}</div>`;

  const allSections = [
    wrap(buildCoverPage(articles.length, categoriesUsed, today), false),
    wrap(buildIntroPage(), true),
    wrap(buildTOCPage(grouped, globalIndex), true),
  ];

  for (const cat of categoriesUsed) {
    allSections.push(wrap(buildCategoryDivider(cat, grouped[cat].length), true));
    
    const catArticles = grouped[cat];
    const articlesHtml = catArticles.map(a => buildArticle(a, globalIndex[a.id])).join('');
    allSections.push(wrap(`<div style="padding:20px 44px;">${articlesHtml}</div>`, true));
  }

  allSections.push(wrap(buildBackCover(today), true));

  const html = `<div style="font-family:'Segoe UI',system-ui,-apple-system,sans-serif;width:794px;color:#1e293b;background:white;">${allSections.join('')}</div>`;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = html;
  document.body.appendChild(container);

  const opt = {
    margin: [10, 10, 14, 10],
    filename: 'BabyBites-Knowledge-Hub-eBook.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      allowTaint: true,
      logging: false,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  html2pdf()
    .set(opt)
    .from(container.firstElementChild)
    .save()
    .then(() => container.remove())
    .catch((err: Error) => {
      console.error('PDF generation error:', err);
      container.remove();
    });
};
