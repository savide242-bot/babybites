// Postpartum Recovery Guide — bonus from Emily Harter
// Promised in the VSL as: "Bónus: Guia de Recuperação Pós-Parto"

export interface RecoverySection {
  id: string;
  icon: string;
  title: string;
  summary: string;
  body: string[];
}

export const postpartumRecoveryGuide: RecoverySection[] = [
  {
    id: "first-weeks",
    icon: "🌷",
    title: "The First 6 Weeks: Be Gentle With Yourself",
    summary: "Your body just performed something extraordinary. Recovery is not linear.",
    body: [
      "Bleeding (lochia) is normal for up to 6 weeks. Bright red turning brown then yellow is expected.",
      "Hormones drop sharply in the first 10 days — emotional waves are biological, not weakness.",
      "Sleep when your baby sleeps, even if it means leaving dishes in the sink. Sleep IS healing.",
      "Drink water before every feed. Breastfeeding alone burns ~500 kcal/day.",
      "If you had stitches (perineal or C-section), keep the area dry and clean. Pain that intensifies after day 3 deserves a call to your doctor.",
    ],
  },
  {
    id: "nutrition",
    icon: "🥗",
    title: "Nutrition That Restores You",
    summary: "What you eat now repairs tissue, balances hormones, and fuels milk production.",
    body: [
      "Protein at every meal: eggs, fish, lentils, chicken — repairs uterine and pelvic tissue.",
      "Iron-rich foods (spinach, red meat, beans) replace what was lost in delivery. Pair with vitamin C (orange, kiwi, peppers) for absorption.",
      "Healthy fats (avocado, olive oil, nuts) support hormone production and brain recovery.",
      "Whole grains stabilize blood sugar — preventing the mood crashes that mimic depression.",
      "AVOID extreme calorie restriction in the first 6 months. Your body interprets it as famine and holds onto fat.",
    ],
  },
  {
    id: "pelvic-floor",
    icon: "💪",
    title: "Pelvic Floor: The Most Ignored Muscle",
    summary: "It carried your baby for 9 months. It needs intentional rebuilding.",
    body: [
      "Start with gentle Kegels from week 2 (vaginal birth) or after your 6-week check (C-section).",
      "If you leak when sneezing, laughing, or jumping after 3 months — that is NOT normal. See a pelvic-floor physiotherapist.",
      "Avoid heavy lifting, crunches, and high-impact exercise for at least 12 weeks.",
      "Walking (10–20 min/day) is the single best early movement. It rebuilds posture and core stability safely.",
    ],
  },
  {
    id: "mental-health",
    icon: "🧠",
    title: "Mental Health: The Invisible Recovery",
    summary: "Baby blues are common. Postpartum depression is different — and treatable.",
    body: [
      "Baby blues: tearful, overwhelmed, peaks day 3–10, resolves by week 2–3.",
      "If sadness, anxiety, hopelessness, or detachment from your baby persist past week 3 — reach out to a professional. This is biology, not a flaw.",
      "Intrusive scary thoughts about your baby are MORE common than mothers admit. Speaking them out loud to a trained therapist removes their power.",
      "Build a 'lifeline list' of 3 people you can text at 3am. Keep it on your fridge.",
    ],
  },
  {
    id: "intimacy",
    icon: "💞",
    title: "Body, Intimacy & Identity",
    summary: "You are not the same woman as before — and that is allowed.",
    body: [
      "Wait for your 6-week check before resuming intercourse. Use lubricant — postpartum dryness is hormonal, not personal.",
      "Body image takes time. Focus on what your body did, not how it looks right now.",
      "Talk to your partner about how you feel. Many fathers don't realize how invisible mothers feel after birth.",
      "Schedule one 'me-moment' per day, even 10 minutes. A shower alone counts.",
    ],
  },
  {
    id: "when-to-call",
    icon: "🚨",
    title: "When to Call Your Doctor Immediately",
    summary: "Trust your instinct. If something feels wrong, it probably is.",
    body: [
      "Heavy bleeding soaking a pad in under 1 hour, or large clots.",
      "Fever above 38°C (100.4°F).",
      "Severe headache that doesn't improve with paracetamol — could indicate postpartum preeclampsia.",
      "Chest pain, shortness of breath, or pain/swelling in one calf — possible blood clot.",
      "Thoughts of harming yourself or your baby — go to the ER. You will not be judged.",
    ],
  },
];
