import React, { useState, useEffect, useRef } from "react";
import { useVisualTheme } from "@/hooks/useVisualTheme";
import { useAdminRole } from "@/hooks/useAdminRole";
import { 
  Palette, 
  X, 
  Check, 
  RotateCcw, 
  Eye, 
  Sliders, 
  Sparkles,
  MousePointerClick,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Curated luxury pediatric & scandinavian color swatches
const COLOR_PALETTE = [
  { name: "Warm Cream", hex: "#FAF9F5" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Crisp Linen", hex: "#F5F3EC" },
  { name: "Sage Pastel", hex: "#EAF5EE" },
  { name: "Forest Green", hex: "#1E5E3A" },
  { name: "Emerald Light", hex: "#48B774" },
  { name: "Mint Foam", hex: "#E0F2E9" },
  { name: "Warm Amber", hex: "#E28743" },
  { name: "Peach Cream", hex: "#FFF0E5" },
  { name: "Soft Honey", hex: "#FEF7E2" },
  { name: "Blush Rose", hex: "#FDF2F4" },
  { name: "Rose Petal", hex: "#F7D6D8" },
  { name: "Sky Mist", hex: "#EBF8FF" },
  { name: "Soft Lilac", hex: "#F3E8FF" },
  { name: "Stone Slate", hex: "#292524" },
  { name: "Dark Neutral", hex: "#161c18" },
  { name: "Transparent Glass", hex: "rgba(255, 255, 255, 0.75)" },
  { name: "Dark Glass", hex: "rgba(18, 22, 20, 0.80)" },
];

export const LiveVisualInspector: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const { settings, setElementStyle, removeElementStyle, toggleInspector, resetAll } = useVisualTheme();
  
  const [selectedTarget, setSelectedTarget] = useState<HTMLElement | null>(null);
  const [targetSelector, setTargetSelector] = useState<string>("");
  const [targetName, setTargetName] = useState<string>("");
  const [originalBg, setOriginalBg] = useState<string>("");
  const [previewBg, setPreviewBg] = useState<string>("");
  const [customHex, setCustomHex] = useState<string>("#FFFFFF");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const hoveredElRef = useRef<HTMLElement | null>(null);

  // Helper to generate a stable, readable selector for clicked element
  const getElementSelector = (el: HTMLElement): { selector: string; label: string } => {
    if (el.id) {
      return { selector: `#${el.id}`, label: `#${el.id}` };
    }

    const tagName = el.tagName.toLowerCase();
    const classList = Array.from(el.classList).filter(
      (c) => !c.startsWith("outline") && !c.startsWith("hover:") && !c.includes("[") && !c.includes(":")
    );

    if (classList.length > 0) {
      // Pick first 2 representative classes
      const classSelector = `.${classList.slice(0, 2).join(".")}`;
      return { selector: `${tagName}${classSelector}`, label: `<${tagName}> .${classList[0]}` };
    }

    return { selector: tagName, label: `<${tagName}>` };
  };

  useEffect(() => {
    if (!settings.isInspectorActive) {
      if (hoveredElRef.current) {
        hoveredElRef.current.style.outline = "";
        hoveredElRef.current = null;
      }
      return;
    }

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("#babybites-live-inspector-panel")) return;

      if (hoveredElRef.current && hoveredElRef.current !== target) {
        hoveredElRef.current.style.outline = "";
      }

      hoveredElRef.current = target;
      target.style.outline = "2px dashed #48B774";
      target.style.outlineOffset = "2px";
      target.style.cursor = "pointer";
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || target.closest("#babybites-live-inspector-panel")) return;

      e.preventDefault();
      e.stopPropagation();

      const { selector, label } = getElementSelector(target);
      const computedBg = window.getComputedStyle(target).backgroundColor;

      setSelectedTarget(target);
      setTargetSelector(selector);
      setTargetName(label);
      setOriginalBg(computedBg);
      setPreviewBg(computedBg);
      setCustomHex(computedBg.startsWith("rgb") ? "#FFFFFF" : computedBg);

      target.style.outline = "3px solid #1E5E3A";
    };

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("click", handleClick, true);
      if (hoveredElRef.current) {
        hoveredElRef.current.style.outline = "";
      }
    };
  }, [settings.isInspectorActive]);

  // Handle instant preview when user taps a color
  const handleColorPreview = (color: string) => {
    setPreviewBg(color);
    setCustomHex(color.startsWith("#") ? color : "#FFFFFF");
    if (selectedTarget) {
      selectedTarget.style.backgroundColor = color;
    }
  };

  // Commit and save the selected color
  const handleApplyColor = () => {
    if (!targetSelector || !previewBg) return;

    setElementStyle(targetSelector, { bg: previewBg });
    toast.success(`Color applied to ${targetName}!`);
    
    if (selectedTarget) {
      selectedTarget.style.outline = "";
    }
    setSelectedTarget(null);
  };

  // Revert back to original
  const handleCancel = () => {
    if (selectedTarget) {
      selectedTarget.style.backgroundColor = originalBg || "";
      selectedTarget.style.outline = "";
    }
    setSelectedTarget(null);
  };

  const handleRemoveStyle = () => {
    if (targetSelector) {
      removeElementStyle(targetSelector);
      toast.info(`Custom style removed for ${targetName}`);
    }
    handleCancel();
  };

  // Only show if admin or if inspector is actively turned on
  if (!isAdmin && !settings.isInspectorActive) {
    return null;
  }

  return (
    <div
      id="babybites-live-inspector-panel"
      className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 select-none"
    >
      {/* Floating Control Pill / Dock */}
      <div className="rounded-full bg-stone-900/95 dark:bg-stone-900/95 text-white backdrop-blur-md px-3.5 py-2 shadow-2xl border border-stone-700/80 flex items-center gap-2.5 transition-all">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${settings.isInspectorActive ? "bg-emerald-400 animate-pulse" : "bg-stone-500"}`} />
          <span className="text-xs font-bold tracking-tight">
            {settings.isInspectorActive ? "Inspector ON" : "Visual Styler"}
          </span>
        </div>

        <button
          onClick={() => toggleInspector()}
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            settings.isInspectorActive
              ? "bg-emerald-500 text-stone-950 hover:bg-emerald-400"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
        >
          {settings.isInspectorActive ? "Stop Inspecting" : "Tap to Style"}
        </button>

        {settings.isInspectorActive && (
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-stone-400 flex items-center justify-center text-xs"
            title={isMinimized ? "Expand inspector" : "Minimize"}
          >
            {isMinimized ? "+" : "−"}
          </button>
        )}
      </div>

      {/* Floating Element Color Picker Dialog (When an element is clicked) */}
      {settings.isInspectorActive && selectedTarget && !isMinimized && (
        <div className="w-80 sm:w-88 rounded-3xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 p-4 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2.5 mb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" /> Live Element Styling
              </span>
              <h4 className="font-serif font-bold text-sm truncate max-w-[200px]" title={targetName}>
                {targetName}
              </h4>
            </div>
            <button
              onClick={handleCancel}
              className="w-7 h-7 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Live Preview Swatch */}
          <div className="mb-3 p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl border border-stone-300 dark:border-stone-600 shadow-2xs"
                style={{ backgroundColor: previewBg }}
              />
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Preview Color:</span>
                <span className="text-xs font-mono font-bold">{previewBg}</span>
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 font-medium">Live On Screen ✨</span>
          </div>

          {/* Swatches Grid */}
          <div className="mb-3">
            <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 block mb-1.5">
              Choose Color Preset (Instant Preview on Tap):
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_PALETTE.map((c) => {
                const isActive = previewBg === c.hex;
                return (
                  <button
                    key={c.name}
                    onClick={() => handleColorPreview(c.hex)}
                    title={c.name}
                    className={`w-9 h-9 rounded-xl border transition-all flex items-center justify-center shadow-2xs hover:scale-110 ${
                      isActive
                        ? "ring-2 ring-emerald-500 scale-105 border-transparent"
                        : "border-stone-300 dark:border-stone-700"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-700 drop-shadow-xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Hex Color Picker */}
          <div className="flex items-center gap-2 mb-4 pt-2 border-t border-stone-100 dark:border-stone-800">
            <label className="text-xs text-stone-500 font-medium whitespace-nowrap">Custom Hex:</label>
            <input
              type="color"
              value={customHex.startsWith("#") && customHex.length === 7 ? customHex : "#FFFFFF"}
              onChange={(e) => handleColorPreview(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300 dark:border-stone-700 p-0"
            />
            <input
              type="text"
              value={previewBg}
              onChange={(e) => handleColorPreview(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 h-8 px-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
            />
          </div>

          {/* Actions: Save / Cancel / Remove */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              onClick={handleRemoveStyle}
              className="text-[11px] text-rose-500 hover:text-rose-600 font-medium px-2 py-1"
            >
              Reset Element
            </button>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="h-8 rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyColor}
                className="h-8 rounded-xl bg-forest dark:bg-emerald-600 hover:bg-forest/90 text-white text-xs font-bold gap-1 shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" /> Save Color
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVisualInspector;
