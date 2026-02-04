

# Plano de Melhorias Visuais e Correção do BabyBites

## Resumo das 3 Tarefas

| Tarefa | Problema Identificado | Solução |
|--------|----------------------|---------|
| **1. Cor do texto 12-18 months** | `text-mint-foreground` é branco (0 0% 100%) | Mudar para `text-foreground` (cor preta legível) |
| **2. Home Page Premium** | Design funcional mas não espetacular | Redesign completo com conexão emocional forte |
| **3. Imagens de Receitas** | 348 imagens locais já existem; bucket storage vazio | Verificar mapeamento e garantir cada receita tem imagem única |

---

## Tarefa 1: Corrigir Cor do Texto "12-18 months"

### Problema
No ficheiro `src/components/home/AgeCategoryCircles.tsx`, a categoria "12-18 months" usa `text-mint-foreground` que está definido como branco no CSS (`--mint-foreground: 0 0% 100%`), tornando o texto invisível sobre fundo claro.

### Solução
Mudar a cor do texto para `text-foreground` (preto/escuro) que é legível:

```typescript
// Linha 38 em AgeCategoryCircles.tsx
// DE:
textColor: "text-mint-foreground"

// PARA:
textColor: "text-foreground"
```

**Alternativa ainda melhor**: Usar uma cor mais escura do mint para contraste:

```typescript
textColor: "text-emerald-700" // ou criar uma variável CSS nova
```

---

## Tarefa 2: Redesign Premium da Home Page

### Visão Geral
Transformar a Home numa experiência emocional espetacular que cria conexão profunda com as mães.

### Componentes a Melhorar

#### 2.1 Fundo e Atmosfera
```typescript
// ATUAL:
<div className="min-h-screen bg-gradient-to-b from-background via-peach/5 to-background">

// NOVO: Gradiente mais rico e emocional
<div className="min-h-screen bg-gradient-to-br from-peach/20 via-background to-soft-blue/10 relative overflow-hidden">
  {/* Decorative floating orbs */}
  <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
  <div className="absolute bottom-40 right-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}} />
```

#### 2.2 Emotional Header Melhorado
Adicionar mais personalização e empatia:

```typescript
// Mensagens mais emocionais baseadas na hora do dia
const getEmotionalContent = () => {
  const hour = new Date().getHours();
  if (hour < 6) return { 
    greeting: "Early riser", 
    message: "You're amazing for being up early",
    emoji: "🌙✨"
  };
  if (hour < 12) return { 
    greeting: "Good morning", 
    message: `${babyName} is lucky to have you`,
    emoji: "🌅💕"
  };
  if (hour < 15) return { 
    greeting: "Hello sunshine", 
    message: "You're doing incredible today",
    emoji: "☀️🌟"
  };
  if (hour < 18) return { 
    greeting: "Good afternoon", 
    message: "Take a moment to breathe",
    emoji: "🌤️💛"
  };
  if (hour < 21) return { 
    greeting: "Good evening", 
    message: "Another beautiful day with your little one",
    emoji: "🌆💜"
  };
  return { 
    greeting: "Sweet dreams time", 
    message: "Rest well, supermom",
    emoji: "🌙💫"
  };
};
```

#### 2.3 Cards com Mais Impacto Visual

**Recipe of the Day** - Adicionar efeito de destaque:
```typescript
<motion.div 
  className="relative"
  whileHover={{ scale: 1.02 }}
>
  {/* Glow effect behind card */}
  <div className="absolute -inset-1 bg-gradient-to-r from-gold/30 via-primary/20 to-gold/30 rounded-3xl blur-xl opacity-60" />
  
  <GlassCard variant="gold" glow className="relative z-10">
    {/* Sparkle decoration */}
    <motion.div 
      className="absolute -top-2 -right-2"
      animate={{ rotate: 360, scale: [1, 1.2, 1] }}
      transition={{ duration: 3, repeat: Infinity }}
    >
      <Sparkles className="w-6 h-6 text-gold" />
    </motion.div>
    <DailyActionCard ... />
  </GlassCard>
</motion.div>
```

#### 2.4 Quick Check-in com Mais Emoção

Adicionar ícones animados e cores mais vibrantes:
```typescript
// Botões com gradientes e animações
<motion.button
  className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-mint/20 via-mint/10 to-secondary/10 border-2 border-mint/30"
  whileHover={{ 
    scale: 1.05, 
    boxShadow: "0 8px 30px hsl(var(--mint) / 0.3)" 
  }}
  whileTap={{ scale: 0.95 }}
>
  {/* Shimmer effect on hover */}
  <motion.div 
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    animate={{ x: [-200, 200] }}
    transition={{ duration: 2, repeat: Infinity }}
  />
  ...
</motion.button>
```

#### 2.5 Weekly Progress com Celebração Visual

Adicionar animações de conquista:
```typescript
// Quando streak é alto, mostrar efeito de fogo
{currentStreak >= 7 && (
  <motion.div 
    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
    animate={{ 
      y: [0, -5, 0], 
      scale: [1, 1.1, 1] 
    }}
    transition={{ duration: 1, repeat: Infinity }}
  >
    <span className="text-3xl">🔥</span>
  </motion.div>
)}
```

#### 2.6 Age Category Circles Premium

Tornar mais atraente e interativo:
```typescript
// Adicionar gradiente de fundo animado
<div className="relative py-4">
  {/* Decorative line */}
  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
  
  {/* Circles com sombra colorida */}
  <motion.div
    className={`w-18 h-18 rounded-full flex items-center justify-center shadow-[0_8px_30px_-4px_hsl(var(--${color})/0.4)]`}
  >
```

### Estrutura Visual Proposta

```
┌─────────────────────────────────────┐
│  🌅 Good morning, Maria! 💕        │
│  Sofia is lucky to have you        │
│  ┌──────────────────────┐          │
│  │ 🔥 7 days streak!   │          │
│  └──────────────────────┘          │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🥣  │ │ 🥕  │ │ 🍝  │ │ 🥗  │  │ ← Age Categories
│  │6-9m │ │9-12m│ │12-18│ │18-24│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
├─────────────────────────────────────┤
│  ✨ Recipe of the Day              │
│  ┌─────────────────────────────┐   │
│  │ 📸 [Beautiful Food Photo]  │   │
│  │ "Spinach & Apple Surprise"  │   │
│  │ ⏱️ 15 min • 🥗 Healthy     │   │
│  │      [ Cook for Sofia 👶 ]  │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  💚 How did Sofia eat today?       │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │ ✓  │  │ ✗  │  │ ✨ │        │
│  │Ate  │  │Rejec│  │New!│        │
│  │Well │  │ted  │  │    │        │
│  └─────┘  └─────┘  └─────┘        │
├─────────────────────────────────────┤
│  📊 Weekly Progress                 │
│  ┌─────────────────────────────┐   │
│  │ 🔥 7 Days  │  🏆 450 pts   │   │
│  │ ⭐ One week on fire!       │   │
│  │ ┌────────────────┐         │   │
│  │ │ 🍽️ 12/14 meals │         │   │
│  │ └────────────────┘         │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Tarefa 3: Verificar e Corrigir Imagens de Receitas

### Estado Atual
- **348 imagens** existem em `src/assets/recipes/`
- **300 receitas** precisam de imagens únicas
- `recipeImageMap` mapeia IDs 1-300 para imagens
- Bucket `recipe-images` está **vazio** (0 imagens armazenadas)
- Função `generate-recipe-image` existe e funciona com Lovable AI

### Problema Potencial
Algumas receitas podem estar a usar a mesma imagem (fallback para `sweetPotatoCarrot`) se o mapeamento falhar.

### Solução

#### Passo 1: Auditar Mapeamento
Verificar se todas as 300 receitas têm imagem única no `recipeImageMap`:

```typescript
// Criar função de auditoria temporária
const auditImages = () => {
  const usedImages = new Set();
  const duplicates: string[] = [];
  
  for (const [id, image] of Object.entries(recipeImageMap)) {
    if (usedImages.has(image)) {
      duplicates.push(`ID ${id} uses duplicate image`);
    }
    usedImages.add(image);
  }
  
  console.log(`Unique images: ${usedImages.size}/300`);
  console.log(`Duplicates: ${duplicates.length}`);
};
```

#### Passo 2: Gerar Imagens em Falta
Para receitas sem imagem única, usar a edge function `generate-recipe-image`:

```typescript
// Chamar para cada receita sem imagem
const generateMissingImages = async (recipeId: string, title: string, ingredients: string[]) => {
  const response = await supabase.functions.invoke('generate-recipe-image', {
    body: { recipeId, recipeTitle: title, ingredients }
  });
  
  if (response.data?.imageUrl) {
    // Imagem gerada e armazenada no bucket
    console.log(`Generated: ${title}`);
  }
};
```

#### Passo 3: Atualizar Mapeamento
Após gerar imagens, atualizar `recipeImages.ts` para apontar para URLs do storage.

---

## Ficheiros a Modificar

| Ficheiro | Alteração | Prioridade |
|----------|-----------|------------|
| `src/components/home/AgeCategoryCircles.tsx` | Corrigir cor texto 12-18m | Alta |
| `src/pages/Home.tsx` | Redesign premium completo | Alta |
| `src/components/ui/emotional-header.tsx` | Mensagens mais emocionais | Média |
| `src/components/home/DailyActionCard.tsx` | Efeitos visuais premium | Média |
| `src/components/engagement/QuickCheckinWidget.tsx` | Botões mais vibrantes | Média |
| `src/components/home/WeeklyProgressCard.tsx` | Animações de celebração | Média |
| `src/data/recipeImages.ts` | Auditoria de duplicados | Baixa |

---

## Resultado Esperado

Após implementação:
- ✅ Texto "12-18 months" legível em cor preta
- ✅ Home page emocionalmente impactante e premium
- ✅ Animações suaves e celebrativas
- ✅ Gradientes e efeitos glassmorphism consistentes
- ✅ Cada receita com imagem única e apropriada
- ✅ Conexão emocional forte entre mãe e app

