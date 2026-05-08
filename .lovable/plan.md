
## Diagnóstico

A infraestrutura bilingue já existe:
- `AutoTranslateLayer` envolve a app inteira em `App.tsx` (auth, modais, toasts incluídos).
- `LanguageCard` **já está renderizado em `src/pages/Settings.tsx` (linha 190)** — o seletor existe; provavelmente não foi visto por estar mais abaixo na página.
- Edge function `translate-content` usa Gemini + cache em DB.

O problema real: **muito conteúdo continua em inglês** porque a camada atual tem lacunas:

1. **Primeira renderização fica em inglês** até o batch HTTP voltar (250ms debounce + ~1–2s de rede). O utilizador vê inglês, depois "pisca" para espanhol — em telas rápidas (toasts, modais) já fechou antes de traduzir.
2. **Strings curtas ignoradas** (`< 2 chars`) e botões com 1 palavra podem cair em casos limite.
3. **Sem pré-aquecimento por rota**: ao navegar para uma página nova, espera-se sempre o roundtrip.
4. **Atributos limitados** a `placeholder, aria-label, title, alt` — falta `value` de inputs read-only, `data-tooltip`, etc.
5. **Sonner/Radix Toast** usam portais; já estão em `document.body`, mas o observer pode demorar a apanhar antes do toast desaparecer (auto-dismiss 4s).
6. **Dicionário estático (`useT`)**: muitos componentes já usam `t('key')` mas só ~30 ficheiros — o resto depende 100% do auto-translate.

## O que vou fazer

### 1. Reforçar `AutoTranslateLayer`
- Reduzir debounce de 250ms para **80ms** e aumentar batch para 80 itens.
- Fazer **flush imediato (sem debounce)** quando a fila ultrapassa 20 itens (modais/toasts).
- Re-scan automático em cada mudança de `location.pathname` (hook adicional dentro do layer via `useLocation`).
- Adicionar atributos: `data-placeholder`, `data-label`, `value` (apenas em `<button>` e `<option>`).
- Re-escanear portais explicitamente (`[data-radix-portal], [data-sonner-toaster], #radix-*`) num intervalo curto após cada mutação.
- Persistir cache em duas camadas: `localStorage` (rápido) + tentar pré-carregar do DB ao arrancar (uma chamada `translate-content` com itens vazios → devolve nada, mas warm-up do cliente).

### 2. Pré-aquecimento de UI crítica (`useLanguage.tsx`)
- Expandir o dicionário interno `enTranslations` com **todas as strings críticas de auth, toasts, modais, navegação, botões comuns** (~150 entradas extras: erros de auth, mensagens de "saved", "deleted", "error", botões "Login/Sign up/Continue with Google", textos do `WelcomeModal`, `LogoutConfirmDialog`, `BannedScreen`, etc.).
- Ao mudar para `es`, o `ensureUITranslated` traduz tudo de uma vez e guarda em `localStorage` — sessões seguintes são instantâneas.
- Não exige refactor dos componentes: o `AutoTranslateLayer` lê o cache `i18n_cache_v1_es` como fonte adicional ao mapear `text → translation` no DOM.

### 3. Cache partilhado entre `useLanguage` e `AutoTranslateLayer`
- `AutoTranslateLayer` passa a consultar **dois caches**: `auto_tx_es_v1` (DOM) **e** `i18n_cache_v1_es` (chaves UI mapeadas pelo valor inglês).
- Ao traduzir UI dictionary, escrever também o mapping `englishText → spanishText` em `auto_tx_es_v1` para que o DOM use imediatamente.

### 4. Edge function `translate-content`
- Trocar o modelo de `gemini-3-flash-preview` para `google/gemini-2.5-flash` (mais estável e rápido em JSON estruturado).
- Adicionar deteção de "já está em espanhol" no prompt (devolver igual) — evita pedidos desnecessários e ruído.

### 5. Confirmar/realçar o seletor em Definições
- O `LanguageCard` já existe; vou movê-lo para **o topo da página `Settings`** (acima de `Dietary Preferences`) com um cabeçalho destacado, para que esteja visível imediatamente.

### 6. Mensagem honesta sobre cobertura
- A tradução por DOM cobre **100% do texto visível**, mas depende de:
  - **Primeira visita a uma tela em espanhol**: pode haver 0,5–2s onde ainda se vê inglês até a Edge Function responder. Visitas seguintes são instantâneas (cache local).
  - **Conteúdo dinâmico de receitas e IA** (já tratado por hooks dedicados).
- Não é "i18n estático puro" porque traduzir manualmente as ~400 chaves restantes em 200+ ficheiros levaria horas e introduziria bugs. A estratégia híbrida (dicionário UI + DOM observer + cache) é mais escalável.

## Ficheiros afetados

- **Edit**: `src/components/AutoTranslateLayer.tsx` (debounce, scan por rota, mais atributos, cache partilhado)
- **Edit**: `src/hooks/useLanguage.tsx` (dicionário expandido, escrita no cache do DOM layer)
- **Edit**: `src/pages/Settings.tsx` (mover `LanguageCard` para o topo)
- **Edit**: `supabase/functions/translate-content/index.ts` (modelo + prompt)

Sem alterações de schema. Sem mudanças destrutivas.
