

# Plan: Premium eBook-Style PDF for Knowledge Hub

## What You'll Get

A professionally designed eBook PDF that downloads directly, with:

1. **Cover Page** -- Full-page branded cover with BabyBites logo, title "Guia Completo de Nutrição Infantil", edition date, article count, and a decorative gradient border frame
2. **About This Guide** -- A welcome/introduction page explaining what the eBook covers, who it's for, and how to use it
3. **Table of Contents** -- Clean, organized by category with article numbers and dotted leaders (like a real book)
4. **Category Divider Pages** -- Each category (Feeding, Health, Nutrition, etc.) gets its own styled divider page with the category name, icon, color accent, and count of articles in that section
5. **Article Pages** -- Each article with a styled header (number, category badge, title), description in italic, and numbered paragraphs with colored accent circles
6. **Back Cover** -- Disclaimer, credits, and BabyBites branding

## Key Technical Decisions

- **All table-based layouts** (no flexbox/grid) to avoid html2pdf.js blank page issues
- **Explicit page breaks** using `html2pdf__page-break` divs before: cover→intro, intro→TOC, TOC→first category, each category divider→articles
- **No page breaks between articles** within the same category to avoid excessive blank pages -- natural flow with separator lines
- **Fixed 794px width** matching A4 for html2canvas
- **Articles grouped by category** instead of flat list -- reads like chapters in a book

## File to Modify

- `src/utils/advicePDFExport.ts` -- Complete rewrite with eBook template

## Structure

```text
Page 1:  Cover (logo, title, subtitle, date, badges)
Page 2:  Introduction / About This Guide
Page 3:  Table of Contents (grouped by category)
Page 4:  ── Category Divider: Feeding ──
Page 5+: Feeding articles (flow naturally)
Page N:  ── Category Divider: Health ──
Page N+: Health articles...
  ...
Last:    Back Cover (disclaimer + credits)
```

