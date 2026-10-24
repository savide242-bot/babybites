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

// Import authentic 12-23 Months posters
import posterBreakfast1223 from "@/assets/categories/breakfast-12-23m.webp";
import posterLunchDinner1223 from "@/assets/categories/lunch-dinner-12-23m.webp";
import posterSnacks1223 from "@/assets/categories/snacks-12-23m.webp";
import posterDesserts1223 from "@/assets/categories/desserts-smoothies-12-23m.webp";

// Import authentic 24+ Months posters
import posterBreakfast24 from "@/assets/categories/breakfast-24m.webp";
import posterLunchDinner24 from "@/assets/categories/lunch-dinner-24m.webp";
import posterSnacks24 from "@/assets/categories/snacks-24m.webp";
import posterDesserts24 from "@/assets/categories/desserts-smoothies-24m.webp";

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

  // Section 3: 12-23 Months (Official Posters)
  const age12to23Cards = [
    {
      title: "Breakfast",
      subtitle: "little morning moments",
      ageTag: "12-23 Months",
      image: posterBreakfast1223,
      link: "/recipes?age=12-23&category=Breakfast",
      isPosterCard: true,
    },
    {
      title: "Lunch-Dinner",
      subtitle: "nourishing little moments",
      ageTag: "12-23 Months",
      image: posterLunchDinner1223,
      link: "/recipes?age=12-23&category=Lunch%20%26%20Dinner",
      isPosterCard: true,
    },
    {
      title: "Snacks",
      subtitle: "tiny bites, happy days",
      ageTag: "12-23 Months",
      image: posterSnacks1223,
      link: "/recipes?age=12-23&category=Snack",
      isPosterCard: true,
    },
    {
      title: "Desserts-Smoothies",
      subtitle: "sweet, soft and wholesome",
      ageTag: "12-23 Months",
      image: posterDesserts1223,
      link: "/recipes?age=12-23&category=Dessert",
      isPosterCard: true,
    },
  ];

  // Section 4: 24+ Months (Official Posters)
  const age24PlusCards = [
    {
      title: "Breakfast",
      subtitle: "little morning moments",
      ageTag: "24+ Months",
      image: posterBreakfast24,
      link: "/recipes?age=24%2B&category=Breakfast",
      isPosterCard: true,
    },
    {
      title: "Lunch-Dinner",
      subtitle: "nourishing little moments",
      ageTag: "24+ Months",
      image: posterLunchDinner24,
      link: "/recipes?age=24%2B&category=Lunch%20%26%20Dinner",
      isPosterCard: true,
    },
    {
      title: "Snacks",
      subtitle: "tiny bites, happy days",
      ageTag: "24+ Months",
      image: posterSnacks24,
      link: "/recipes?age=24%2B&category=Snack",
      isPosterCard: true,
    },
    {
      title: "Desserts-Smoothies",
      subtitle: "sweet, soft and wholesome",
      ageTag: "24+ Months",
      image: posterDesserts24,
      link: "/recipes?age=24%2B&category=Dessert",
      isPosterCard: true,
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
