import React, { useState } from "react";
import { useVisualTheme } from "@/hooks/useVisualTheme";
import { 
  Palette, 
  Upload, 
  RotateCcw, 
  Sliders, 
  Eye, 
  Layers, 
  Sparkles, 
  Check, 
  Image as ImageIcon,
  MousePointerClick,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import appBgBaby from "@/assets/app-bg-baby.jpg";

const CORE_TABS = [
  { path: "/recipes", label: "All Recipes Library" },
  { path: "/planner", label: "Weekly Meal Planner" },
  { path: "/shopping", label: "Smart Shopping List" },
  { path: "/foods-tried", label: "100 Foods Tried Tracker" },
  { path: "/freezer", label: "Freezer Prep & Stash" },
  { path: "/allergens", label: "Allergen Safety Tracker" },
  { path: "/ingredient-swap", label: "Ingredient Swap" },
  { path: "/growth", label: "Growth & Milestones" },
];

const PRESET_BG_COLORS = [
  { name: "Cream Ivory", hex: "#FAF9F5" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Soft Sage", hex: "#EAF5EE" },
  { name: "Mint Tint", hex: "#E2F4EA" },
  { name: "Warm Linen", hex: "#F5F3EC" },
  { name: "Peach Glow", hex: "#FFF2E8" },
  { name: "Soft Honey", hex: "#FEF9E7" },
  { name: "Blush Rose", hex: "#FDF2F4" },
  { name: "Sky Whisper", hex: "#F0F7FF" },
  { name: "Dark Slate", hex: "#121614" },
];

export const ThemeManagement: React.FC = () => {
  const { 
    settings, 
    setWallpaper, 
    setTabBackground, 
    removeTabBackground, 
    toggleInspector, 
    resetAll 
  } = useVisualTheme();

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [selectedTabPath, setSelectedTabPath] = useState(CORE_TABS[0].path);

  // File upload handler for background photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setWallpaper(result);
        toast.success("🎉 New background image uploaded and applied!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!imageUrlInput.trim()) return;
    setWallpaper(imageUrlInput.trim());
    toast.success("Background image updated from URL!");
    setImageUrlInput("");
  };

  const handleRestoreDefaultPhoto = () => {
    setWallpaper(null, 70, 20, 1.5);
    toast.success("Restored default baby background photo.");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#1E5E3A] via-[#246B42] to-[#1E5E3A] text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-emerald-200 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Palette className="w-3.5 h-3.5" /> App Theme & Visual Customizer
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
              Visual Design & Background Controls
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
              Change background wallpapers, customize individual tab colors, or activate the Live Inspector to style any element on screen with real-time preview.
            </p>
          </div>

          <Button
            onClick={() => toggleInspector(true)}
            className="rounded-full bg-white hover:bg-emerald-50 text-[#1E5E3A] font-bold text-xs px-5 h-10 shadow-sm shrink-0 flex items-center gap-2"
          >
            <MousePointerClick className="w-4 h-4 text-[#48B774]" />
            <span>Launch Live Inspector</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: BACKGROUND WALLPAPER CONTROLS */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Background Wallpaper
            </h3>
            {settings.wallpaperUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestoreDefaultPhoto}
                className="text-xs text-stone-500 hover:text-stone-800 h-8 gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Default
              </Button>
            )}
          </div>

          {/* Current Wallpaper Preview */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100">
            <img
              src={settings.wallpaperUrl || appBgBaby}
              alt="Current background preview"
              style={{
                filter: `blur(${settings.wallpaperBlur}px)`,
                opacity: settings.wallpaperOpacityLight / 100,
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#FAF9F5]/45 pointer-events-none" />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-stone-900/80 text-white text-[10px] font-bold backdrop-blur-md">
              {settings.wallpaperUrl ? "Custom Upload Active" : "Default Baby Wallpaper Active"}
            </div>
          </div>

          {/* Upload Button */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Upload Photo From Device</Label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 hover:border-emerald-500 bg-stone-50 dark:bg-stone-800 text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Choose Image (JPG, PNG, WebP)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Or Paste URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Or Paste Online Image URL</Label>
            <div className="flex items-center gap-2">
              <Input
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/wallpaper.jpg"
                className="h-10 text-xs rounded-xl"
              />
              <Button
                size="sm"
                onClick={handleApplyUrl}
                className="h-10 px-4 rounded-xl bg-forest dark:bg-emerald-600 text-white text-xs font-bold"
              >
                Apply URL
              </Button>
            </div>
          </div>

          {/* Sliders for Opacity and Blur */}
          <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Light Mode Opacity:</span>
                <span className="font-mono font-bold text-emerald-700">{settings.wallpaperOpacityLight}%</span>
              </div>
              <Slider
                value={[settings.wallpaperOpacityLight]}
                min={10}
                max={100}
                step={5}
                onValueChange={(val) => setWallpaper(undefined, val[0])}
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Dark Mode Opacity:</span>
                <span className="font-mono font-bold text-emerald-700">{settings.wallpaperOpacityDark}%</span>
              </div>
              <Slider
                value={[settings.wallpaperOpacityDark]}
                min={5}
                max={60}
                step={5}
                onValueChange={(val) => setWallpaper(undefined, undefined, val[0])}
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-stone-700 dark:text-stone-300">Blur Softening:</span>
                <span className="font-mono font-bold text-emerald-700">{settings.wallpaperBlur}px</span>
              </div>
              <Slider
                value={[settings.wallpaperBlur]}
                min={0}
                max={15}
                step={0.5}
                onValueChange={(val) => setWallpaper(undefined, undefined, undefined, val[0])}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TAB BACKGROUND COLORS & LIVE INSPECTOR */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-5">
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Tab Background Colors
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Select any tab to customize its background hue or tint.
            </p>
          </div>

          {/* Select Tab */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Tab to Customize</Label>
            <select
              value={selectedTabPath}
              onChange={(e) => setSelectedTabPath(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-medium"
            >
              {CORE_TABS.map((t) => (
                <option key={t.path} value={t.path}>
                  {t.label} ({t.path})
                </option>
              ))}
            </select>
          </div>

          {/* Color Swatches for Tab */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Choose Background Tint</Label>
              {settings.tabBackgrounds[selectedTabPath] && (
                <button
                  onClick={() => removeTabBackground(selectedTabPath)}
                  className="text-[11px] text-rose-500 hover:text-rose-600 font-medium"
                >
                  Clear Tab Tint
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_BG_COLORS.map((c) => {
                const isSelected = settings.tabBackgrounds[selectedTabPath] === c.hex;
                return (
                  <button
                    key={c.name}
                    onClick={() => {
                      setTabBackground(selectedTabPath, c.hex);
                      toast.success(`Background tint set for ${selectedTabPath}!`);
                    }}
                    title={c.name}
                    className={`h-11 rounded-xl border transition-all flex flex-col items-center justify-center shadow-2xs hover:scale-105 ${
                      isSelected
                        ? "ring-2 ring-emerald-500 scale-105 border-transparent"
                        : "border-stone-200 dark:border-stone-700"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                    <span className="text-[9px] text-stone-600 dark:text-stone-300 font-medium truncate max-w-[50px]">
                      {c.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.tabBackgrounds[selectedTabPath] || "#FAF9F5"}
                onChange={(e) => setTabBackground(selectedTabPath, e.target.value)}
                className="w-9 h-9 rounded-xl cursor-pointer border border-stone-300 dark:border-stone-700 p-0"
              />
              <span className="text-xs font-mono font-medium text-stone-600 dark:text-stone-300">
                Current: {settings.tabBackgrounds[selectedTabPath] || "Default (Inherited)"}
              </span>
            </div>
          </div>

          {/* Section 3: Live Inspector Guide & Reset */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <h4 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                How the Live Element Inspector Works:
              </h4>
            </div>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              1. Tap <strong>Launch Live Inspector</strong>.<br/>
              2. Navigate to any page in the app and tap on any card, button, or header.<br/>
              3. Select any color to see an <strong>instant live preview</strong> before saving!
            </p>
          </div>

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-400">
              {Object.keys(settings.elementStyles).length} custom element style(s) active
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={resetAll}
              className="text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Reset All to Factory Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeManagement;
