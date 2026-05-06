## Objetivo
App 100% bilingue (Inglês / Espanhol). Escolha de idioma antes do login, persistente. Tudo traduzido — UI estática + conteúdo dinâmico (receitas, conselhos, dicas, notificações).

## Arquitetura

### 1. Seleção de idioma (novo ecrã)
- Nova rota `/language` mostrada **antes** de `/auth` se o user nunca escolheu.
- 2 botões grandes: 🇺🇸 English / 🇪🇸 Español
- Guarda em `localStorage` (`app_language`) + sincroniza com DB (`user_preferences.language`) após login.
- Após escolha → redireciona para `/auth`.
- Users existentes: mantêm inglês por defeito; podem mudar em **Definições → Idioma**.

### 2. UI estática (botões, menus, títulos)
- Sistema i18n simples baseado em ficheiros: `src/i18n/en.ts` e `src/i18n/es.ts` com chaves planas.
- Hook `useT()` devolve string traduzida com base no idioma activo (`useLanguage` já existe).
- Tradução das ~800-1200 chaves da UI feita por mim usando o script Lovable AI Gateway num só batch (Gemini 3 Flash).

### 3. Conteúdo dinâmico (receitas, conselhos, hidden mistakes, dicas, etc.)
**Estratégia: tradução on-demand com cache em DB.**

- Nova tabela `content_translations`:
  - `content_key` (ex: `recipe:42:title`, `recipe:42:instructions`)
  - `language` (`en` | `es`)
  - `translated_text`
  - índice único `(content_key, language)`

- Edge function `translate-content`:
  - Recebe lista de `{key, sourceText}` + `targetLanguage`.
  - Verifica cache na DB → traduz só os que faltam via Lovable AI (Gemini 3 Flash, batch).
  - Devolve mapa `{key: translatedText}`.

- Hook `useTranslatedContent(items)` no frontend:
  - Se idioma = inglês → devolve original (zero custo).
  - Se espanhol → consulta cache local (React Query), pede ao edge function o que falta, mostra skeleton enquanto carrega.

- **Pré-tradução em background**: ao escolher espanhol pela 1ª vez, dispara um job que traduz as 395 receitas em batches (sem bloquear UI). Próximas visitas são instantâneas.

### 4. Notificações & emails
- Push notifications (edge functions): leem `user_preferences.language` → enviam template traduzido.
- Templates de email idem.

### 5. Definições
- Adicionar secção **Idioma / Language** em `Settings.tsx` com 2 opções.

## Ficheiros principais

**Novos:**
- `src/pages/LanguageChoice.tsx` (ecrã de escolha)
- `src/i18n/en.ts`, `src/i18n/es.ts`, `src/i18n/index.ts`, `src/i18n/useT.ts`
- `src/hooks/useTranslatedContent.tsx`
- `supabase/functions/translate-content/index.ts`
- Migração: tabela `content_translations`

**Editados:**
- `src/App.tsx` — gate de idioma antes de `/auth`
- `src/hooks/useLanguage.tsx` — passa a suportar `en` + `es` (hoje só tem `en`)
- `src/pages/Auth.tsx`, `Onboarding`, `Home`, `Recipes`, `RecipeDetail`, `MealPlanner`, `Advice`, `Bonus`, `MistakesGuide`, `Settings`, `Header`, `BottomNavigation`, `WelcomeModal`, `WhatsAppButton`, etc. — substituir strings hardcoded por `t('chave')`
- Edge functions de notificação — ler idioma do user

## Custo / tempo
- UI estática: ~5 min de tradução IA, custo desprezável.
- Receitas (395 × ~3 campos): primeira tradução custa créditos Lovable AI (estimativa: ~$2-5 USD em Gemini Flash). Depois é tudo cache, custo zero.
- Conselhos (31 artigos longos): ~$1 USD.

## Limitações honestas
- A primeira vez que um user espanhol abre uma receita nova pode ver 1-2 segundos de skeleton enquanto traduz (depois fica em cache permanente).
- Termos médicos/nutricionais: Gemini é bom, mas pode haver pequenos refinamentos a fazer manualmente em Definições > Admin.
- Não vou traduzir nomes próprios (Emily Harter, BabyBites, marcas de comida).

## Ordem de execução
1. Migração DB (tabela `content_translations` + coluna `language` em `user_preferences` se não existir)
2. Edge function `translate-content`
3. Sistema i18n + ficheiros EN/ES de UI
4. Ecrã `/language` + gate em `App.tsx`
5. Substituir strings em todas as páginas principais
6. Hook `useTranslatedContent` aplicado em receitas, conselhos, mistakes
7. Definições com toggle de idioma
8. Notificações multilíngue

Confirmas para avançar?