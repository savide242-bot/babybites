import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Check } from "lucide-react";

interface DailyPollWidgetProps {
  babyName?: string;
}

const POLL_QUESTIONS = [
  { question: "What did {baby} enjoy most yesterday?", options: ["🥕 Veggies", "🍌 Fruits", "🍚 Grains", "🥩 Protein"] },
  { question: "How was {baby}'s appetite today?", options: ["😋 Great", "😊 Good", "😐 Okay", "😔 Low"] },
  { question: "Any new texture today?", options: ["🥣 Puree", "🥗 Mashed", "🧀 Soft chunks", "🍞 Finger food"] },
  { question: "Favorite meal time?", options: ["🌅 Breakfast", "☀️ Lunch", "🌙 Dinner", "🍎 Snack"] },
  { question: "How's feeding going this week?", options: ["🚀 Amazing", "👍 Good", "😤 Challenging", "🆘 Need help"] },
];

const DailyPollWidget = ({ babyName }: DailyPollWidgetProps) => {
  const [todayPoll, setTodayPoll] = useState<{ question: string; answer?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTodayPoll = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('daily_polls')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('poll_date', today)
        .maybeSingle();

      if (data) {
        setTodayPoll({ question: data.question, answer: data.answer || undefined });
      } else {
        // Create today's poll
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const pollIndex = dayOfYear % POLL_QUESTIONS.length;
        const question = POLL_QUESTIONS[pollIndex].question.replace('{baby}', babyName || 'baby');
        
        await supabase.from('daily_polls').insert({
          user_id: session.user.id,
          poll_date: today,
          question
        });
        
        setTodayPoll({ question });
      }
      setIsLoading(false);
    };

    fetchTodayPoll();
  }, [babyName]);

  const handleAnswer = async (answer: string) => {
    if (isSubmitting || todayPoll?.answer) return;
    
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('daily_polls')
      .update({ answer, answered_at: new Date().toISOString() })
      .eq('user_id', session.user.id)
      .eq('poll_date', today);

    if (!error) {
      setTodayPoll(prev => prev ? { ...prev, answer } : null);
      toast.success("+5 points! Thanks for sharing 💕", { duration: 2000 });
      
      // Award points
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('total_points')
        .eq('user_id', session.user.id)
        .single();
      
      if (streakData) {
        await supabase
          .from('user_streaks')
          .update({ total_points: (streakData.total_points || 0) + 5 })
          .eq('user_id', session.user.id);
      }
    }
    setIsSubmitting(false);
  };

  if (isLoading || !todayPoll) return null;

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const pollIndex = dayOfYear % POLL_QUESTIONS.length;
  const options = POLL_QUESTIONS[pollIndex].options;

  if (todayPoll.answer) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Today's poll answered</span>
          </div>
          <div className="flex items-center gap-1.5 bg-mint/20 px-2 py-1 rounded-full">
            <Check className="w-4 h-4 text-mint" />
            <span className="text-xs font-medium text-mint">{todayPoll.answer}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5 text-primary" />
        <p className="text-sm font-medium text-foreground">{todayPoll.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={isSubmitting}
            className="py-2.5 px-3 rounded-xl bg-muted/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground disabled:opacity-50"
          >
            {option}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">+5 points for answering!</p>
    </div>
  );
};

export default DailyPollWidget;
