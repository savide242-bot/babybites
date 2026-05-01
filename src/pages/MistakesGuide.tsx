import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, BookOpen, Lightbulb, ShieldCheck, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hiddenMistakes, type HiddenMistake } from "@/data/hiddenMistakes";

const MistakesGuide = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<HiddenMistake | null>(null);

  return (
    <main className="min-h-screen pb-24 lg:pb-8 bg-background pt-20">
      <div className="max-w-2xl mx-auto px-4 space-y-5">
        {/* Header */}
        <button
          onClick={() => (active ? setActive(null) : navigate(-1))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Hero */}
              <div className="text-center space-y-3 pt-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-gold to-secondary shadow-lg">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold">The 3 Hidden Mistakes</h1>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Three feeding mistakes most mothers make every day — silently blocking
                  their baby's growth. Tap each one to learn the science and the fix.
                </p>
                <p className="text-xs text-muted-foreground italic">
                  Curated by Emily Harter, Pediatric Nutritionist
                </p>
              </div>

              {/* Mistake cards */}
              <div className="space-y-3">
                {hiddenMistakes.map((m, i) => (
                  <motion.button
                    key={m.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setActive(m)}
                    className="w-full text-left p-4 rounded-2xl border border-border/50 bg-card hover:bg-muted/30 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-bold text-sm">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="mb-1.5 text-[10px]">
                          {m.badge}
                        </Badge>
                        <p className="font-semibold text-sm text-foreground leading-snug">
                          {m.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {m.oneLiner}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer CTA */}
              <Card className="border-border/50 bg-gradient-to-br from-mint/10 to-primary/5">
                <CardContent className="p-4 text-center space-y-2">
                  <p className="text-sm font-medium">
                    Now that you know — let BabyBites do the heavy lifting.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Every recipe and meal plan is built with these rules in mind.
                  </p>
                  <Button onClick={() => navigate("/recipes")} size="sm" className="mt-2">
                    Browse Smart Recipes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {active.badge}
                </Badge>
                <h1 className="text-2xl font-bold leading-tight">{active.title}</h1>
                <p className="text-sm text-muted-foreground italic">{active.oneLiner}</p>
              </div>

              <Card className="border-amber-200/40 bg-amber-50/50 dark:bg-amber-950/10">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
                      Why it hurts
                    </p>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {active.whyItHurts}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">Common examples</p>
                  </div>
                  <ul className="space-y-1.5">
                    {active.examples.map((ex, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{ex}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-mint/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-mint-foreground" />
                    <p className="font-semibold text-sm">The science</p>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {active.science}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-200/50 bg-green-50/50 dark:bg-green-950/10">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <p className="font-semibold text-sm text-green-700 dark:text-green-400">
                      How to fix it
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {active.fix.map((f, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex gap-2">
                        <span className="text-green-600 font-bold">{i + 1}.</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <p className="text-[11px] text-muted-foreground text-center">
                Source: {active.source}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};

export default MistakesGuide;
