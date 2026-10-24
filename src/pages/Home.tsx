import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { differenceInMonths } from "date-fns";
import SolidsClubWelcomeBanner from "@/components/home/SolidsClubWelcomeBanner";
import SolidsClubAgeSection from "@/components/home/SolidsClubAgeSection";
import SolidsClubQuickTools from "@/components/home/SolidsClubQuickTools";

// Import authentic images from assets
import porridgeImg from "@/assets/recipe-325-sweet-potato-porridge.jpg";
import soupImg from "@/assets/recipe-324-chicken-veggie-soup.jpg";
import bitesImg from "@/assets/recipe-319-mac-cheese-bites.jpg";
import pancakeImg from "@/assets/recipe-323-blueberry-pancakes.jpg";
import riceImg from "@/assets/recipe-317-veggie-fried-rice.jpg";
import fruitImg from "@/assets/recipe-318-tropical-fruit-salad.jpg";
import bowlImg from "@/assets/recipe-321-smoothie-bowl.jpg";
import pastaImg from "@/assets/recipe-322-hidden-veggie-pasta.jpg";
import quesadillaImg from "@/assets/recipe-320-veggie-quesadillas.jpg";

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

  // Section 1: 6-8 Months
  const age6to8Cards = [
    {
      title: "Breakfast",
      subtitle: "Simple morning purees & smooth oats for little starters.",
      ageTag: "6-8 Months",
      image: porridgeImg,
      link: "/recipes?age=6-9&meal=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Simple, nourishing vegetable & lentil meals.",
      ageTag: "6-8 Months",
      image: soupImg,
      link: "/recipes?age=6-9&meal=Lunch",
    },
    {
      title: "Finger Foods",
      subtitle: "Soft graspable sticks to introduce self-feeding safely.",
      ageTag: "6-8 Months",
      image: bitesImg,
      link: "/recipes?age=6-9&category=Finger%20Food",
    },
  ];

  // Section 2: 9-11 Months
  const age9to11Cards = [
    {
      title: "Breakfast",
      subtitle: "Fluffy banana pancakes & gentle fruit cups.",
      ageTag: "9-11 Months",
      image: pancakeImg,
      link: "/recipes?age=9-12&meal=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Textured mash, flaky fish & tender veggies.",
      ageTag: "9-11 Months",
      image: riceImg,
      link: "/recipes?age=9-12&meal=Lunch",
    },
    {
      title: "Snacks",
      subtitle: "Healthy baked bites & refreshing fruit yogurt.",
      ageTag: "9-11 Months",
      image: fruitImg,
      link: "/recipes?age=9-12&meal=Snack",
    },
  ];

  // Section 3: 12-23 Months
  const age12to23Cards = [
    {
      title: "Breakfast",
      subtitle: "Hearty toddler bowls, French toast & energy bites.",
      ageTag: "12-23 Months",
      image: bowlImg,
      link: "/recipes?age=12-18&meal=Breakfast",
    },
    {
      title: "Lunch & Dinner",
      subtitle: "Family meals adapted for tiny teeth & hands.",
      ageTag: "12-23 Months",
      image: pastaImg,
      link: "/recipes?age=12-18&meal=Lunch",
    },
    {
      title: "Snacks & Treats",
      subtitle: "Nutrient-packed finger bars, quesadillas & muffins.",
      ageTag: "12-23 Months",
      image: quesadillaImg,
      link: "/recipes?age=12-18&meal=Snack",
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

      {/* 2. Parent Everyday Tools (Item 02 & 04: Planner, Pantry, Freezer, Allergens) */}
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
    </div>
  );
};

export default Home;
