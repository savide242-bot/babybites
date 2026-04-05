import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, MessageCircle, CheckSquare, CalendarDays, Baby, ChevronRight, ExternalLink, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { foodChecklistData, readyMadeMenus, pickyEaterGuide, type AgeStage, type FoodItem, type AgeMealPlan, type PickySection } from '@/data/bonusContent';
import { differenceInMonths } from 'date-fns';

// ── Navigation types ──
type View =
  | { type: 'hub' }
  | { type: 'group' }
  | { type: 'checklist-stages' }
  | { type: 'checklist-stage'; stageIndex: number }
  | { type: 'checklist-food'; stageIndex: number; catIndex: number; foodIndex: number }
  | { type: 'menus-list' }
  | { type: 'menu-detail'; planIndex: number }
  | { type: 'menu-day'; planIndex: number; dayIndex: number }
  | { type: 'picky-list' }
  | { type: 'picky-detail'; sectionId: string };

const statusOptions = [
  { value: 'not_introduced', label: '—', color: 'bg-muted text-muted-foreground' },
  { value: 'introduced', label: '✅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'loved_it', label: '❤️', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'retry_later', label: '🔄', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'watch_reaction', label: '👀', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

// ── Back button ──
const BackButton = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
    <ArrowLeft className="h-4 w-4" /> Back
  </button>
);

// ── Page transition wrapper ──
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
    {children}
  </motion.div>
);

const Bonus = () => {
  const [view, setView] = useState<View>({ type: 'hub' });
  const [babyAgeMonths, setBabyAgeMonths] = useState(6);
  const [progress, setProgress] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [profileRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('baby_birth_date').eq('id', user.id).maybeSingle(),
        supabase.from('food_introduction_progress').select('food_key, status').eq('user_id', user.id),
      ]);
      if (profileRes.data?.baby_birth_date) {
        setBabyAgeMonths(Math.max(0, differenceInMonths(new Date(), new Date(profileRes.data.baby_birth_date))));
      }
      if (progressRes.data) {
        const map: Record<string, string> = {};
        progressRes.data.forEach(d => { map[d.food_key] = d.status; });
        setProgress(map);
      }
    };
    load();
  }, []);

  const updateStatus = async (foodKey: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProgress(prev => ({ ...prev, [foodKey]: status }));
    if (status === 'not_introduced') {
      await supabase.from('food_introduction_progress').delete().eq('user_id', user.id).eq('food_key', foodKey);
    } else {
      await supabase.from('food_introduction_progress').upsert({ user_id: user.id, food_key: foodKey, status }, { onConflict: 'user_id,food_key' });
    }
  };

  const getStageProgress = (stage: AgeStage) => {
    const allFoods = stage.categories.flatMap(c => c.foods);
    const introduced = allFoods.filter(f => progress[f.key] && progress[f.key] !== 'not_introduced').length;
    return { introduced, total: allFoods.length };
  };

  const renderContent = () => {
    switch (view.type) {
      case 'hub': return renderHub();
      case 'group': return renderGroup();
      case 'checklist-stages': return renderChecklistStages();
      case 'checklist-stage': return renderChecklistStage(view.stageIndex);
      case 'checklist-food': return renderChecklistFood(view.stageIndex, view.catIndex, view.foodIndex);
      case 'menus-list': return renderMenusList();
      case 'menu-detail': return renderMenuDetail(view.planIndex);
      case 'menu-day': return renderMenuDay(view.planIndex, view.dayIndex);
      case 'picky-list': return renderPickyList();
      case 'picky-detail': return renderPickyDetail(view.sectionId);
    }
  };

  // ════════ HUB ════════
  const renderHub = () => (
    <PageTransition>
      <div className="space-y-3">
        {[
          { icon: <MessageCircle className="h-5 w-5 text-green-600" />, title: 'Private Nutrition Support', desc: 'Direct access to certified nutritionists', onClick: () => setView({ type: 'group' }) },
          { icon: <CheckSquare className="h-5 w-5 text-blue-600" />, title: 'Food Introduction Checklist', desc: 'Track every food by age stage', onClick: () => setView({ type: 'checklist-stages' }) },
          { icon: <CalendarDays className="h-5 w-5 text-purple-600" />, title: 'Ready-Made Menus by Age', desc: 'Full weekly meal plans, ready to go', onClick: () => setView({ type: 'menus-list' }) },
          { icon: <Baby className="h-5 w-5 text-accent" />, title: 'Picky Eater Strategies', desc: 'Practical help when baby refuses food', onClick: () => setView({ type: 'picky-list' }) },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <button onClick={item.onClick} className="w-full flex items-center gap-3.5 p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-colors text-left active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </motion.div>
        ))}
      </div>
    </PageTransition>
  );

  // ════════ GROUP ════════
  const renderGroup = () => (
    <PageTransition>
      <BackButton onClick={() => setView({ type: 'hub' })} />
      <Card className="border border-border/50 rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-500/10 to-mint/10 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" /> Private Nutrition Support Group
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Get direct access to our private community of parents and nutrition specialists. Ask questions, share wins, and get personalized advice — all in a safe, judgment-free space.
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground">
            <li>✅ Ask unlimited feeding questions</li>
            <li>✅ Get advice from certified nutritionists</li>
            <li>✅ Connect with parents at the same stage</li>
            <li>✅ Daily tips and recipe inspiration</li>
          </ul>
          <a href="https://chat.whatsapp.com/BF1UCtY4julCp0jz44NqKJ" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600/10 text-green-700 dark:text-green-400 hover:bg-green-600/20 transition-colors text-sm font-medium">
            Join the Group <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>
    </PageTransition>
  );

  // ════════ CHECKLIST STAGES ════════
  const renderChecklistStages = () => (
    <PageTransition>
      <BackButton onClick={() => setView({ type: 'hub' })} />
      <div className="mb-4">
        <h2 className="text-lg font-bold">Food Introduction Checklist</h2>
        <p className="text-xs text-muted-foreground mt-1">Track every food you've introduced. Tap a stage to explore.</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {statusOptions.map(s => (
            <span key={s.value} className={`px-2 py-0.5 rounded-full text-[10px] ${s.color}`}>{s.label} {s.value.replace(/_/g, ' ')}</span>
          ))}
        </div>
      </div>
      <div className="space-y-2.5">
        {foodChecklistData.map((stage, idx) => {
          const { introduced, total } = getStageProgress(stage);
          const pct = total > 0 ? Math.round((introduced / total) * 100) : 0;
          return (
            <button key={stage.ageRange} onClick={() => setView({ type: 'checklist-stage', stageIndex: idx })}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-colors text-left active:scale-[0.98]">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{stage.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{introduced}/{total} foods tracked</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {introduced > 0 && (
                  <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          );
        })}
      </div>
    </PageTransition>
  );

  // ════════ CHECKLIST STAGE DETAIL ════════
  const renderChecklistStage = (stageIndex: number) => {
    const stage = foodChecklistData[stageIndex];
    if (!stage) return null;
    return (
      <PageTransition>
        <BackButton onClick={() => setView({ type: 'checklist-stages' })} />
        <h2 className="text-lg font-bold mb-1">{stage.label}</h2>
        <p className="text-xs text-muted-foreground mb-4">{stage.description}</p>
        <div className="space-y-5">
          {stage.categories.map((cat, catIdx) => (
            <div key={cat.category}>
              <p className="text-sm font-semibold mb-2">{cat.icon} {cat.category}</p>
              <div className="space-y-1.5">
                {cat.foods.map((food, foodIdx) => {
                  const st = progress[food.key] || 'not_introduced';
                  return (
                    <button key={food.key} onClick={() => setView({ type: 'checklist-food', stageIndex, catIndex: catIdx, foodIndex: foodIdx })}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border/30 bg-card hover:bg-muted/20 transition-colors text-left active:scale-[0.98]">
                      <span className="text-sm">{food.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusOptions.find(s => s.value === st)?.color || ''}`}>
                          {statusOptions.find(s => s.value === st)?.label}
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PageTransition>
    );
  };

  // ════════ CHECKLIST FOOD DETAIL ════════
  const renderChecklistFood = (stageIndex: number, catIndex: number, foodIndex: number) => {
    const stage = foodChecklistData[stageIndex];
    const cat = stage?.categories[catIndex];
    const food = cat?.foods[foodIndex];
    if (!food) return null;
    const currentStatus = progress[food.key] || 'not_introduced';

    return (
      <PageTransition>
        <BackButton onClick={() => setView({ type: 'checklist-stage', stageIndex })} />
        <h2 className="text-lg font-bold mb-1">{food.name}</h2>
        <p className="text-xs text-muted-foreground mb-4">{cat.icon} {cat.category} · {stage.label}</p>

        <Card className="border border-border/30 rounded-xl mb-4">
          <CardContent className="p-4 space-y-3 text-sm">
            <div><strong className="text-foreground">How to serve:</strong> <span className="text-muted-foreground">{food.servingTip}</span></div>
            {food.textureTip && <div><strong className="text-foreground">Texture:</strong> <span className="text-muted-foreground">{food.textureTip}</span></div>}
            {food.allergenNote && <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30"><strong className="text-amber-700 dark:text-amber-400">⚠️ Allergen:</strong> <span className="text-amber-600 dark:text-amber-300 text-xs">{food.allergenNote}</span></div>}
            {food.repeatAdvice && <div><strong className="text-foreground">Tip:</strong> <span className="text-muted-foreground">{food.repeatAdvice}</span></div>}
          </CardContent>
        </Card>

        <p className="text-xs font-medium mb-2 text-foreground">Set status:</p>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(s => (
            <button key={s.value} onClick={() => updateStatus(food.key, s.value)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${currentStatus === s.value ? s.color + ' ring-2 ring-primary/30 scale-105' : 'bg-muted/40 hover:bg-muted/70'}`}>
              {s.label} {s.value.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </PageTransition>
    );
  };

  // ════════ MENUS LIST ════════
  const renderMenusList = () => (
    <PageTransition>
      <BackButton onClick={() => setView({ type: 'hub' })} />
      <h2 className="text-lg font-bold mb-1">Ready-Made Menus by Age</h2>
      <p className="text-xs text-muted-foreground mb-4">A full week of meals, already planned for your baby's stage.</p>
      <div className="space-y-2.5">
        {readyMadeMenus.map((plan, idx) => {
          const [min, max] = plan.ageRange.split('-').map(Number);
          const isCurrentAge = babyAgeMonths >= min && babyAgeMonths <= max;
          return (
            <button key={plan.ageRange} onClick={() => setView({ type: 'menu-detail', planIndex: idx })}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border bg-card hover:bg-muted/30 transition-colors text-left active:scale-[0.98] ${isCurrentAge ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/40'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{plan.label}</p>
                  {isCurrentAge && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Your baby</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.overview.slice(0, 80)}…</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </PageTransition>
  );

  // ════════ MENU DETAIL ════════
  const renderMenuDetail = (planIndex: number) => {
    const plan = readyMadeMenus[planIndex];
    if (!plan) return null;
    return (
      <PageTransition>
        <BackButton onClick={() => setView({ type: 'menus-list' })} />
        <h2 className="text-lg font-bold mb-1">{plan.label} — Weekly Menu</h2>
        <p className="text-xs text-muted-foreground mb-3">{plan.overview}</p>
        <div className="p-3 bg-primary/5 rounded-xl mb-3">
          <p className="text-xs font-medium text-primary">Texture Guide</p>
          <p className="text-xs text-muted-foreground">{plan.textureGuide}</p>
        </div>
        <div className="p-3 bg-muted/30 rounded-xl mb-4">
          <p className="text-xs font-medium mb-1">Swap Tips</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">{plan.swapTips.map((t, i) => <li key={i}>• {t}</li>)}</ul>
        </div>
        <div className="space-y-2">
          {plan.days.map((day, dayIdx) => (
            <button key={day.day} onClick={() => setView({ type: 'menu-day', planIndex, dayIndex: dayIdx })}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border/30 bg-card hover:bg-muted/20 transition-colors text-left active:scale-[0.98]">
              <div>
                <p className="font-semibold text-sm text-primary">{day.day}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {day.breakfast.name} · {day.lunch.name} · {day.dinner.name}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </PageTransition>
    );
  };

  // ════════ MENU DAY ════════
  const renderMenuDay = (planIndex: number, dayIndex: number) => {
    const plan = readyMadeMenus[planIndex];
    const day = plan?.days[dayIndex];
    if (!day) return null;
    const meals = [
      { emoji: '🍳', label: 'Breakfast', ...day.breakfast },
      { emoji: '🥗', label: 'Lunch', ...day.lunch },
      { emoji: '🍽️', label: 'Dinner', ...day.dinner },
      ...(day.snack ? [{ emoji: '🍌', label: 'Snack', ...day.snack }] : []),
    ];
    return (
      <PageTransition>
        <BackButton onClick={() => setView({ type: 'menu-detail', planIndex })} />
        <h2 className="text-lg font-bold mb-1">{day.day}</h2>
        <p className="text-xs text-muted-foreground mb-4">{plan.label} menu</p>
        <div className="space-y-3">
          {meals.map((meal, i) => (
            <Card key={i} className="border border-border/30 rounded-xl">
              <CardContent className="p-4">
                <p className="font-semibold text-sm mb-1">{meal.emoji} {meal.label}</p>
                <p className="text-sm text-foreground">{meal.name}</p>
                {meal.prepNote && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{meal.prepNote}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageTransition>
    );
  };

  // ════════ PICKY LIST ════════
  const renderPickyList = () => (
    <PageTransition>
      <BackButton onClick={() => setView({ type: 'hub' })} />
      <h2 className="text-lg font-bold mb-1">Picky Eater Strategies</h2>
      <p className="text-xs text-muted-foreground mb-4">Practical, evidence-based help when your baby refuses food. No judgment.</p>
      <div className="space-y-2">
        {pickyEaterGuide.map((section) => (
          <button key={section.id} onClick={() => setView({ type: 'picky-detail', sectionId: section.id })}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card hover:bg-muted/30 transition-colors text-left active:scale-[0.98]">
            <span className="text-xl shrink-0">{section.icon}</span>
            <p className="font-semibold text-sm flex-1">{section.title}</p>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </PageTransition>
  );

  // ════════ PICKY DETAIL ════════
  const renderPickyDetail = (sectionId: string) => {
    const section = pickyEaterGuide.find(s => s.id === sectionId);
    if (!section) return null;
    return (
      <PageTransition>
        <BackButton onClick={() => setView({ type: 'picky-list' })} />
        <h2 className="text-lg font-bold mb-1">{section.icon} {section.title}</h2>
        <div className="space-y-3 mt-4">
          {section.content.map((paragraph, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{
              __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
            }} />
          ))}
        </div>
      </PageTransition>
    );
  };

  return (
    <div className="min-h-screen pt-12 pb-24 lg:pb-8 bg-gradient-to-b from-background via-peach/5 to-background">
      <div className="container max-w-2xl px-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" /> Bonus Resources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Exclusive tools and guides to make feeding easier</p>
        </motion.div>
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Bonus;
