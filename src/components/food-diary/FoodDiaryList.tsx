import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart, ThumbsUp, Meh, ThumbsDown, X, AlertTriangle,
  Calendar, Trash2, Filter, ChevronDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Reaction = 'loved' | 'liked' | 'neutral' | 'disliked' | 'rejected' | 'allergic';

interface FoodDiaryItem {
  id: string;
  food_name: string;
  reaction: Reaction;
  tried_at: string;
  notes: string | null;
  recipe_id: string | null;
}

const reactionConfig: Record<Reaction, { icon: any; label: string; color: string; bgColor: string }> = {
  loved: { icon: Heart, label: "Loved", color: "text-red-500", bgColor: "bg-red-100 dark:bg-red-950/50" },
  liked: { icon: ThumbsUp, label: "Liked", color: "text-green-500", bgColor: "bg-green-100 dark:bg-green-950/50" },
  neutral: { icon: Meh, label: "Neutral", color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-950/50" },
  disliked: { icon: ThumbsDown, label: "Disliked", color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-950/50" },
  rejected: { icon: X, label: "Rejected", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-950/50" },
  allergic: { icon: AlertTriangle, label: "Allergic", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-950/50" },
};

interface FoodDiaryListProps {
  refreshTrigger?: number;
}

export const FoodDiaryList = ({ refreshTrigger }: FoodDiaryListProps) => {
  const [entries, setEntries] = useState<FoodDiaryItem[]>([]);
  const [filter, setFilter] = useState<Reaction | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, [refreshTrigger]);

  const loadEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('food_diary')
      .select('*')
      .eq('user_id', user.id)
      .order('tried_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setEntries(data as FoodDiaryItem[]);
    }
    setIsLoading(false);
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('food_diary').delete().eq('id', id);
    if (!error) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.reaction === filter);

  // Group by date
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const date = entry.tried_at;
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, FoodDiaryItem[]>);

  // Stats
  const stats = {
    loved: entries.filter(e => e.reaction === 'loved').length,
    liked: entries.filter(e => e.reaction === 'liked').length,
    rejected: entries.filter(e => e.reaction === 'rejected' || e.reaction === 'disliked').length,
    allergic: entries.filter(e => e.reaction === 'allergic').length,
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Badge variant="secondary" className="shrink-0 gap-1">
          <Heart className="w-3 h-3 text-red-500" />
          {stats.loved} loved
        </Badge>
        <Badge variant="secondary" className="shrink-0 gap-1">
          <ThumbsUp className="w-3 h-3 text-green-500" />
          {stats.liked} liked
        </Badge>
        <Badge variant="secondary" className="shrink-0 gap-1">
          <ThumbsDown className="w-3 h-3 text-orange-500" />
          {stats.rejected} rejected
        </Badge>
        {stats.allergic > 0 && (
          <Badge variant="destructive" className="shrink-0 gap-1">
            <AlertTriangle className="w-3 h-3" />
            {stats.allergic} allergic
          </Badge>
        )}
      </div>

      {/* Filter */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{filteredEntries.length} entries</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              {filter === 'all' ? 'All' : reactionConfig[filter].label}
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
            {Object.entries(reactionConfig).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => setFilter(key as Reaction)} className="gap-2">
                <config.icon className={`w-4 h-4 ${config.color}`} />
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Entries */}
      {Object.keys(groupedEntries).length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <div className="text-4xl mb-3">🍽️</div>
          <h3 className="font-semibold mb-1">No entries yet</h3>
          <p className="text-sm text-muted-foreground">
            Start recording your baby's food reactions
          </p>
        </Card>
      ) : (
        Object.entries(groupedEntries).map(([date, items]) => (
          <div key={date} className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(new Date(date), 'EEEE, MMM d, yyyy')}
            </div>
            {items.map(item => {
              const config = reactionConfig[item.reaction];
              const Icon = config.icon;
              return (
                <Card 
                  key={item.id} 
                  className={`p-4 ${config.bgColor} border-0 group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-background/80`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{item.food_name}</h4>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteEntry(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
};
