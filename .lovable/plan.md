
# Plano de Correção Completa do BabyBites

## Resumo dos Problemas Encontrados

| Problema | Causa Raiz | Prioridade |
|----------|------------|------------|
| **Reset de senha falha** | URL de redirect não na whitelist + parsing do token | Alta |
| **Notificações não chegam** | Bug na biblioteca web-push + falta de testes reais | Crítica |
| **Design precisa melhorias** | Componentes premium criados mas não aplicados | Média |

---

## Fase 1: Corrigir Reset de Senha (Email chega, link falha)

### Problema
O email de reset é enviado corretamente, mas quando o utilizador clica no link, a página mostra "Invalid or Expired Link".

### Causas Identificadas
1. O `ResetPassword.tsx` tenta extrair tokens do URL hash, mas pode haver um timing issue
2. O evento `PASSWORD_RECOVERY` do Supabase pode não disparar antes do check inicial
3. O fallback para `setSession` pode falhar silenciosamente

### Solução

**Ficheiro: `src/pages/ResetPassword.tsx`**

1. Adicionar delay de 500ms antes de verificar sessão para dar tempo ao Supabase processar o hash
2. Melhorar extração de tokens com suporte a formatos alternativos
3. Adicionar fallback que tenta `supabase.auth.exchangeCodeForSession()` se disponível
4. Mostrar mensagem de "A verificar..." por mais tempo (3s em vez de 1.5s)

```typescript
// Linha ~109: Adicionar delay antes do check
const checkSession = async () => {
  // Aguardar 500ms para Supabase processar hash
  await new Promise(r => setTimeout(r, 500));
  
  // Primeiro tentar set session do URL
  const sessionSet = await setSessionFromUrl();
  // ...resto da lógica
};
```

**Ficheiro: `src/components/auth/ForgotPasswordModal.tsx`**

1. Verificar se o redirect URL está correto para preview e produção
2. Adicionar log do URL completo que será usado

---

## Fase 2: Corrigir Notificações Automáticas de Refeições (CRÍTICO)

### Análise Detalhada

| Componente | Estado | Problema |
|------------|--------|----------|
| Cron Job (pg_cron) | ✅ Funciona | Executa a cada minuto |
| Edge Function (check-meal-reminders) | ✅ Retorna 200 | Código parece correto |
| Lógica de janela (25-35 min) | ⚠️ Questionável | Pode ser muito restritiva |
| Envio real (web-push) | ❌ Suspeito | Nenhuma notificação nos logs |
| notification_logs tabela | ❌ Vazia | Nunca gravou sucesso |

### Problema Real
A biblioteca `web-push@3.6.7` importada via esm.sh pode ter incompatibilidades com Deno, causando falhas silenciosas.

### Solução: Unificar todo o envio usando o módulo `_shared/webpush.ts` nativo

**Ficheiro: `supabase/functions/check-meal-reminders/index.ts`**

1. REMOVER import da biblioteca `web-push` via esm.sh
2. USAR o módulo unificado `_shared/webpush.ts` que já funciona
3. Alargar janela de notificação para 20-40 minutos (mais tolerância)
4. Adicionar logs mais detalhados do resultado de cada envio
5. Garantir que notification_logs é gravado mesmo em caso de erro parcial

```typescript
// REMOVER linha ~86:
// const webpush = await import('https://esm.sh/web-push@3.6.7');

// ADICIONAR import do módulo nativo:
import { sendWebPushNotification, getVapidKeys } from "../_shared/webpush.ts";
```

**Ficheiro: `supabase/functions/_shared/webpush.ts`**

1. Adicionar header `Crypto-Key` que estava em falta em alguns casos
2. Melhorar logging de erros do push service
3. Implementar retry com backoff exponencial (3 tentativas)

---

## Fase 3: Melhorias de Design e Atratividade

### Aplicar Componentes Premium nas Páginas

**Ficheiro: `src/pages/Home.tsx`**

1. Substituir cards simples por `GlassCard`
2. Adicionar `EmotionalHeader` no topo com saudação personalizada
3. Usar `GradientButton` nos CTAs
4. Adicionar `RewardAnimation` quando tarefas são completadas

**Ficheiro: `src/pages/Recipes.tsx`**

1. Cards de receitas com efeito glassmorphism
2. Filtros como chips coloridos
3. Animações suaves de hover (scale + shadow)

**Ficheiro: `src/components/Header.tsx`**

1. Adicionar gradiente dourado subtil
2. Ícones com preenchimento quando ativos
3. Badge de notificações animado

**Ficheiro: `src/components/BottomNavigation.tsx`**

1. Aplicar glassmorphism ao container
2. Ícones com cor da secção quando ativos
3. Animação de transição suave

---

## Fase 4: Diagnóstico e Teste

### Criar Endpoint de Teste Forçado

**Ficheiro NOVO: `supabase/functions/force-test-reminder/index.ts`**

Endpoint que ignora a janela de tempo e envia notificação imediatamente para testar o fluxo completo.

```typescript
// Permite testar o envio real sem esperar pelo horário da refeição
Deno.serve(async (req) => {
  // Buscar primeira subscription do utilizador autenticado
  // Enviar notificação de teste usando módulo unificado
  // Retornar resultado detalhado
});
```

---

## Ficheiros a Modificar

| Ficheiro | Acção | Descrição |
|----------|-------|-----------|
| `src/pages/ResetPassword.tsx` | Modificar | Melhorar timing e extração de token |
| `supabase/functions/check-meal-reminders/index.ts` | Modificar | Usar módulo nativo, alargar janela |
| `supabase/functions/_shared/webpush.ts` | Modificar | Adicionar retry e logging |
| `src/pages/Home.tsx` | Modificar | Aplicar componentes premium |
| `src/pages/Recipes.tsx` | Modificar | Cards com glassmorphism |
| `src/components/Header.tsx` | Modificar | Gradiente e animações |
| `src/components/BottomNavigation.tsx` | Modificar | Glassmorphism e transições |
| `supabase/functions/force-test-reminder/index.ts` | Criar | Endpoint de teste forçado |
| `supabase/config.toml` | Modificar | Adicionar nova função |

---

## Ordem de Implementação

1. **Reset de Senha** - Adicionar delay e melhorar parsing (15 min)
2. **Notificações** - Unificar módulo e alargar janela (30 min)
3. **Endpoint de Teste** - Criar force-test-reminder (15 min)
4. **Design Home** - Aplicar componentes premium (30 min)
5. **Design Receitas** - Cards com efeitos visuais (30 min)
6. **Navegação** - Header e BottomNav melhorados (20 min)

---

## Resultado Esperado

Após implementação:
- ✅ Reset de senha funcional (email → link → nova senha)
- ✅ Notificações de refeição chegam no horário configurado
- ✅ Botão "Testar em Mim" funciona para validação
- ✅ Design premium com conexão emocional
- ✅ Animações e feedback visual consistentes

---

## Nota Técnica: Notificações

O sistema de notificações está arquiteturalmente correto:

```text
pg_cron (minuto a minuto)
    ↓
check-meal-reminders (Edge Function)
    ↓
Verifica baby_meal_times + profiles.timezone
    ↓
Se 25-35 min antes da refeição:
    ↓
sendWebPushNotification()
    ↓
notification_logs (previne duplicados)
```

O problema está na biblioteca `web-push@3.6.7` que não funciona bem no Deno. A solução é usar o módulo nativo `_shared/webpush.ts` que implementa a criptografia AES-128-GCM e VAPID JWT manualmente.
