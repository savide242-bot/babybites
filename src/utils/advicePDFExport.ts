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

export const exportAdvicePDF = (articles: AdviceArticle[]) => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const categoriesUsed = [...new Set(articles.map(a => a.category))];

  const tocItems = articles.map((a, i) => `
    <tr>
      <td style="padding:6px 8px 6px 0;font-size:13px;color:#334155;border-bottom:1px dotted #e2e8f0;">${i + 1}. ${a.title}</td>
      <td style="padding:6px 0;font-size:11px;color:#94a3b8;text-align:right;border-bottom:1px dotted #e2e8f0;white-space:nowrap;">${a.category}</td>
    </tr>
  `).join('');

  const articleSections = articles.map((article, idx) => {
    const color = CATEGORY_COLORS[article.category] || '#6366f1';
    const contentHtml = article.content.map((p, pi) => `
      <table style="width:100%;margin-bottom:10px;border-collapse:collapse;">
        <tr>
          <td style="width:28px;vertical-align:top;padding-top:3px;">
            <div style="width:22px;height:22px;border-radius:50%;background:${color};text-align:center;line-height:22px;color:white;font-size:11px;font-weight:700;">${pi + 1}</div>
          </td>
          <td style="padding-left:10px;font-size:12.5px;line-height:1.7;color:#475569;vertical-align:top;">${p}</td>
        </tr>
      </table>
    `).join('');

    return `
      <div style="margin-bottom:28px;page-break-inside:avoid;">
        <table style="width:100%;margin-bottom:14px;border-collapse:collapse;">
          <tr>
            <td style="width:40px;vertical-align:middle;">
              <div style="width:36px;height:36px;border-radius:10px;background:${color};text-align:center;line-height:36px;color:white;font-size:15px;font-weight:800;">${idx + 1}</div>
            </td>
            <td style="padding-left:12px;vertical-align:middle;">
              <div style="font-size:10px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">${article.category}</div>
              <div style="font-size:17px;font-weight:700;color:#1e293b;">${article.title}</div>
            </td>
          </tr>
        </table>
        <p style="font-size:12.5px;color:#64748b;font-style:italic;margin:0 0 14px 48px;">${article.description}</p>
        <div style="margin-left:48px;">
          ${contentHtml}
        </div>
        <div style="height:1px;background:${color}33;margin-top:20px;"></div>
      </div>
    `;
  }).join('');

  const categoriesBadges = categoriesUsed.map(cat => 
    `<span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:600;background:${(CATEGORY_COLORS[cat] || '#6366f1')}22;color:${CATEGORY_COLORS[cat] || '#6366f1'};margin:4px;">${cat}</span>`
  ).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>BabyBites Knowledge Hub</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; color: #1e293b; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .cover-page { page-break-after: always; }
          .toc-page { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      <div class="cover-page" style="text-align:center;padding:100px 40px 60px;min-height:90vh;">
        <div style="width:80px;height:80px;border-radius:24px;background:linear-gradient(135deg,#ec4899,#8b5cf6);margin:0 auto 32px;text-align:center;line-height:80px;">
          <span style="font-size:40px;">🍼</span>
        </div>
        <h1 style="font-size:36px;font-weight:800;color:#ec4899;margin:0 0 12px;">BabyBites</h1>
        <h2 style="font-size:28px;font-weight:700;color:#1e293b;margin:0 0 8px;">Knowledge Hub</h2>
        <p style="font-size:16px;color:#64748b;margin:0 0 40px;">Expert Pediatric Nutrition Guide</p>
        <div style="height:3px;width:60px;background:linear-gradient(to right,#ec4899,#8b5cf6);margin:0 auto 40px;border-radius:2px;"></div>
        <p style="font-size:13px;color:#94a3b8;margin:0 0 4px;">${today}</p>
        <p style="font-size:13px;color:#94a3b8;margin:0 0 40px;">${articles.length} Expert Articles</p>
        <div style="text-align:center;">${categoriesBadges}</div>
      </div>

      <div class="toc-page" style="padding:40px;">
        <h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:0 0 24px;padding-bottom:12px;border-bottom:3px solid #ec4899;">Table of Contents</h2>
        <table style="width:100%;border-collapse:collapse;">${tocItems}</table>
      </div>

      <div style="padding:30px 40px;">
        ${articleSections}
      </div>

      <div style="text-align:center;padding:40px;border-top:2px solid #e2e8f0;margin-top:40px;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 8px;">Generated by BabyBites • ${today}</p>
        <p style="font-size:11px;color:#cbd5e1;margin:0;">This guide is for educational purposes only. Always consult your pediatrician for personalized advice.</p>
      </div>
    </body>
    </html>
  `;

  // Use iframe + print dialog (same proven approach as recipe PDF)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for content to render then trigger print
  setTimeout(() => {
    iframe.contentWindow?.print();
    // Clean up after print dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
};
