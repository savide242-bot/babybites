import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  TrendingUp, 
  Award, 
  Plus, 
  Trash2, 
  Calendar, 
  Ruler, 
  Scale, 
  ShieldCheck, 
  CheckCircle2, 
  Baby, 
  Sparkles,
  ChevronRight,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface GrowthRecord {
  id: string;
  baby_name: string;
  weight_kg: number;
  height_cm: number;
  milestone: string | null;
  notes: string | null;
  recorded_at: string;
}

interface PediatricMilestone {
  id: string;
  stage: "4-6m" | "6-8m" | "9-11m" | "12m+";
  stageLabel: string;
  ageSubtitle: string;
  title: string;
  description: string;
  category: "Readiness" | "Chewing & Oral" | "Motor Skills" | "Independence";
}

const MILESTONES_DATA: PediatricMilestone[] = [
  // 4 to 6 Months
  {
    id: "m_head_control",
    stage: "4-6m",
    stageLabel: "4 to 6 Months",
    ageSubtitle: "First Tastes & Highchair Readiness",
    title: "Steadily Holds Head Upright",
    description: "Maintains strong head and neck control securely in a highchair without slumping.",
    category: "Readiness"
  },
  {
    id: "m_tongue_thrust",
    stage: "4-6m",
    stageLabel: "4 to 6 Months",
    ageSubtitle: "First Tastes & Highchair Readiness",
    title: "Diminished Tongue-Thrust Reflex",
    description: "Doesn't automatically push puree out of mouth with tongue when offered.",
    category: "Chewing & Oral"
  },
  {
    id: "m_spoon_interest",
    stage: "4-6m",
    stageLabel: "4 to 6 Months",
    ageSubtitle: "First Tastes & Highchair Readiness",
    title: "Opens Mouth & Leans Toward Spoon",
    description: "Shows keen curiosity when family eats and opens mouth when food approaches.",
    category: "Readiness"
  },

  // 6 to 8 Months
  {
    id: "m_palmar_grasp",
    stage: "6-8m",
    stageLabel: "6 to 8 Months",
    ageSubtitle: "Textures & Finger Food Exploration",
    title: "Palmar Grasp of Finger Foods",
    description: "Grabs steamed carrot or avocado spear with whole palm and brings it to mouth.",
    category: "Motor Skills"
  },
  {
    id: "m_jaw_munching",
    stage: "6-8m",
    stageLabel: "6 to 8 Months",
    ageSubtitle: "Textures & Finger Food Exploration",
    title: "Up & Down Jaw Munching Movement",
    description: "Moves jaw up and down to mash soft lumps and cooked textures against gums.",
    category: "Chewing & Oral"
  },
  {
    id: "m_supported_sitting",
    stage: "6-8m",
    stageLabel: "6 to 8 Months",
    ageSubtitle: "Textures & Finger Food Exploration",
    title: "Sits Supported for 15+ Minutes",
    description: "Comfortably maintains upright posture throughout an entire meal without fatigue.",
    category: "Readiness"
  },

  // 9 to 11 Months
  {
    id: "m_pincer_grasp",
    stage: "9-11m",
    stageLabel: "9 to 11 Months",
    ageSubtitle: "Fine Motor & Textured Foods",
    title: "Neat Pincer Grasp (Thumb & Index)",
    description: "Picks up tiny pea-sized bites or soft blueberries with tips of two fingers.",
    category: "Motor Skills"
  },
  {
    id: "m_rotary_chewing",
    stage: "9-11m",
    stageLabel: "9 to 11 Months",
    ageSubtitle: "Fine Motor & Textured Foods",
    title: "Lateral Tongue & Rotary Chewing",
    description: "Moves food side-to-side across the tongue to grind thicker textured solids.",
    category: "Chewing & Oral"
  },
  {
    id: "m_independent_eating",
    stage: "9-11m",
    stageLabel: "9 to 11 Months",
    ageSubtitle: "Fine Motor & Textured Foods",
    title: "Self-Feeding Finger Foods",
    description: "Regularly picks up, bites, and finishes pieces of baby food independently.",
    category: "Independence"
  },

  // 12+ Months
  {
    id: "m_open_cup",
    stage: "12m+",
    stageLabel: "12+ Months",
    ageSubtitle: "Toddler Autonomy & Family Table",
    title: "Open Cup Sipping with Few Spills",
    description: "Drinks water or milk from a small open baby cup using both hands.",
    category: "Independence"
  },
  {
    id: "m_spoon_loading",
    stage: "12m+",
    stageLabel: "12+ Months",
    ageSubtitle: "Toddler Autonomy & Family Table",
    title: "Baby Spoon Dipping & Loading",
    description: "Dips baby spoon into yogurt or porridge and guides it into mouth with pride.",
    category: "Motor Skills"
  },
  {
    id: "m_family_meals",
    stage: "12m+",
    stageLabel: "12+ Months",
    ageSubtitle: "Toddler Autonomy & Family Table",
    title: "Sharing Modified Family Table Meals",
    description: "Eats balanced family table meals cut into bite-safe toddler pieces.",
    category: "Independence"
  }
];

export const GrowthTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"growth" | "milestones">("growth");
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>([]);
  const [babyName, setBabyName] = useState("Baby");
  const [babyBirthDate, setBabyBirthDate] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New record modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newMilestone, setNewMilestone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Completed milestones persistence
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("babybites_completed_milestones");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);

        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("baby_name, baby_birth_date")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.baby_name) setBabyName(profile.baby_name);
          if (profile.baby_birth_date) setBabyBirthDate(profile.baby_birth_date);
        }

        // Fetch growth records
        const { data: records } = await supabase
          .from("baby_growth")
          .select("*")
          .eq("user_id", session.user.id)
          .order("recorded_at", { ascending: false });

        if (records && records.length > 0) {
          setGrowthRecords(records);
        } else {
          // Check local storage fallback
          const local = localStorage.getItem("babybites_local_growth");
          if (local) setGrowthRecords(JSON.parse(local));
        }
      } else {
        // Guest mode fallback
        const local = localStorage.getItem("babybites_local_growth");
        if (local) setGrowthRecords(JSON.parse(local));
      }
    } catch (e) {
      console.error("Error loading growth data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate age string (e.g., "7 Months")
  const ageDisplay = useMemo(() => {
    if (!babyBirthDate) return "Infant Growth";
    try {
      const birth = new Date(babyBirthDate);
      const now = new Date();
      const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (diffMonths <= 0) return "Newborn (< 1 mo)";
      if (diffMonths === 1) return "1 Month Old";
      return `${diffMonths} Months Old`;
    } catch {
      return "Infant Growth";
    }
  }, [babyBirthDate]);

  // Stats
  const latestRecord = growthRecords[0] || null;
  const initialRecord = growthRecords[growthRecords.length - 1] || null;
  const totalGainKg = (latestRecord && initialRecord && growthRecords.length > 1) 
    ? (latestRecord.weight_kg - initialRecord.weight_kg).toFixed(2) 
    : null;

  const totalCompletedMilestones = useMemo(() => {
    return Object.values(completedMilestones).filter(Boolean).length;
  }, [completedMilestones]);

  const toggleMilestone = (id: string, title: string) => {
    const next = { ...completedMilestones, [id]: !completedMilestones[id] };
    setCompletedMilestones(next);
    try {
      localStorage.setItem("babybites_completed_milestones", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }

    if (next[id]) {
      toast.success(`🎉 Milestone Reached: ${title}!`);
    }
  };

  const handleSaveMeasurement = async () => {
    const weightNum = parseFloat(newWeight);
    const heightNum = parseFloat(newHeight);

    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 35) {
      toast.error("Please enter a valid weight in kg (e.g., 8.45)");
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 150) {
      toast.error("Please enter a valid length in cm (e.g., 69.5)");
      return;
    }

    setIsSaving(true);
    const recordedTimestamp = new Date(newDate).toISOString();

    const newRecord: GrowthRecord = {
      id: Date.now().toString(),
      baby_name: babyName,
      weight_kg: weightNum,
      height_cm: heightNum,
      milestone: newMilestone.trim() || null,
      notes: newNotes.trim() || null,
      recorded_at: recordedTimestamp
    };

    try {
      if (userId) {
        const { data, error } = await supabase
          .from("baby_growth")
          .insert({
            user_id: userId,
            baby_name: babyName,
            weight_kg: weightNum,
            height_cm: heightNum,
            milestone: newMilestone.trim() || null,
            notes: newNotes.trim() || null,
            recorded_at: recordedTimestamp
          })
          .select()
          .single();

        if (!error && data) {
          newRecord.id = data.id;
        }
      }

      // Update state & local storage
      const updated = [newRecord, ...growthRecords].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      setGrowthRecords(updated);
      localStorage.setItem("babybites_local_growth", JSON.stringify(updated));

      toast.success(`Measurement logged for ${babyName}! 🥑`);
      setNewWeight("");
      setNewHeight("");
      setNewMilestone("");
      setNewNotes("");
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save measurement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm("Delete this measurement entry?")) return;

    try {
      if (userId) {
        await supabase.from("baby_growth").delete().eq("id", id);
      }
      const updated = growthRecords.filter((r) => r.id !== id);
      setGrowthRecords(updated);
      localStorage.setItem("babybites_local_growth", JSON.stringify(updated));
      toast.success("Entry deleted.");
    } catch (e) {
      console.error(e);
      toast.error("Could not delete entry");
    }
  };

  return (
    <div className="relative z-10 min-h-screen bg-[#FAF9F5] dark:bg-[#121614] pb-24 pt-4 px-3.5 sm:px-6 w-full max-w-2xl mx-auto min-w-0 overflow-x-hidden text-stone-950 dark:text-stone-50 transition-colors font-times" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
      <div className="relative z-10 space-y-6">

        {/* HERO PROFILE SUMMARY CARD */}
        <div className="bg-white dark:bg-stone-900 rounded-[28px] border border-[#EBE8DF] dark:border-stone-800 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#EAF5EF] dark:bg-emerald-950/80 border border-[#CCE0D2] dark:border-emerald-800 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-stone-50 tracking-tight">
                  {babyName}'s Growth
                </h1>
                <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-semibold mt-0.5">
                  {ageDisplay} • Pediatric Milestone Companion
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-bold gap-1.5 shadow-sm font-['Times_New_Roman',Times,serif]"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Check-in
            </Button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {/* Weight */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-stone-800/80 border border-[#E0DDD3] dark:border-stone-700 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-xs text-stone-700 dark:text-stone-300 font-bold mb-1">
                <Scale className="w-3.5 h-3.5 text-[#1E5E3A]" />
                <span>Weight</span>
              </div>
              <div className="text-lg sm:text-xl font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-white">
                {latestRecord ? `${latestRecord.weight_kg} kg` : "—"}
              </div>
              <span className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold block mt-0.5">
                {totalGainKg && parseFloat(totalGainKg) > 0 ? `+${totalGainKg} kg total` : "Recent record"}
              </span>
            </div>

            {/* Height */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-stone-800/80 border border-[#E0DDD3] dark:border-stone-700 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-xs text-teal-800 dark:text-teal-300 font-bold mb-1">
                <Ruler className="w-3.5 h-3.5 text-teal-700" />
                <span>Length</span>
              </div>
              <div className="text-lg sm:text-xl font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-white">
                {latestRecord ? `${latestRecord.height_cm} cm` : "—"}
              </div>
              <span className="text-[11px] text-teal-800 dark:text-teal-300 font-semibold block mt-0.5">
                WHO standard
              </span>
            </div>

            {/* Milestones */}
            <div className="p-3.5 rounded-2xl bg-[#FAF9F5] dark:bg-stone-800/80 border border-[#E0DDD3] dark:border-stone-700 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-xs text-rose-800 dark:text-rose-300 font-bold mb-1">
                <Award className="w-3.5 h-3.5 text-rose-600" />
                <span>Milestones</span>
              </div>
              <div className="text-lg sm:text-xl font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-white">
                {totalCompletedMilestones} / 12
              </div>
              <span className="text-[11px] text-rose-800 dark:text-rose-300 font-semibold block mt-0.5">
                {totalCompletedMilestones > 0 ? "Skills active" : "Track first"}
              </span>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("growth")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold font-['Times_New_Roman',Times,serif] transition-all flex items-center justify-center gap-2 ${
              activeTab === "growth"
                ? "bg-[#1E5E3A] text-white shadow-xs"
                : "text-stone-700 dark:text-stone-300 hover:text-stone-950"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Growth Measurements ({growthRecords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("milestones")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold font-['Times_New_Roman',Times,serif] transition-all flex items-center justify-center gap-2 ${
              activeTab === "milestones"
                ? "bg-[#1E5E3A] text-white shadow-xs"
                : "text-stone-700 dark:text-stone-300 hover:text-stone-950"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Feeding Milestones ({totalCompletedMilestones}/12)</span>
          </button>
        </div>

        {/* TAB 1: GROWTH MEASUREMENTS */}
        {activeTab === "growth" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-stone-50">
                  Pediatric Measurement History
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                  Track weight and length progression over time
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddModal(true)}
                className="rounded-full text-xs font-bold border-[#CCE0D2] text-[#1E5E3A] hover:bg-emerald-50 font-['Times_New_Roman',Times,serif]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Entry
              </Button>
            </div>

            {growthRecords.length > 0 ? (
              <div className="space-y-2.5">
                {growthRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-[#E0DDD3] dark:border-stone-800 shadow-2xs hover:border-[#1E5E3A] transition-all flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1 font-['Times_New_Roman',Times,serif]">
                          <Calendar className="w-3.5 h-3.5 text-stone-500" />
                          {new Date(record.recorded_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                        {record.milestone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 border border-emerald-300 font-['Times_New_Roman',Times,serif]">
                            {record.milestone}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm font-bold text-stone-950 dark:text-white font-['Times_New_Roman',Times,serif]">
                        <span className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-[#1E5E3A]" />
                          {record.weight_kg} kg
                        </span>
                        <span className="text-stone-400 dark:text-stone-600">•</span>
                        <span className="flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-teal-700" />
                          {record.height_cm} cm
                        </span>
                      </div>

                      {record.notes && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 italic pt-0.5 font-['Times_New_Roman',Times,serif]">
                          "{record.notes}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="w-8 h-8 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[24px] bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#FAF9F5] dark:bg-stone-800 border border-[#EBE8DF] text-stone-400 mx-auto flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#1E5E3A]" />
                </div>
                <h3 className="text-base font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-stone-50">
                  No Measurements Recorded Yet
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 font-medium max-w-sm mx-auto font-['Times_New_Roman',Times,serif]">
                  Log your baby's current weight and length after pediatric visits to monitor steady, healthy growth.
                </p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-bold px-5 font-['Times_New_Roman',Times,serif]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Record First Measurement
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FEEDING MILESTONES */}
        {activeTab === "milestones" && (
          <div className="space-y-6 font-['Times_New_Roman',Times,serif]">
            <div className="px-1">
              <h2 className="text-lg font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-stone-50">
                Pediatric Feeding & Oral Milestones
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                Check off skills as your baby masters them on their culinary journey
              </p>
            </div>

            {/* Group by stage */}
            {(["4-6m", "6-8m", "9-11m", "12m+"] as const).map((stageKey) => {
              const stageItems = MILESTONES_DATA.filter((m) => m.stage === stageKey);
              const stageCompleted = stageItems.filter((m) => completedMilestones[m.id]).length;
              const allDone = stageCompleted === stageItems.length;

              return (
                <div 
                  key={stageKey}
                  className="bg-white dark:bg-stone-900 rounded-[24px] border border-[#E0DDD3] dark:border-stone-800 p-5 shadow-xs space-y-3"
                >
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#EBE8DF] dark:border-stone-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-['Times_New_Roman',Times,serif] font-bold text-stone-950 dark:text-stone-50">
                          {stageItems[0].stageLabel}
                        </h3>
                        {allDone && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 border border-emerald-300">
                            Stage Complete ✓
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-600 dark:text-stone-400 font-semibold">
                        {stageItems[0].ageSubtitle}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 px-3 py-1 rounded-full bg-[#FAF9F5] dark:bg-stone-800 border border-[#EBE8DF] dark:border-stone-700">
                      {stageCompleted} / {stageItems.length}
                    </span>
                  </div>

                  {/* Milestone Checklist */}
                  <div className="space-y-2.5 pt-1">
                    {stageItems.map((milestone) => {
                      const isChecked = !!completedMilestones[milestone.id];

                      return (
                        <div
                          key={milestone.id}
                          onClick={() => toggleMilestone(milestone.id, milestone.title)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isChecked
                              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-[#CCE0D2] dark:border-emerald-800"
                              : "bg-[#FAF9F5] dark:bg-stone-800/60 border-[#E0DDD3] dark:border-stone-700 hover:border-stone-400"
                          }`}
                        >
                          {/* Checkbox button */}
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked
                                ? "bg-[#1E5E3A] text-white shadow-2xs"
                                : "border-2 border-stone-400 dark:border-stone-500 bg-white dark:bg-stone-800"
                            }`}
                          >
                            {isChecked && <CheckCircle2 className="w-4 h-4" />}
                          </div>

                          {/* Content */}
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className={`text-sm sm:text-base font-['Times_New_Roman',Times,serif] font-bold ${
                                isChecked 
                                  ? "text-[#1E5E3A] dark:text-emerald-300 line-through decoration-emerald-700/60" 
                                  : "text-stone-950 dark:text-stone-50"
                              }`}>
                                {milestone.title}
                              </h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 shrink-0">
                                {milestone.category}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-normal">
                              {milestone.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* LOG MEASUREMENT MODAL */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white dark:bg-stone-900 border border-[#EBE8DF] dark:border-stone-800">
            <DialogHeader>
              <div className="w-10 h-10 rounded-full bg-[#EAF5EF] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
                Log Pediatric Measurement
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500">
                Record {babyName}'s weight and length to keep an organized history.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="dateInput" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Date Recorded
                </Label>
                <Input
                  id="dateInput"
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="weightInput" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Weight (kg) *
                  </Label>
                  <Input
                    id="weightInput"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 8.45"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="mt-1 rounded-xl"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="heightInput" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Length / Height (cm) *
                  </Label>
                  <Input
                    id="heightInput"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 69.5"
                    value={newHeight}
                    onChange={(e) => setNewHeight(e.target.value)}
                    className="mt-1 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="milestoneInput" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Milestone Tag (Optional)
                </Label>
                <Input
                  id="milestoneInput"
                  type="text"
                  placeholder="e.g. 6 Months Checkup, First Tooth"
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  className="mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="notesInput" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Pediatrician Notes (Optional)
                </Label>
                <Textarea
                  id="notesInput"
                  placeholder="e.g. Doctor said baby is tracking well in 50th percentile."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="mt-1 rounded-xl text-xs h-20"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-full text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveMeasurement}
                  disabled={isSaving || !newWeight || !newHeight}
                  className="flex-1 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white text-xs font-semibold"
                >
                  {isSaving ? "Saving..." : "Save Measurement"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default GrowthTracker;
