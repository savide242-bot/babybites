import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { recipes } from "@/data/recipes";
import { differenceInMonths, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import WhatToCookWidget from "@/components/home/WhatToCookWidget";
import AgeCategoryCircles from "@/components/home/AgeCategoryCircles";
import AppTour from "@/components/onboarding/AppTour";
import { useEngagement } from "@/hooks/useEngagement";
import { useAppTour } from "@/hooks/useAppTour";
import { toast } from "sonner";
import { RewardAnimation, useReward } from "@/components/ui/reward-animation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { BellRing, Flame, Trophy, BookOpen, ChevronRight, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(6);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState<{ current_streak: number; total_points: number } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { isSupported, subscription, subscribeToPushNotifications } = usePushNotifications();
  const [notifLoading, setNotifLoading] = useState(false);

  const recipeOfDayRef = useRef<HTMLDivElement>(null);
  const checkinWidgetRef = useRef<HTMLDivElement>(null);
  const ageCategoriesRef = useRef<HTMLDivElement>(null);

  const { todayCheckin, submitCheckin, dailyTip } = useEngagement();
  const tour = useAppTour();
  const { triggerReward, RewardComponent } = useReward();

  const { greeting, emotionalMessage, emoji } = useMemo(() => {
    const hour = new Date().getHours();
    const displayBabyName = babyName || "your little one";

    if (hour < 6) return { greeting: "Early riser", emotionalMessage: "You're amazing for being up early", emoji: "🌙" };
    if (hour < 12) return { greeting: "Good morning", emotionalMessage: `${displayBabyName} is lucky to have you`, emoji: "🌅" };
    if (hour < 15) return { greeting: "Hello sunshine", emotionalMessage: "You're doing incredible today", emoji: "☀️" };
    if (hour < 18) return { greeting: "Good afternoon", emotionalMessage: "Take a moment to breathe", emoji: "🌤️" };
    if (hour < 21) return { greeting: "Good evening", emotionalMessage: `Another beautiful day with ${displayBabyName}`, emoji: "🌆" };
    return { greeting: "Sweet dreams time", emotionalMessage: "Rest well, supermom", emoji: "🌙" };
  }, [babyName]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { setIsLoading(false); return; }
        const currentUserId = session.user.id;
        setUserId(currentUserId);

        const [profileResult, streakResult] = await Promise.all([
          supabase.from('profiles').select('mother_name, baby_name, baby_birth_date').eq('id', currentUserId).maybeSingle(),
          supabase.from('user_streaks').select('current_streak, total_points').eq('user_id', currentUserId).maybeSingle(),
        ]);

        if (profileResult.data) {
          setMotherName(profileResult.data.mother_name || "");
          setBabyName(profileResult.data.baby_name || "");
          if (profileResult.data.baby_birth_date) {
            const age = differenceInMonths(new Date(), new Date(profileResult.data.baby_birth_date));
            setBabyAgeMonths(Math.max(0, age));
          }
        }
        if (streakResult.data) setStreak(streakResult.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const navRefs = (window as any).__tourNavRefs;
  const currentStreak = streak?.current_streak || 0;
  const totalPoints = streak?.total_points || 0;

  // Daily feeding tips based on age
  const ageTip = useMemo(() => {
    if (babyAgeMonths < 6) return { tip: "Breast milk or formula is all your baby needs right now. Solids start around 6 months!", icon: "🍼" };
    if (babyAgeMonths < 9) return { tip: "Start with single-ingredient purees. Offer one new food every 3 days to watch for allergies.", icon: "🥑" };
    if (babyAgeMonths < 12) return { tip: "Introduce soft finger foods! Small pieces of banana, avocado, or well-cooked veggies are great.", icon: "🥕" };
    if (babyAgeMonths < 18) return { tip: "Your toddler can eat most family foods now. Cut everything into small pieces to prevent choking.", icon: "🍝" };
    return { tip: "Encourage self-feeding and offer a variety of textures. Messy meals are learning meals!", icon: "🥗" };
  }, [babyAgeMonths]);

  return (
    <div className="min-h-screen pb-24 lg:pb-8 bg-background">
      <RewardComponent />

      {!tour.isLoading && (
        <AppTour
          isActive={tour.isActive}
          currentStep={tour.currentStep}
          motherName={tour.motherName}
          babyName={tour.babyName}
          refs={{
            recipeOfDay: recipeOfDayRef,
            checkinWidget: checkinWidgetRef,
            ageCategoriesRef: ageCategoriesRef,
            recipesNav: navRefs?.recipes,
            plannerNav: navRefs?.planner,
          }}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onSkip={tour.skipTour}
          onComplete={tour.completeTour}
        />
      )}

      <div className="max-w-lg lg:max-w-5xl mx-auto px-4 pt-5 pb-4 space-y-5">

        {/* ── HERO HEADER ── */}
        {isLoading ? (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-2"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{emotionalMessage} ✨</p>
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight mt-0.5">
                  {greeting}, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{motherName || "Mom"}</span>
                </h1>
              </div>
              <motion.div
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-xl shrink-0 mt-1"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                {emoji}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── NOTIFICATION CTA (subtle) ── */}
        {!isLoading && isSupported && !subscription && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={async () => {
              if (notifLoading) return;
              setNotifLoading(true);
              try {
                console.log('🏠 Home: Starting notification subscription...');
                const success = await subscribeToPushNotifications();
                console.log('🏠 Home: Subscription result:', success);
                if (success) {
                  toast.success("🔔 Notifications enabled!");
                } else {
                  toast.error("Could not enable notifications. Check browser settings.");
                }
              } catch (err) {
                console.error('🏠 Home: Subscription error:', err);
                toast.error("Something went wrong. Please try again.");
              } finally {
                setNotifLoading(false);
              }
            }}
            disabled={notifLoading}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/60 border border-border/50 active:scale-[0.98] transition-transform"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <BellRing className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-xs text-foreground">Enable Notifications</p>
              <p className="text-[10px] text-muted-foreground">Meal reminders & daily tips</p>
            </div>
            {notifLoading && (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            )}
          </motion.button>
        )}

        {/* ── STATS ── */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2.5"
          >
            {currentStreak > 0 ? (
              <Link
                to="/achievements"
                className="flex-1 flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 active:scale-[0.97] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-foreground leading-none">{currentStreak}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">day streak</p>
                </div>
              </Link>
            ) : (
              <Link
                to="/achievements"
                className="flex-1 flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/15 active:scale-[0.97] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                  <Flame className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">Start your</p>
                  <p className="text-[10px] text-muted-foreground">first streak!</p>
                </div>
              </Link>
            )}

            {totalPoints > 0 ? (
              <Link
                to="/achievements"
                className="flex-1 flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/15 active:scale-[0.97] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5 text-gold" />
                </div>
                <div>
                  <p className="text-lg font-extrabold text-foreground leading-none">{totalPoints}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">points</p>
                </div>
              </Link>
            ) : (
              <Link
                to="/achievements"
                className="flex-1 flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/15 active:scale-[0.97] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
                  <Trophy className="w-4.5 h-4.5 text-gold" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-tight">Earn your</p>
                  <p className="text-[10px] text-muted-foreground">first points!</p>
                </div>
              </Link>
            )}

            <Link
              to="/recipes"
              className="flex-1 flex items-center gap-2.5 p-3.5 rounded-2xl bg-gradient-to-br from-mint/10 to-mint/5 border border-mint/15 active:scale-[0.97] transition-transform"
            >
              <div className="w-9 h-9 rounded-xl bg-mint/15 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-mint" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-foreground leading-none">{recipes.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">recipes</p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── DESKTOP 2-COLUMN / MOBILE SINGLE COLUMN ── */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-5 lg:space-y-0">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* ── AGE CATEGORIES ── */}
            {!isLoading && (
              <motion.div
                ref={ageCategoriesRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <AgeCategoryCircles babyAgeMonths={babyAgeMonths} />
              </motion.div>
            )}

            {/* ── WHAT TO COOK ── */}
            {!isLoading && (
              <motion.div
                ref={recipeOfDayRef}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <WhatToCookWidget babyAgeMonths={babyAgeMonths} babyName={babyName} />
              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* ── DAILY TIP ── */}
            {!isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl bg-gradient-to-br from-secondary/30 to-peach/20 border border-secondary/30 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    {ageTip.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" />
                      <p className="text-xs font-semibold text-primary">
                        Tip for {babyAgeMonths} months
                      </p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {dailyTip?.tip_text || ageTip.tip}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── EXPLORE RECIPES CTA ── */}
            {!isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link
                  to="/recipes"
                  className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-mint/10 border border-primary/15 active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👩‍🍳</span>
                    <div>
                      <p className="text-sm font-bold text-foreground">Explore All Recipes</p>
                      <p className="text-xs text-muted-foreground">
                        {recipes.length}+ recipes perfect for {babyName || "your baby"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
