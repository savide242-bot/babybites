import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, ThumbsUp, Meh, ThumbsDown, X, AlertTriangle,
  Sparkles, Plus, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FoodDiaryEntryProps {
  onSuccess?: () => void;
  initialFood?: string;
  recipeId?: string;
}

type Reaction = 'loved' | 'liked' | 'neutral' | 'disliked' | 'rejected' | 'allergic';

const reactionConfig: Record<Reaction, { icon: any; label: string; color: string; bg: string }> = {
  loved: { icon: Heart, label: "Loved it!", color: "text-red-500", bg: "bg-red-100 dark:bg-red-950/50 border-red-200" },
  liked: { icon: ThumbsUp, label: "Liked", color: "text-green-500", bg: "bg-green-100 dark:bg-green-950/50 border-green-200" },
  neutral: { icon: Meh, label: "Neutral", color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/50 border-amber-200" },
  disliked: { icon: ThumbsDown, label: "Disliked", color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-950/50 border-orange-200" },
  rejected: { icon: X, label: "Rejected", color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/50 border-red-200" },
  allergic: { icon: AlertTriangle, label: "Allergic", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-950/50 border-purple-200" },
};

export const FoodDiaryEntry = ({ onSuccess, initialFood = "", recipeId }: FoodDiaryEntryProps) => {
  const [foodName, setFoodName] = useState(initialFood);
  const [reaction, setReaction] = useState<Reaction | null>(null);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!foodName.trim() || !reaction) {
      toast.error("Please enter food name and select a reaction");
      return;
    }

    setIsSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in first");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('food_diary').insert({
      user_id: user.id,
      food_name: foodName.trim(),
      reaction,
      notes: notes.trim() || null,
      recipe_id: recipeId || null,
    });

    if (error) {
      console.error('Error saving food diary entry:', error);
      toast.error("Failed to save entry");
      setIsSubmitting(false);
      return;
    }

    toast.success(`Recorded: ${foodName} - ${reactionConfig[reaction].label}`);
    setFoodName("");
    setReaction(null);
    setNotes("");
    setIsSubmitting(false);
    onSuccess?.();
  };

  return (
    <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Record Food Reaction</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Food Name</label>
          <Input
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            placeholder="What did baby try?"
            className="bg-background"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-2 block">How did baby react?</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(Object.entries(reactionConfig) as [Reaction, typeof reactionConfig['loved']][]).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = reaction === key;
              return (
                <button
                  key={key}
                  onClick={() => setReaction(key)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                    isSelected 
                      ? `${config.bg} border-current scale-105 shadow-md` 
                      : 'border-border/50 hover:border-border bg-card hover:bg-muted/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? config.color : 'text-muted-foreground'}`} />
                  <span className={`text-[10px] font-medium ${isSelected ? config.color : 'text-muted-foreground'}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Notes (optional)</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any observations? Texture preference, amount eaten, etc."
            className="bg-background resize-none"
            rows={2}
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={!foodName.trim() || !reaction || isSubmitting}
          className="w-full gap-2"
        >
          {isSubmitting ? (
            <>Saving...</>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Record Reaction
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
