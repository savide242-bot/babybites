# Plan: 100% Spanish, Smart Gate & Repair Fix

## Problemas a resolver

1. **Cobertura parcial em espanhol** — só algumas páginas (Home, Recipes, RecipeDetail, Settings) foram envolvidas com `useT`. Tudo o resto (Onboarding, MealPlanner, Advice, Bonus, Mistakes, FoodAnalyzer, GrowthTracker, ProgressReports, ShoppingList, Profile, Achievements, FoodDiary, Auth, modais, widgets, navegação, toasts, botões, alertas) continua em inglês.
2. **Bug "Repair App"** — o `AppErrorBoundary` aparece com texto inglês fixo e o botão de "reparar" às vezes dispara em situações não-críticas (qualquer erro no React = ecrã cheio). Precisa ser menos agressivo + traduzido.
3. **Language gate força utilizadores existentes a escolher** — `localStorage.language_chosen` é por dispositivo, então quem fizer logout / abrir noutro browser cai sempre no `/language`. Não queres isso.

## Estratégia (a parte importante)

Traduzir manualmente ~30 ficheiros com centenas de strings cada é inviável e vai ficar sempre incompleto. Vou usar uma **camada de tradução automática DOM-level** combinada com o dicionário estático que já existe.

### Como funciona

- Novo componente raiz **`AutoTranslateLayer`** que envolve a app inteira.
- Quando o idioma activo é `es`:
  1. Faz scan dos nós de texto visíveis no DOM (via `MutationObserver`).
  2. Recolhe strings inglesas únicas (ignora números, emails, URLs, código).
  3. Manda em batch para a edge function `translate-content` (que já existe e já tem cache em DB).
  4. Substitui o `textContent` do nó pela tradução.
  5. Cache em `localStorage` (`auto_tx_es`) → segunda visita = instantâneo, sem flicker.
- Quando o idioma é `en` → não faz nada (zero overhead).
- Atributos especiais traduzidos também: `placeholder`, `aria-label`, `title`, `alt`.
- Excluímos nós marcados com `data-no-translate` (nomes próprios, marcas, código).

### Vantagens

- Cobertura **100%** automática, incluindo páginas e componentes que ainda não tocámos e os que vierem a ser adicionados no futuro.
- Custo único: cada string nova é traduzida 1× e fica em cache permanente (DB + localStorage).
- Não tenho de re-tocar 30 ficheiros nem manter um dicionário gigantesco.
- O dicionário estático actual continua a funcionar (tem prioridade) — usado para strings de alto tráfego onde queremos controlo total da tradução.

### Limitações honestas

- Primeira visita em espanhol numa página nova: pode haver ~300-800 ms onde texto inglês aparece antes da tradução chegar (mostro um overlay de "Cargando idioma..." apenas na 1ª vez por sessão).
- Nomes próprios (Emily Harter, BabyBites, marcas) ficam em inglês — a edge function já tem instrução para os preservar.
- Conteúdo dentro de `<canvas>` ou imagens não é traduzido (esperado).

## Mudanças concretas

### 1. Smart language gate (`src/App.tsx`)

```text
Regra nova:
- Se há sessão Supabase activa → ler language das user_preferences → usar e NUNCA mostrar /language.
- Se não há sessão E localStorage.app_language existe → usar esse, ir direto para /auth.
- Se não há sessão E não há localStorage → mostrar /language (apenas novos utilizadores reais).
- Logout NÃO apaga app_language.
```

Remove `language_chosen` flag — passa a usar a presença de `app_language` directamente.

### 2. Camada de auto-tradução

**Novo:** `src/components/AutoTranslateLayer.tsx`
- `MutationObserver` no `<body>`.
- Walker de TextNodes; filtra: vazio, só símbolos, só números, dentro de `<script>/<style>/<code>/<pre>`, ou ancestor com `data-no-translate`.
- Debounce 200 ms; agrupa strings únicas em batches de 40.
- Chama `supabase.functions.invoke('translate-content', { items, targetLanguage: 'es' })`.
- Aplica `node.textContent = translation` preservando whitespace.
- Também processa atributos: `placeholder`, `aria-label`, `title`, `alt` (selector global por página).
- Cache local em `localStorage['auto_tx_es']` (Map serializado, com tamanho máximo ~5 MB / LRU simples).
- Hook `useAutoTranslate()` exposto para forçar re-scan após navegação.

**Editado:** `src/App.tsx` — envolver `<AppContent />` com `<AutoTranslateLayer>`.

### 3. Edge function `translate-content` — pequenos ajustes

- Aceitar batches maiores (até 80 itens) e textos curtos sem desperdiçar tokens.
- Adicionar instrução ao system prompt: "If the input is already Spanish, return it as-is. Never translate proper nouns or brand names." (evita re-traduzir e estragar.)

### 4. Dicionário estático ampliado (`src/hooks/useLanguage.tsx`)

- Manter como está — o auto-translate complementa, não substitui.
- Adicionar chaves para o `AppErrorBoundary` (próximo ponto).

### 5. Fix `AppErrorBoundary` ("Repair App" bug)

- Traduzir todas as strings via `t('error.somethingWrong')` etc.
- Tornar o botão "Repair App" menos visível por defeito: só aparece se o mesmo erro acontecer 2× seguidas (counter em `sessionStorage`). Primeira vez mostra apenas "Recargar".
- Garantir que `performPWARecovery` não fica preso (timeout 8 s + fallback para reload).
- Suprimir o boundary para erros conhecidos não-fatais (chunk load errors → recarregar silenciosamente em vez de mostrar ecrã de erro).

### 6. `LanguageChoice.tsx` — pequenos ajustes

- Após escolher → guardar em `app_language`, ir para `/auth`.
- Remover dependência de `language_chosen`.

## Ficheiros tocados

**Novos:**
- `src/components/AutoTranslateLayer.tsx`
- `src/hooks/useAutoTranslate.tsx`

**Editados:**
- `src/App.tsx` (gate + envolver AutoTranslateLayer)
- `src/components/AppErrorBoundary.tsx` (traduzido + bug fix)
- `src/hooks/useLanguage.tsx` (mais chaves para errors + helper para auto cache)
- `src/pages/LanguageChoice.tsx` (limpar flag antiga)
- `supabase/functions/translate-content/index.ts` (prompt mais robusto + batch maior)

**Sem mudanças nos restantes 100+ ficheiros** — a camada de auto-tradução trata deles em runtime.

## Custo / performance

- 1ª vez que um user espanhol abre uma página: 1 chamada à edge function (300-800 ms) → depois cache permanente.
- Páginas seguintes: 0 chamadas se as strings já estiverem em cache.
- Estimativa total para traduzir o app inteiro: ~$1-3 USD em créditos Lovable AI, pago uma vez por toda a base de utilizadores (cache em DB partilhada).

## Ordem de execução

1. Ajustar edge function (prompt + batch).
2. Criar `AutoTranslateLayer` + hook.
3. Corrigir gate em `App.tsx` + `LanguageChoice`.
4. Corrigir e traduzir `AppErrorBoundary`.
5. Smoke test: abrir app em espanhol, navegar Home → Recipes → MealPlanner → Advice → Settings, confirmar que tudo aparece traduzido após o primeiro scan.

Confirmas para avançar?