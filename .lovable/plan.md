# Plano: Correção SW + Alinhamento Total com a VSL

## Parte 1 — Bug crítico: "Service Worker returned non-2xx" em produção

**Causa raiz:**
- `index.html` tem `<meta http-equiv="Cache-Control" content="no-cache, no-store">` que confunde o registo do SW (a especificação proíbe redirects no script SW e o proxy Lovable revalida com headers próprios).
- `useServiceWorkerUpdate` chama `reg.update()` a cada 60s — quando o `/sw.js` devolve qualquer 3xx (redirect do edge), o browser dispara o erro.
- `injectRegister: 'auto'` regista também via `registerSW.js` que pode entrar em conflito.

**Correções:**
1. Remover as 3 meta tags `Cache-Control / Pragma / Expires` do `<head>` em `index.html` (não controlam SW e são contraproducentes — o proxy Lovable já serve os headers corretos).
2. Em `useServiceWorkerUpdate.tsx`:
   - Engolir silenciosamente erros do tipo `TypeError: ...behind a redirect...` e `script resource is behind a redirect` (são transientes do edge proxy).
   - Aumentar o intervalo de update de 60s → 5min para reduzir ruído.
   - Manter o `controllerchange` reload (essencial para auto-update).
3. Em `vite.config.ts`: trocar `injectRegister: 'auto'` por `'script'` para usar apenas um caminho de registo.

## Parte 2 — Alinhar o app 100% com a VSL

A VSL promete uma **expert chamada Emily Harter** (nutricionista pediátrica) e entregáveis específicos. A maioria já existe, mas há gaps a fechar.

### 2.1 — Persona da Expert (mudança global)

Atualizar todas as referências de "Dr. NutriExpert" para **"Emily Harter, Pediatric Nutritionist"** em:
- `src/components/WhatsAppButton.tsx` e Support flows
- `src/pages/Advice.tsx` (assinatura dos artigos)
- `src/components/auth/WelcomeModal.tsx`
- Qualquer copy que diga "Dr." ou "expert"
- Atualizar memória `mem://brand/voice-and-terminology` para refletir Emily Harter

### 2.2 — Conteúdo educativo dos 3 erros (NOVO)

Criar página/secção **"The 3 Hidden Mistakes"** acessível a partir do Home com 3 cards:
- **Mistake 1:** Iron + Calcium together (oats+milk, spinach+cheese)
- **Mistake 2:** Sweet foods before main meal (fruit/yogurt/juice timing)
- **Mistake 3:** Texture window 8–10 months

Cada card abre detalhe educativo com a base científica (OMS, AAP). Adicionar widget de destaque no Home para captar a mãe na primeira sessão.

### 2.3 — Smart Combination Checker (NOVO — diferencial da VSL)

Pequeno widget no Recipe Detail e no Meal Planner que mostra um aviso quando uma refeição combina **ferro + cálcio** ou tem **doce antes do principal**. Usa tags já existentes em `recipeDietaryTags.ts` + nova lista de alimentos ricos em ferro/cálcio.

### 2.4 — Verificações de entregáveis prometidos

| VSL promete | Estado atual | Ação |
|---|---|---|
| 300+ recipes 6–36m | ✅ Existe (recipes 1–395) | Verificar copy do landing/home diz "300+" |
| Weekly Meal Planner | ✅ Existe | OK |
| Food Safety Scanner (ler rótulo) | ⚠️ FoodAnalyzer existe (analisa pratos), mas VSL fala de **scan de rótulo de produto** | Adicionar modo "Scan Label" ao FoodAnalyzer com prompt específico para ingredientes/idade |
| Growth Tracker + WHO curves | ✅ Existe | OK |
| Exclusive Support Group (Emily responde) | ⚠️ Só WhatsApp button | Garantir que o WhatsApp link e copy reforça "direct line to Emily Harter" |
| Progress Reports nutricionais | ✅ Existe (ProgressReports.tsx) | OK |
| Smart Shopping List | ✅ Existe | OK |
| Phase Expert Tips | ⚠️ Existe via Advice mas não por fase do bebé | Garantir filtro por idade no Advice (já existe baby_age) |
| Bonus: Postpartum Recovery Guide | ❌ NÃO EXISTE | Adicionar 1 secção dentro de `/bonus` com guia simples de recuperação pós-parto (texto/PDF, 5–8 tópicos) |

### 2.5 — Copy & onboarding

- Atualizar `Onboarding` welcome step para mencionar Emily Harter e os "3 erros".
- Atualizar `Home` com banner "Welcome from Emily" no primeiro login.
- Garantir que o tagline em todo lado é coerente com a VSL ("smart food combinations for every phase").

## Tecnicidades

- Migração SQL: nenhuma necessária (usa tabelas existentes).
- Sem novos secrets.
- Sem novas dependências.
- Edge functions: ajuste pequeno em `analyze-food` para suportar modo `label_scan` (ingredientes + idade).

## Ficheiros principais a tocar

- `index.html`, `vite.config.ts`, `src/hooks/useServiceWorkerUpdate.tsx`
- `src/pages/Home.tsx`, `src/pages/Bonus.tsx`, `src/pages/FoodAnalyzer.tsx`, `src/pages/Advice.tsx`
- `src/components/WhatsAppButton.tsx`, `src/components/auth/WelcomeModal.tsx`
- Novo: `src/pages/MistakesGuide.tsx` (ou secção em Advice) + componente `SmartCombinationWarning.tsx`
- Novo: `src/data/postpartumRecoveryGuide.ts`
- `supabase/functions/analyze-food/index.ts` (modo label scan)

## Fora de escopo

- Sistema de pagamento / paywall ($29.99) — não foi pedido.
- Timer de countdown da oferta — pertence à landing, não ao app.
- Mudar layout/aesthetic geral (fica o Premium Gold atual).
