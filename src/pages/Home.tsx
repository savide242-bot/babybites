import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMonths } from "date-fns";
import SolidsClubWelcomeBanner from "@/components/home/SolidsClubWelcomeBanner";
import SolidsClubAgeSection from "@/components/home/SolidsClubAgeSection";
import SolidsClubQuickTools from "@/components/home/SolidsClubQuickTools";

// Import authentic 6-8 Months posters
import posterBreakfast68 from "@/assets/categories/breakfast-6-8m.webp";
import posterLunchDinner68 from "@/assets/categories/lunch-dinner-6-8m.webp";
import posterSnacks68 from "@/assets/categories/snacks-6-8m.webp";
import posterDesserts68 from "@/assets/categories/desserts-smoothies-6-8m.webp";

// Import authentic 9-11 Months posters
import posterBreakfast911 from "@/assets/categories/breakfast-9-11m.webp";
import posterLunchDinner911 from "@/assets/categories/lunch-dinner-9-11m.webp";
import posterSnacks911 from "@/assets/categories/snacks-9-11m.webp";
import posterDesserts911 from "@/assets/categories/desserts-smoothies-9-11m.webp";

import pancakeImg from "@/assets/recipe-323-blueberry-pancakes.jpg";
import riceImg from "@/assets/recipe-317-veggie-fried-rice.jpg";
import smoothieImg from "@/assets/recipe-321-smoothie-bowl.jpg";
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

  // Section 1: 6-8 Months (Official Posters)
  const age6to8Cards = [
    {
      title: "Breakfast",
      subtitle: "little morning moments",
      ageTag: "6-8 Months",
      image: posterBreakfast68,
      link: "/recipes?age=6-8&category=Breakfast",
      isPosterCard: true,
    },
    {
      title: "Lunch-Dinner",
      subtitle: "nourishing little moments",
      ageTag: "6-8 Months",
      image: posterLunchDinner68,
      link: "/recipes?age=6-8&category=Lunch%20%26%20Dinner",
      isPosterCard: true,
    },
    {
      title: "Snacks",
      subtitle: "tiny bites, happy days",
      ageTag: "6-8 Months",
      image: posterSnacks68,
      link: "/recipes?age=6-8&category=Snack",
      isPosterCard: true,
    },
    {
      title: "Desserts-Smoothies",
      subtitle: "sweet, soft and wholesome",
      ageTag: "6-8 Months",
      image: posterDesserts68,
      link: "/recipes?age=6-8&category=Dessert",
      isPosterCard: true,
    },
  ];

  // Section 2: 9-11 Months (Official Posters)
  const age9to11Cards = [
    {
      title: "Breakfast",
      subtitle: "little morning moments",
      ageTag: "9-11 Months",
      image: posterBreakfast911,
      link: "/recipes?age=9-11&category=Breakfast",
      isPosterCard: true,
    },
    {
      title: "Lunch-Dinner",
      subtitle: "nourishing little moments",
      ageTag: "9-11 Months",
      image: posterLunchDinner911,
      link: "/recipes?age=9-11&category=Lunch%20%26%20Dinner",
      isPosterCard: true,
    },
    {
      title: "Snacks",
      subtitle: "tiny bites, happy days",
      ageTag: "9-11 Months",
      image: posterSnacks911,
      link: "/recipes?age=9-11&category=Snack",
      isPosterCard: true,
    },
    {
      title: "Desserts-Smoothies",
      subtitle: "sweet, soft and wholesome",
      ageTag: "9-11 Months",
      image: posterDesserts911,
      link: "/recipes?age=9-11&category=Dessert",
      isPosterCard: true,
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
