# Plano — Remover bónus pós-parto + Resolver lentidão

## 1. Remover "Postpartum Recovery Guide" do Bónus

Em `src/pages/Bonus.tsx`:
- Remover o import de `postpartumRecoveryGuide`.
- Remover os tipos de view `'recovery-list'` e `'recovery-detail'`.
- Remover o card "Postpartum Recovery Guide" do hub (linha 117).
- Remover as funções `renderRecoveryList()` e `renderRecoveryDetail()` e os respectivos `case` no switch.

Apagar o ficheiro `src/data/postpartumRecoveryGuide.ts` (já não é usado).

A VSL atualizada continua a mencionar bónus, mas o utilizador pediu explicitamente para remover este. Os outros bónus (checklists, menus, picky eater) ficam intactos.

## 2. Resolver lentidão na navegação entre abas

### Causa raiz
O ficheiro `src/data/recipes.ts` agrega ~395 receitas em **13.142 linhas** distribuídas por 14 ficheiros (`recipes47-100`, `recipes101-150`, … `recipes346-395`). Está a ser **importado estaticamente** em `Home.tsx` (`import { recipes } from "@/data/recipes"`) e em várias outras páginas. Resultado:

- O chunk inicial carregado pelo `Home` arrasta toda a base de receitas mesmo quando o utilizador só quer ver o dashboard.
- Como cada página (`Recipes`, `MealPlanner`, `RecipeDetail`, `Favorites`, `ShoppingList`, etc.) também importa estaticamente, o bundler junta-as no mesmo chunk partilhado, tornando cada navegação lenta na primeira visita.
- Adicionalmente o `useEffect` do `Home` corre `recipes.filter(...)` em todo o array a cada montagem.

### Correções

**A. Code-splitting do dataset de receitas**

- Converter `src/data/recipes.ts` para fazer **dynamic import** dos chunks `recipes47-100` … `recipes346-395`. Exportar:
  - `recipes` (array sincrono apenas com as ~46 receitas base que já vivem em `recipes.ts`/`additionalRecipes`) — usado para previews leves no Home.
  - `loadAllRecipes()` — async, devolve o array completo. Usa `Promise.all` com `import()` dinâmico só quando chamado.
  - `getRecipeById(id)` — async, carrega chunks sob demanda.
- Páginas que precisam do dataset completo (`Recipes`, `MealPlanner`, `RecipeDetail`, `Favorites`, `ShoppingList`, `WhatToCookWidget`) passam a chamar `loadAllRecipes()` dentro de um `useEffect`, com skeleton enquanto carrega.
- `Home.tsx`: trocar `import { recipes }` para usar apenas o subset leve (ou carregar lazy só o que precisa para o "Recipe of the Day" / contagem semanal).

**B. Fixar o erro do Service Worker em produção**

O log mostra que o erro do SW continua a aparecer (`script resource is behind a redirect`). Aplicar:
- Em `src/hooks/useServiceWorkerUpdate.tsx`: garantir que o `try/catch` engole TODOS os erros (não só os com keyword "redirect"), porque alguns browsers devolvem `TypeError` genérico.
- Verificar se o `setInterval` de 5min foi efetivamente aplicado.

**C. Pequenos ganhos**
- Garantir que `WhatToCookWidget`, `RecipeOfTheDay` e outros widgets do Home não disparam queries pesadas em paralelo no primeiro render — encadear ou adiar com `requestIdleCallback`.

### Resultado esperado
- Bundle inicial baixa significativamente (estimativa: -200/-400 KB gzipped).
- Navegar para Recipes/Planner mostra skeleton imediato em vez de freeze.
- Erro do SW deixa de poluir a consola.

## 3. Resumo do que foi adicionado nas mensagens anteriores

Para responder ao ponto 3 do utilizador, listar no chat (não em código):

1. **Persona Emily Harter** — substituiu "Dr. NutriExpert" em `WelcomeModal`, `WhatsAppButton`, `Bonus`, com a sua abordagem clínica.
2. **Página `/mistakes` — "The 3 Hidden Mistakes"** (`src/pages/MistakesGuide.tsx` + `src/data/hiddenMistakes.ts`):
   - Erro 1: Ferro + Cálcio juntos (aveia+leite, espinafre+queijo).
   - Erro 2: Doces antes da refeição principal.
   - Erro 3: Janela de texturas 8–10 meses.
   Cada erro com base científica (OMS, AAP), exemplos do dia-a-dia e correção prática.
3. **Smart Combination Warning** (`src/components/SmartCombinationWarning.tsx`) — widget no Recipe Detail que detecta combinações que bloqueiam absorção (ferro vs cálcio) ou reforçam (vitamina C + ferro) e mostra aviso em tempo real.
4. **CTA na Home** — banner para a nova secção dos 3 erros.
5. **Correções técnicas do Service Worker**:
   - Removidas meta tags `Cache-Control/Pragma/Expires` do `index.html`.
   - `useServiceWorkerUpdate` engole erros de redirect e o intervalo subiu de 60s → 5min.
   - `vite.config.ts` com `injectRegister: 'script'`.

## Ficheiros a tocar

- `src/pages/Bonus.tsx` (remover secção pós-parto)
- `src/data/postpartumRecoveryGuide.ts` (apagar)
- `src/data/recipes.ts` + `Home.tsx`, `Recipes.tsx`, `MealPlanner.tsx`, `RecipeDetail.tsx`, `Favorites.tsx`, `ShoppingList.tsx`, `WhatToCookWidget.tsx` (lazy loading do dataset)
- `src/hooks/useServiceWorkerUpdate.tsx` (catch genérico)

## Fora de escopo
- Não mexer em design / branding.
- Não mexer em edge functions.
- Sem migrações de DB.
