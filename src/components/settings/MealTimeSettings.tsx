import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Bell, Check } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface MealTime {
  meal_type: string;
  preferred_hour: number;
  preferred_minute: number;
  enabled: boolean;
}

const DEFAULT_MEAL_TIMES: MealTime[] = [
  { meal_type: 'breakfast', preferred_hour: 8, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 0, enabled: true },
  { meal_type: 'snack', preferred_hour: 15, preferred_minute: 0, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅' },
  lunch: { label: 'Lunch', emoji: '☀️' },
  snack: { label: 'Snack', emoji: '🍎' },
  dinner: { label: 'Dinner', emoji: '🌙' },
};

const MealTimeSettings = () => {
  const [mealTimes, setMealTimes] = useState<MealTime[]>(DEFAULT_MEAL_TIMES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMealTimes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('baby_meal_times')
        .select('*')
        .eq('user_id', session.user.id);

      if (data && data.length > 0) {
        const merged = DEFAULT_MEAL_TIMES.map(defaultTime => {
          const saved = data.find(d => d.meal_type === defaultTime.meal_type);
          return saved ? {
            meal_type: saved.meal_type,
            preferred_hour: saved.preferred_hour,
            preferred_minute: saved.preferred_minute,
            enabled: saved.enabled
          } : defaultTime;
        });
        setMealTimes(merged);
      }
      setIsLoading(false);
    };

    fetchMealTimes();
  }, []);

  const updateMealTime = async (mealType: string, updates: Partial<MealTime>) => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const currentMeal = mealTimes.find(m => m.meal_type === mealType);
    if (!currentMeal) return;

    const updated = { ...currentMeal, ...updates };

    const { error } = await supabase
      .from('baby_meal_times')
      .upsert({
        user_id: session.user.id,
        meal_type: mealType,
        preferred_hour: updated.preferred_hour,
        preferred_minute: updated.preferred_minute,
        enabled: updated.enabled
      }, { onConflict: 'user_id,meal_type' });

    if (!error) {
      setMealTimes(prev => prev.map(m => 
        m.meal_type === mealType ? updated : m
      ));
      toast.success("Meal time updated!", { duration: 1500 });
    }
    setIsSaving(false);
  };

  const formatTime = (hour: number, minute: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Meal Time Reminders</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Get reminded 30 minutes before each meal to prepare baby's food.
      </p>

      <div className="space-y-3">
        {mealTimes.map((meal) => {
          const info = MEAL_LABELS[meal.meal_type];
          return (
            <div
              key={meal.meal_type}
              className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.emoji}</span>
                <div>
                  <p className="font-medium text-foreground">{info.label}</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={meal.preferred_hour}
                      onChange={(e) => updateMealTime(meal.meal_type, { preferred_hour: parseInt(e.target.value) })}
                      disabled={isSaving}
                      className="text-sm bg-muted/50 border border-border/50 rounded-lg px-2 py-1 text-foreground"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {formatTime(i, 0).split(':')[0]} {i >= 12 ? 'PM' : 'AM'}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground">:</span>
                    <select
                      value={meal.preferred_minute}
                      onChange={(e) => updateMealTime(meal.meal_type, { preferred_minute: parseInt(e.target.value) })}
                      disabled={isSaving}
                      className="text-sm bg-muted/50 border border-border/50 rounded-lg px-2 py-1 text-foreground"
                    >
                      {[0, 15, 30, 45].map(m => (
                        <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {meal.enabled && <Bell className="w-4 h-4 text-primary" />}
                <Switch
                  checked={meal.enabled}
                  onCheckedChange={(checked) => updateMealTime(meal.meal_type, { enabled: checked })}
                  disabled={isSaving}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-mint/10 rounded-xl p-3 border border-mint/30 flex items-start gap-2">
        <Check className="w-4 h-4 text-mint mt-0.5" />
        <p className="text-xs text-muted-foreground">
          You'll receive a push notification 30 minutes before each enabled meal time.
        </p>
      </div>
    </div>
  );
};

export default MealTimeSettings;
