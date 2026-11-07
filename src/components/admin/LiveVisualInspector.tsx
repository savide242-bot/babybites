import React, { useState, useEffect, useRef } from "react";
import { useVisualTheme } from "@/hooks/useVisualTheme";
import { useAdminRole } from "@/hooks/useAdminRole";
import { 
  Palette, 
  X, 
  Check, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Sparkles,
  MousePointerClick,
  ChevronRight,
  Globe,
  Focus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Curated luxury pediatric & scandinavian color swatches
const COLOR_PALETTE = [
  { name: "Warm Cream", hex: "#FAF9F5" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Crisp Linen", hex: "#F5F3EC" },
  { name: "Sage Pastel", hex: "#EAF5EE" },
  { name: "Mint Foam", hex: "#E2F4EA" },
  { name: "Forest Green", hex: "#1E5E3A" },
  { name: "Emerald Light", hex: "#48B774" },
  { name: "Peach Cream", hex: "#FFF0E5" },
  { name: "Warm Amber", hex: "#E28743" },
  { name: "Soft Honey", hex: "#FEF7E2" },
  { name: "Blush Rose", hex: "#FDF2F4" },
  { name: "Rose Petal", hex: "#F7D6D8" },
  { name: "Sky Mist", hex: "#EBF8FF" },
  { name: "Soft Lilac", hex: "#F3E8FF" },
  { name: "Stone Slate", hex: "#292524" },
  { name: "Dark Neutral", hex: "#161c18" },
  { name: "Transparent Glass", hex: "rgba(255, 255, 255, 0.85)" },
  { name: "Dark Glass", hex: "rgba(18, 22, 20, 0.85)" },
];

interface LayerNode {
  element: HTMLElement;
  selector: string;
  globalSelector: string;
  label: string;
  kind: "card" | "container" | "header" | "button" | "text" | "box";
  hasVisibleBg: boolean;
  computedBg: string;
}

export const LiveVisualInspector: React.FC = () => {
  const { isAdmin } = useAdminRole();
  const { settings, setElementStyle, removeElementStyle, toggleInspector } = useVisualTheme();
  
  // Active inspector states
  const [layers, setLayers] = useState<LayerNode[]>([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);
  const [applyGlobally, setApplyGlobally] = useState<boolean>(true);
  const [previewBg, setPreviewBg] = useState<string>("");
  const [originalBg, setOriginalBg] = useState<string>("");
  const [customHex, setCustomHex] = useState<string>("#FFFFFF");
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const hoveredElRef = useRef<HTMLElement | null>(null);

  // Injects instant live preview CSS so Tailwind classes are overridden immediately
  const applyLivePreviewCSS = (selector: string, color: string) => {
    let previewStyle = document.getElementById("babybites-inspector-preview-style") as HTMLStyleElement | null;
    if (!previewStyle) {
      previewStyle = document.createElement("style");
      previewStyle.id = "babybites-inspector-preview-style";
      document.head.appendChild(previewStyle);
    }
    if (color) {
      previewStyle.textContent = `${selector} { background-color: ${color} !important; }`;
    } else {
      previewStyle.textContent = "";
    }
  };

  const clearLivePreviewCSS = () => {
    const previewStyle = document.getElementById("babybites-inspector-preview-style");
    if (previewStyle) {
      previewStyle.textContent = "";
    }
  };

  // Build the Layer-by-Layer hierarchy for any clicked element
  const buildLayerHierarchy = (target: HTMLElement): LayerNode[] => {
    const hierarchy: LayerNode[] = [];
    let curr: HTMLElement | null = target;

    while (curr && curr !== document.body && curr !== document.documentElement) {
      // Don't inspect inspector's own elements
      if (curr.id === "babybites-live-inspector-panel" || curr.closest("#babybites-live-inspector-panel")) {
        break;
      }
      if (curr.id === "root" || curr.tagName.toLowerCase() === "main") {
        break;
      }

      const tagName = curr.tagName.toLowerCase();
      const computed = window.getComputedStyle(curr);
      const computedBg = computed.backgroundColor || "transparent";
      const hasVisibleBg = computedBg !== "transparent" && computedBg !== "rgba(0, 0, 0, 0)";

      const classList = Array.from(curr.classList).filter(
        (c) =>
          !c.startsWith("outline") &&
          !c.startsWith("hover:") &&
          !c.startsWith("focus:") &&
          !c.includes("[") &&
          !c.includes(":")
      );

      // Determine human label & category
      let kind: LayerNode["kind"] = "box";
      let label = `<${tagName}>`;

      const isCard =
        classList.some((c) => c.includes("card") || c.includes("rounded-2xl") || c.includes("rounded-3xl")) ||
        (hasVisibleBg && (computed.borderRadius !== "0px" || classList.includes("shadow-sm") || classList.includes("border")));

      const isHeader =
        tagName === "header" ||
        classList.some((c) => c.includes("header") || c.includes("sticky"));

      const isButton =
        tagName === "button" ||
        classList.some((c) => c.includes("btn") || c.includes("button"));

      const isText =
        ["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "label", "b", "strong"].includes(tagName);

      if (isCard) {
        kind = "card";
        label = `📦 Card Background (${hasVisibleBg ? "Filled" : "Container"})`;
      } else if (isHeader) {
        kind = "header";
        label = `🧭 Header / Bar`;
      } else if (isButton) {
        kind = "button";
        label = `🔘 Button`;
      } else if (isText) {
        kind = "text";
        label = `🔤 Text (${tagName.toUpperCase()})`;
      } else {
        kind = "container";
        label = `📄 Container (${tagName})`;
      }

      // Generate precise and global selectors
      let selector = tagName;
      let globalSelector = tagName;

      if (curr.id) {
        selector = `#${curr.id}`;
        globalSelector = `#${curr.id}`;
      } else if (classList.length > 0) {
        // Find defining classes like bg-*, rounded-*, card
        const defining = classList.filter(
          (c) => c.startsWith("bg-") || c.startsWith("rounded-") || c.includes("card") || c.includes("nav") || c.includes("header")
        );
        const topClasses = defining.length > 0 ? defining.slice(0, 3) : classList.slice(0, 2);
        selector = `${tagName}.${topClasses.join(".")}`;
        globalSelector = `.${topClasses.join(".")}`;
      }

      hierarchy.push({
        element: curr,
        selector,
        globalSelector,
        label,
        kind,
        hasVisibleBg,
        computedBg,
      });

      curr = curr.parentElement;
      if (hierarchy.length >= 5) break; // Limit to 5 nested layers for clean UX
    }

    // Reverse so top-level container (Card) is Layer 0, and clicked text is last Layer
    return hierarchy.reverse();
  };

  // Manage click & hover inspection
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

      const hierarchy = buildLayerHierarchy(target);
      if (hierarchy.length === 0) return;

      setLayers(hierarchy);

      // Smart default: If leaf element is transparent, choose the card or container that HAS a visible background!
      let defaultIdx = hierarchy.length - 1;
      const cardWithBgIdx = hierarchy.findIndex((l) => l.kind === "card" && l.hasVisibleBg);
      if (cardWithBgIdx !== -1) {
        defaultIdx = cardWithBgIdx;
      } else {
        const anyVisibleIdx = hierarchy.findIndex((l) => l.hasVisibleBg);
        if (anyVisibleIdx !== -1) {
          defaultIdx = anyVisibleIdx;
        }
      }

      setActiveLayerIndex(defaultIdx);
      const chosenLayer = hierarchy[defaultIdx];
      setOriginalBg(chosenLayer.computedBg);
      setPreviewBg(chosenLayer.computedBg);
      setCustomHex(chosenLayer.computedBg.startsWith("rgb") ? "#FFFFFF" : chosenLayer.computedBg);

      // Highlight active layer with solid outline
      chosenLayer.element.style.outline = "3px solid #1E5E3A";
      chosenLayer.element.style.outlineOffset = "2px";
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

  // Update outline when user switches between layers
  const selectLayer = (index: number) => {
    // Reset previous layer outline
    if (layers[activeLayerIndex]) {
      layers[activeLayerIndex].element.style.outline = "";
    }

    clearLivePreviewCSS();

    setActiveLayerIndex(index);
    const newLayer = layers[index];
    if (newLayer) {
      newLayer.element.style.outline = "3px solid #1E5E3A";
      newLayer.element.style.outlineOffset = "2px";
      setOriginalBg(newLayer.computedBg);
      setPreviewBg(newLayer.computedBg);
      setCustomHex(newLayer.computedBg.startsWith("rgb") ? "#FFFFFF" : newLayer.computedBg);
    }
  };

  // Instant Real-Time Preview
  const handleColorPreview = (color: string) => {
    const currentLayer = layers[activeLayerIndex];
    if (!currentLayer) return;

    setPreviewBg(color);
    setCustomHex(color.startsWith("#") ? color : "#FFFFFF");

    // 1. Direct inline override with !important
    currentLayer.element.style.setProperty("background-color", color, "important");

    // 2. Dynamic CSS rule so child elements or parent cascade show the color preview instantly
    const targetSelector = applyGlobally ? currentLayer.globalSelector : currentLayer.selector;
    applyLivePreviewCSS(targetSelector, color);
  };

  // Commit color and sync across whole app & all users
  const handleApplyColor = () => {
    const currentLayer = layers[activeLayerIndex];
    if (!currentLayer || !previewBg) return;

    const targetSelector = applyGlobally ? currentLayer.globalSelector : currentLayer.selector;

    setElementStyle(targetSelector, { bg: previewBg });
    clearLivePreviewCSS();

    if (currentLayer.element) {
      currentLayer.element.style.outline = "";
    }

    toast.success(`🎉 Color applied successfully for ${currentLayer.label}! Synced across all users.`);
    setLayers([]);
  };

  // Revert back
  const handleCancel = () => {
    clearLivePreviewCSS();
    const currentLayer = layers[activeLayerIndex];
    if (currentLayer && currentLayer.element) {
      currentLayer.element.style.removeProperty("background-color");
      if (originalBg && originalBg !== "transparent" && originalBg !== "rgba(0, 0, 0, 0)") {
        currentLayer.element.style.backgroundColor = originalBg;
      }
      currentLayer.element.style.outline = "";
    }
    setLayers([]);
  };

  const handleResetLayer = () => {
    const currentLayer = layers[activeLayerIndex];
    if (currentLayer) {
      const targetSelector = applyGlobally ? currentLayer.globalSelector : currentLayer.selector;
      removeElementStyle(targetSelector);
      toast.info(`Custom style removed.`);
    }
    handleCancel();
  };

  // Only visible to admin or when actively turned on
  if (!isAdmin && !settings.isInspectorActive) {
    return null;
  }

  const activeLayer = layers[activeLayerIndex];

  return (
    <div
      id="babybites-live-inspector-panel"
      className="fixed bottom-16 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 select-none font-sans"
    >
      {/* Floating Control Pill / Dock */}
      <div className="rounded-full bg-stone-900/95 text-white backdrop-blur-md px-3.5 py-2 shadow-2xl border border-stone-700/80 flex items-center gap-2.5 transition-all">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${settings.isInspectorActive ? "bg-emerald-400 animate-pulse" : "bg-stone-500"}`} />
          <span className="text-xs font-bold tracking-tight">
            {settings.isInspectorActive ? "Inspector Active" : "Visual Inspector"}
          </span>
        </div>

        <button
          onClick={() => toggleInspector()}
          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
            settings.isInspectorActive
              ? "bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-sm"
              : "bg-white/10 hover:bg-white/20 text-white"
          }`}
        >
          {settings.isInspectorActive ? "Exit Inspector" : "Tap to Edit"}
        </button>

        {settings.isInspectorActive && (
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-stone-400 flex items-center justify-center text-xs"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? "+" : "−"}
          </button>
        )}
      </div>

      {/* Layer-by-Layer Visual Dialog */}
      {settings.isInspectorActive && layers.length > 0 && !isMinimized && activeLayer && (
        <div className="w-[340px] sm:w-[380px] bg-stone-900/95 dark:bg-stone-900/95 backdrop-blur-xl border border-stone-700/80 rounded-3xl p-4 shadow-2xl text-white flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-stone-100 flex items-center gap-1.5">
                  Layer Inspector
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                    {layers.length} layers
                  </span>
                </h4>
                <p className="text-[10px] text-stone-400">Select layer for instant live preview</p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/15 text-stone-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layer Selection Stack */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              Select Layer to Customize:
            </span>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
              {layers.map((layer, idx) => {
                const isSelected = idx === activeLayerIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => selectLayer(idx)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all text-xs border ${
                      isSelected
                        ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-semibold"
                        : "bg-white/5 border-white/5 text-stone-300 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-stone-400 font-mono">#{idx + 1}</span>
                      <span className="truncate">{layer.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0" 
                        style={{ backgroundColor: layer.computedBg }}
                        title={`Current color: ${layer.computedBg}`}
                      />
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope Selector: Apply to all similar elements across app OR only this one */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-2 border border-white/5">
            <span className="text-[11px] text-stone-300 flex items-center gap-1.5">
              {applyGlobally ? <Globe className="w-3.5 h-3.5 text-emerald-400" /> : <Focus className="w-3.5 h-3.5 text-amber-400" />}
              {applyGlobally ? "Apply to all matching elements" : "Apply only to this element"}
            </span>
            <button
              onClick={() => {
                setApplyGlobally(!applyGlobally);
                if (previewBg) {
                  const targetSel = !applyGlobally ? activeLayer.globalSelector : activeLayer.selector;
                  applyLivePreviewCSS(targetSel, previewBg);
                }
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-stone-200 transition-colors"
            >
              {applyGlobally ? "Switch to Single" : "Switch to Global"}
            </button>
          </div>

          {/* PALETTE COLOR SWATCHES (Instant Live Preview on tap) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Tap a Color for Instant Live Preview:
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-medium">
                {previewBg || "Original"}
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {COLOR_PALETTE.map((swatch) => (
                <button
                  key={swatch.hex}
                  onClick={() => handleColorPreview(swatch.hex)}
                  title={swatch.name}
                  className="group relative aspect-square rounded-xl border border-white/20 transition-all hover:scale-110 active:scale-95 flex items-center justify-center overflow-hidden shadow-sm"
                  style={{ backgroundColor: swatch.hex }}
                >
                  {previewBg === swatch.hex && (
                    <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Picker Input */}
          <div className="flex items-center gap-2 pt-1 border-t border-white/10">
            <span className="text-[10px] text-stone-400 font-medium">Custom Hex:</span>
            <input
              type="color"
              value={customHex.startsWith("#") ? customHex : "#FFFFFF"}
              onChange={(e) => handleColorPreview(e.target.value)}
              className="w-7 h-7 rounded-lg border border-white/20 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={customHex}
              onChange={(e) => {
                setCustomHex(e.target.value);
                if (e.target.value.startsWith("#") && (e.target.value.length === 4 || e.target.value.length === 7)) {
                  handleColorPreview(e.target.value);
                }
              }}
              placeholder="#FFFFFF"
              className="flex-1 bg-white/10 border border-white/15 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
            />
          </div>

          {/* Action Buttons: Apply, Cancel, Revert */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetLayer}
              className="h-8 text-xs border-white/15 text-stone-300 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-8 text-xs text-stone-400 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyColor}
              className="h-8 text-xs bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold shadow-md gap-1"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              Save
            </Button>
          </div>

        </div>
      )}
    </div>
  );
};

export default LiveVisualInspector;
