import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, MessageCircle, CheckSquare, CalendarDays, Baby, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { foodChecklistData, readyMadeMenus, pickyEaterGuide, type AgeStage, type AgeMealPlan, type PickySection } from '@/data/bonusContent';
import { differenceInMonths } from 'date-fns';

// ─── Bonus 1: Private Group ───
const BonusPrivateGroup = () => (
  <Card className="border border-border/50 shadow-lg rounded-2xl overflow-hidden">
    <CardHeader className="bg-gradient-to-r from-green-500/10 to-mint/10 pb-4">
      <CardTitle className="text-base flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-green-600" />
        Private Nutrition Support Group
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Get direct access to our private community of parents and nutrition specialists. Ask questions, share wins, and get personalized advice from experienced professionals — all in a safe, judgment-free space.
      </p>
      <ul className="text-sm space-y-2 text-muted-foreground">
        <li>✅ Ask unlimited feeding questions</li>
        <li>✅ Get advice from certified nutritionists</li>
        <li>✅ Connect with parents at the same stage</li>
        <li>✅ Daily tips and recipe inspiration</li>
      </ul>
      <a
        href="https://chat.whatsapp.com/BF1UCtY4julCp0jz44NqKJ"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600/10 text-green-700 dark:text-green-400 hover:bg-green-600/20 transition-colors text-sm font-medium"
      >
        Join the Group <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </CardContent>
  </Card>
);

// ─── Bonus 2: Food Checklist ───
const statusOptions = [
  { value: 'not_introduced', label: '—', color: 'bg-muted text-muted-foreground' },
  { value: 'introduced', label: '✅', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'loved_it', label: '❤️', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'retry_later', label: '🔄', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'watch_reaction', label: '👀', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];

const BonusFoodChecklist = () => {
  const [progress, setProgress] = useState<Record<string, string>>({});
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedFood, setExpandedFood] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('food_introduction_progress')
      .select('food_key, status')
      .eq('user_id', user.id);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach(d => { map[d.food_key] = d.status; });
      setProgress(map);
    }
  };

  const updateStatus = async (foodKey: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setProgress(prev => ({ ...prev, [foodKey]: status }));

    if (status === 'not_introduced') {
      await supabase.from('food_introduction_progress').delete()
        .eq('user_id', user.id).eq('food_key', foodKey);
    } else {
      await supabase.from('food_introduction_progress').upsert({
        user_id: user.id,
        food_key: foodKey,
        status,
      }, { onConflict: 'user_id,food_key' });
    }
  };

  const getStageProgress = (stage: AgeStage) => {
    const allFoods = stage.categories.flatMap(c => c.foods);
    const introduced = allFoods.filter(f => progress[f.key] && progress[f.key] !== 'not_introduced').length;
    return { introduced, total: allFoods.length };
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Track every food you've introduced. Tap a food to see serving tips, then set its status. Your progress is saved automatically.
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        {statusOptions.map(s => (
          <span key={s.value} className={`px-2 py-1 rounded-full ${s.color}`}>
            {s.label} {s.value.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {foodChecklistData.map(stage => {
        const { introduced, total } = getStageProgress(stage);
        const isExpanded = expandedStage === stage.ageRange;
        return (
          <Card key={stage.ageRange} className="border border-border/30 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedStage(isExpanded ? null : stage.ageRange)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <p className="font-semibold text-sm">{stage.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {introduced}/{total} foods tracked
                </p>
              </div>
              <div className="flex items-center gap-2">
                {introduced > 0 && (
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(introduced / total) * 100}%` }} />
                  </div>
                )}
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-4">
                <p className="text-xs text-muted-foreground">{stage.description}</p>
                {stage.categories.map(cat => (
                  <div key={cat.category}>
                    <p className="text-xs font-semibold text-foreground mb-2">{cat.icon} {cat.category}</p>
                    <div className="space-y-1.5">
                      {cat.foods.map(food => {
                        const currentStatus = progress[food.key] || 'not_introduced';
                        const isOpen = expandedFood === food.key;
                        return (
                          <div key={food.key} className="rounded-lg border border-border/30 overflow-hidden">
                            <button
                              onClick={() => setExpandedFood(isOpen ? null : food.key)}
                              className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/20"
                            >
                              <span className="text-sm">{food.name}</span>
                              <div className="flex items-center gap-2">
                                {statusOptions.map(s => (
                                  <button
                                    key={s.value}
                                    onClick={(e) => { e.stopPropagation(); updateStatus(food.key, s.value); }}
                                    className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all ${
                                      currentStatus === s.value ? s.color + ' ring-2 ring-primary/30 scale-110' : 'bg-muted/30 hover:bg-muted/60'
                                    }`}
                                  >
                                    {s.label}
                                  </button>
                                ))}
                              </div>
                            </button>
                            {isOpen && (
                              <div className="px-3 pb-3 space-y-1.5 text-xs text-muted-foreground bg-muted/10">
                                <p><strong>How to serve:</strong> {food.servingTip}</p>
                                {food.textureTip && <p><strong>Texture:</strong> {food.textureTip}</p>}
                                {food.allergenNote && <p className="text-amber-600 dark:text-amber-400"><strong>⚠️ Allergen:</strong> {food.allergenNote}</p>}
                                {food.repeatAdvice && <p><strong>Tip:</strong> {food.repeatAdvice}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ─── Bonus 3: Ready-Made Menus ───
const BonusReadyMenus = ({ babyAgeMonths }: { babyAgeMonths: number }) => {
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  // Auto-expand the age-appropriate plan
  useEffect(() => {
    const match = readyMadeMenus.find(m => {
      const [min, max] = m.ageRange.split('-').map(Number);
      return babyAgeMonths >= min && babyAgeMonths <= max;
    });
    if (match) setExpandedPlan(match.ageRange);
  }, [babyAgeMonths]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        A full week of meals, already planned for your baby's exact stage. Each menu includes prep notes and swap options so you can adapt to what you have at home.
      </p>
      {readyMadeMenus.map(plan => {
        const isExpanded = expandedPlan === plan.ageRange;
        const [min, max] = plan.ageRange.split('-').map(Number);
        const isCurrentAge = babyAgeMonths >= min && babyAgeMonths <= max;
        return (
          <Card key={plan.ageRange} className={`border rounded-xl overflow-hidden ${isCurrentAge ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border/30'}`}>
            <button
              onClick={() => setExpandedPlan(isExpanded ? null : plan.ageRange)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{plan.label}</p>
                {isCurrentAge && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Your baby's stage</Badge>}
              </div>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-4">
                <p className="text-xs text-muted-foreground">{plan.overview}</p>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="text-xs font-medium text-primary">Texture Guide</p>
                  <p className="text-xs text-muted-foreground">{plan.textureGuide}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs font-medium mb-1">Swap Tips</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {plan.swapTips.map((tip, i) => <li key={i}>• {tip}</li>)}
                  </ul>
                </div>

                <div className="space-y-3">
                  {plan.days.map(day => (
                    <div key={day.day} className="p-3 rounded-lg border border-border/20 space-y-2">
                      <p className="font-semibold text-xs text-primary">{day.day}</p>
                      <div className="grid gap-2 text-xs">
                        <div>
                          <span className="font-medium">🍳 Breakfast:</span> {day.breakfast.name}
                          {day.breakfast.prepNote && <p className="text-muted-foreground ml-4 mt-0.5">{day.breakfast.prepNote}</p>}
                        </div>
                        <div>
                          <span className="font-medium">🥗 Lunch:</span> {day.lunch.name}
                          {day.lunch.prepNote && <p className="text-muted-foreground ml-4 mt-0.5">{day.lunch.prepNote}</p>}
                        </div>
                        <div>
                          <span className="font-medium">🍽️ Dinner:</span> {day.dinner.name}
                          {day.dinner.prepNote && <p className="text-muted-foreground ml-4 mt-0.5">{day.dinner.prepNote}</p>}
                        </div>
                        {day.snack && (
                          <div>
                            <span className="font-medium">🍌 Snack:</span> {day.snack.name}
                            {day.snack.prepNote && <p className="text-muted-foreground ml-4 mt-0.5">{day.snack.prepNote}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ─── Bonus 4: Picky Eater Guide ───
const BonusPickyEaters = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('tonight');

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Practical, evidence-based strategies when your baby refuses food. No judgment — every parent goes through this.
      </p>
      {pickyEaterGuide.map(section => {
        const isExpanded = expandedSection === section.id;
        return (
          <Card key={section.id} className="border border-border/30 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
            >
              <p className="font-semibold text-sm">{section.title}</p>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{
                    __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                  }} />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ─── Main Bonus Page ───
const Bonus = () => {
  const [babyAgeMonths, setBabyAgeMonths] = useState(6);

  useEffect(() => {
    const loadAge = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('baby_birth_date').eq('id', user.id).maybeSingle();
      if (data?.baby_birth_date) {
        setBabyAgeMonths(Math.max(0, differenceInMonths(new Date(), new Date(data.baby_birth_date))));
      }
    };
    loadAge();
  }, []);

  return (
    <div className="min-h-screen pt-12 pb-24 lg:pb-8 bg-gradient-to-b from-background via-peach/5 to-background">
      <div className="container max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" />
            Bonus Resources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exclusive tools and guides to make feeding easier
          </p>
        </motion.div>

        <Tabs defaultValue="group" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="group" className="text-xs py-2 px-1 flex flex-col gap-1">
              <MessageCircle className="h-4 w-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs py-2 px-1 flex flex-col gap-1">
              <CheckSquare className="h-4 w-4" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="menus" className="text-xs py-2 px-1 flex flex-col gap-1">
              <CalendarDays className="h-4 w-4" />
              Menus
            </TabsTrigger>
            <TabsTrigger value="picky" className="text-xs py-2 px-1 flex flex-col gap-1">
              <Baby className="h-4 w-4" />
              Picky Eaters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="group">
            <BonusPrivateGroup />
          </TabsContent>

          <TabsContent value="checklist">
            <BonusFoodChecklist />
          </TabsContent>

          <TabsContent value="menus">
            <BonusReadyMenus babyAgeMonths={babyAgeMonths} />
          </TabsContent>

          <TabsContent value="picky">
            <BonusPickyEaters />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Bonus;
