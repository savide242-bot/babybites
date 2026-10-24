import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMonths } from "date-fns";
import SolidsClubWelcomeBanner from "@/components/home/SolidsClubWelcomeBanner";
import SolidsClubAgeSection from "@/components/home/SolidsClubAgeSection";
import SolidsClubQuickTools from "@/components/home/SolidsClubQuickTools";

// Import authentic photos from local assets
import porridgeImg from "@/assets/recipe-325-sweet-potato-porridge.jpg";
import soupImg from "@/assets/recipe-324-chicken-veggie-soup.jpg";
import bitesImg from "@/assets/recipe-319-mac-cheese-bites.jpg";
import smoothieImg from "@/assets/recipe-321-smoothie-bowl.jpg";
import pancakeImg from "@/assets/recipe-323-blueberry-pancakes.jpg";
import riceImg from "@/assets/recipe-317-veggie-fried-rice.jpg";
import fruitImg from "@/assets/recipe-318-tropical-fruit-salad.jpg";
import yogurtSwirlImg from "@/assets/recipes/mango-yogurt-swirl.jpg";
import pastaImg from "@/assets/recipe-322-hidden-veggie-pasta.jpg";
import quesadillaImg from "@/assets/recipe-320-veggie-quesadillas.jpg";
import tacosImg from "@/assets/recipe-316-chicken-tacos.jpg";

export const Home = () => {
  const [motherName, setMotherName] = useState<string>("");
  const [babyName, setBabyName] = useState<string>("");
  const [babyAgeMonths, setBabyAgeMonths] = useState<number>(6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("mother_name, baby_name, baby_birth_date")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          setMotherName(profile.mother_name || "");
          setBabyName(profile.baby_name || "");
          if (profile.baby_birth_date) {
            const age = differenceInMonths(new Date(), new Date(profile.baby_birth_date));
            setBabyAgeMonths(Math.max(0, age));
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Section 1: 6-8 Months (Breakfast, Lunch & Dinner, Snack, Dessert)
  const age6to8Cards = [
    {
      title: "Breakfast",
      subtitle: "Smooth morning porridge & wholesome oats.",
      ageTag: "6-8 Months",
      image: porridgeImg,
      link: "/recipes?age=6-8&category=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Nutrient-packed purees, soups & tender lentils.",
      ageTag: "6-8 Months",
      image: soupImg,
      link: "/recipes?age=6-8&category=Lunch%20%26%20Dinner",
    },
    {
      title: "Snacks",
      subtitle: "Soft melt-in-mouth sticks & veggie bites.",
      ageTag: "6-8 Months",
      image: bitesImg,
      link: "/recipes?age=6-8&category=Snack",
    },
    {
      title: "Desserts & Smoothies",
      subtitle: "Gentle cold fruit purees & dairy-free baby sips.",
      ageTag: "6-8 Months",
      image: yogurtSwirlImg,
      link: "/recipes?age=6-8&category=Dessert",
    },
  ];

  // Section 2: 9-11 Months (Breakfast, Lunch & Dinner, Snack, Dessert)
  const age9to11Cards = [
    {
      title: "Breakfast",
      subtitle: "Fluffy banana pancakes & soft egg scrambles.",
      ageTag: "9-11 Months",
      image: pancakeImg,
      link: "/recipes?age=9-11&category=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Tender fish mash, mild curries & savory grains.",
      ageTag: "9-11 Months",
      image: riceImg,
      link: "/recipes?age=9-11&category=Lunch%20%26%20Dinner",
    },
    {
      title: "Snacks",
      subtitle: "Cheesy cauliflower tots & banana oat fingers.",
      ageTag: "9-11 Months",
      image: fruitImg,
      link: "/recipes?age=9-11&category=Snack",
    },
    {
      title: "Desserts & Smoothies",
      subtitle: "Tropical yogurt bowls & chilled natural nicecream.",
      ageTag: "9-11 Months",
      image: smoothieImg,
      link: "/recipes?age=9-11&category=Dessert",
    },
  ];

  // Section 3: 12-23 Months (Breakfast, Lunch & Dinner, Snack, Dessert)
  const age12to23Cards = [
    {
      title: "Breakfast",
      subtitle: "Toddler breakfast wraps, toast & French toasts.",
      ageTag: "12-23 Months",
      image: tacosImg,
      link: "/recipes?age=12-23&category=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Family meals with pasta stars & mini meatballs.",
      ageTag: "12-23 Months",
      image: pastaImg,
      link: "/recipes?age=12-23&category=Lunch%20%26%20Dinner",
    },
    {
      title: "Snacks",
      subtitle: "Veggie quesadillas, crackers & seed energy balls.",
      ageTag: "12-23 Months",
      image: quesadillaImg,
      link: "/recipes?age=12-23&category=Snack",
    },
    {
      title: "Desserts & Smoothies",
      subtitle: "Berry protein smoothies & fruit crumble bowls.",
      ageTag: "12-23 Months",
      image: smoothieImg,
      link: "/recipes?age=12-23&category=Dessert",
    },
  ];

  // Section 4: 24+ Months (Breakfast, Lunch & Dinner, Snack, Dessert)
  const age24PlusCards = [
    {
      title: "Breakfast",
      subtitle: "Hearty French toasts, mini burritos & pancake stacks.",
      ageTag: "24+ Months",
      image: pancakeImg,
      link: "/recipes?age=24%2B&category=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Family favorites, chicken stir-fry & cheesy veggie pasta.",
      ageTag: "24+ Months",
      image: riceImg,
      link: "/recipes?age=24%2B&category=Lunch%20%26%20Dinner",
    },
    {
      title: "Snacks",
      subtitle: "Crispy veggie quesadillas, homemade crackers & bars.",
      ageTag: "24+ Months",
      image: quesadillaImg,
      link: "/recipes?age=24%2B&category=Snack",
    },
    {
      title: "Desserts & Smoothies",
      subtitle: "Thick green smoothies, fruit parfaits & banana nicecream.",
      ageTag: "24+ Months",
      image: smoothieImg,
      link: "/recipes?age=24%2B&category=Dessert",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-24 pt-4 px-4 max-w-2xl mx-auto">
      {/* 1. Welcome Header (The Solids Club Style) */}
      <SolidsClubWelcomeBanner
        motherName={motherName}
        babyName={babyName}
        babyAgeMonths={babyAgeMonths}
      />

      {/* 2. Parent Everyday Tools (Weekly Planner, Pantry, Freezer, Allergens) */}
      <SolidsClubQuickTools />

      {/* 3. Age Section: 6-8 Months */}
      <SolidsClubAgeSection
        title="6–8 Months"
        cards={age6to8Cards}
      />

      {/* 4. Age Section: 9–11 Months */}
      <SolidsClubAgeSection
        title="9–11 Months"
        cards={age9to11Cards}
      />

      {/* 5. Age Section: 12–23 Months */}
      <SolidsClubAgeSection
        title="12–23 Months"
        cards={age12to23Cards}
      />

      {/* 6. Age Section: 24+ Months */}
      <SolidsClubAgeSection
        title="24+ Months"
        cards={age24PlusCards}
      />
    </div>
  );
};

export default Home;
