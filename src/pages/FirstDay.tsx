import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInMonths } from "date-fns";
import { Sparkles, ChefHat, ArrowRight, Clock, Baby } from "lucide-react";
import { recipes, Recipe } from "@/data/recipes";
import { getRecipeImageById } from "@/data/recipeImages";
import confetti from "canvas-confetti";

const FirstDay = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [babyName, setBabyName] = useState("");
  const [babyAgeMonths, setBabyAgeMonths] = useState(6);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti on mount
    const timer = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3']
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchProfileAndRecipes = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          navigate('/auth');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('baby_name, baby_birth_date')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setBabyName(profile.baby_name || "your baby");
          
          if (profile.baby_birth_date) {
            const birthDate = new Date(profile.baby_birth_date);
            const ageMonths = differenceInMonths(new Date(), birthDate);
            setBabyAgeMonths(Math.max(0, ageMonths));
          }
        }

        // Get recipes based on age
        const recipes = getAgeAppropriateRecipes(babyAgeMonths);
        setRecommendedRecipes(recipes);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndRecipes();
  }, [navigate, babyAgeMonths]);

  const getAgeAppropriateRecipes = (ageMonths: number): Recipe[] => {
    let targetAgeGroup: string;
    
    if (ageMonths < 6) {
      targetAgeGroup = "6-9 months"; // Start with beginner recipes
    } else if (ageMonths < 9) {
      targetAgeGroup = "6-9 months";
    } else if (ageMonths < 12) {
      targetAgeGroup = "9-12 months";
    } else if (ageMonths < 18) {
      targetAgeGroup = "12-18 months";
    } else {
      targetAgeGroup = "18-24 months";
    }

    // Filter recipes by age group and prefer simple ones (purees for younger, finger foods for older)
    const ageFilteredRecipes = recipes.filter(r => r.ageGroup === targetAgeGroup);
    
    // Prioritize categories based on age
    let preferredCategories: string[];
    if (ageMonths < 9) {
      preferredCategories = ["Puree", "Breakfast"];
    } else if (ageMonths < 12) {
      preferredCategories = ["Finger Food", "Puree", "Snack"];
    } else {
      preferredCategories = ["Finger Food", "Lunch", "Dinner"];
    }

    // Sort by preferred categories
    const sortedRecipes = ageFilteredRecipes.sort((a, b) => {
      const aIndex = preferredCategories.indexOf(a.category);
      const bIndex = preferredCategories.indexOf(b.category);
      const aPriority = aIndex === -1 ? 999 : aIndex;
      const bPriority = bIndex === -1 ? 999 : bIndex;
      return aPriority - bPriority;
    });

    // Return top 3 unique recipes
    return sortedRecipes.slice(0, 3);
  };

  const getAgeMessage = () => {
    if (babyAgeMonths < 6) {
      return "Getting ready to start the weaning journey!";
    } else if (babyAgeMonths < 9) {
      return "Perfect time for smooth purees and first tastes!";
    } else if (babyAgeMonths < 12) {
      return "Ready for more textures and finger foods!";
    } else if (babyAgeMonths < 18) {
      return "Exploring family foods and new flavors!";
    } else {
      return "Enjoying diverse meals with the family!";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-pink-200 to-cyan-100 pb-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-8 space-y-6">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary via-mint to-cyan-400 shadow-lg">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Your First Day! 🎉
          </h1>
          <p className="text-muted-foreground">
            Here are 3 perfect recipes to start {babyName}'s journey
          </p>
        </div>

        {/* Baby Age Card */}
        <Card className="border-2 border-white/50 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
              <Baby className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {babyName} is {babyAgeMonths} {babyAgeMonths === 1 ? "month" : "months"} old
              </p>
              <p className="text-sm text-muted-foreground">
                {getAgeMessage()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recommended Recipes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Perfect Starter Recipes
            </h2>
          </div>

          {recommendedRecipes.map((recipe, index) => (
            <Card 
              key={recipe.id}
              className="border-2 border-white/50 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
              onClick={() => navigate(`/recipe/${recipe.id}`)}
            >
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={getRecipeImageById(recipe.id)}
                    alt={recipe.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-3 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      #{index + 1} Pick
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.prepTime}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {recipe.description}
                  </p>
                  <div className="flex gap-1 mt-1">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {recipe.category}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {recipe.ageGroup}
                    </span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={() => navigate('/recipes')}
            className="w-full bg-gradient-to-r from-primary to-mint text-white font-semibold py-6 text-lg hover:shadow-glow transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              Explore All Recipes
              <ArrowRight className="w-5 h-5" />
            </span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full py-6 border-2"
          >
            Go to Home
          </Button>
        </div>

        {/* Tip Card */}
        <Card className="border-2 border-mint/30 bg-mint/10">
          <CardContent className="p-4">
            <p className="text-sm text-foreground">
              <span className="font-semibold">💡 Tip:</span> Start with one new food at a time and wait 3-5 days before introducing another to watch for allergies.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FirstDay;
