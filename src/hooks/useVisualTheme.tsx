import { useState, useEffect, useCallback } from "react";

export interface CustomThemeSettings {
  wallpaperUrl: string | null;
  wallpaperOpacityLight: number; // 0 to 100
  wallpaperOpacityDark: number;  // 0 to 100
  wallpaperBlur: number;         // px
  tabBackgrounds: Record<string, string>; // path -> hex color
  elementStyles: Record<string, { bg?: string; text?: string; border?: string }>;
  isInspectorActive: boolean;
}

const DEFAULT_THEME_SETTINGS: CustomThemeSettings = {
  wallpaperUrl: null,
  wallpaperOpacityLight: 70,
  wallpaperOpacityDark: 20,
  wallpaperBlur: 1.5,
  tabBackgrounds: {},
  elementStyles: {},
  isInspectorActive: false,
};

const STORAGE_KEY = "babybites_visual_theme_v2";

export const getStoredThemeSettings = (): CustomThemeSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error("Failed to load visual theme settings", e);
  }
  return DEFAULT_THEME_SETTINGS;
};

export const saveStoredThemeSettings = (settings: CustomThemeSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent("babybites-theme-changed", { detail: settings }));
  } catch (e) {
    console.error("Failed to save visual theme settings", e);
  }
};

// Injects dynamic CSS rules for element styles and tab backgrounds
export const applyThemeToDOM = (settings: CustomThemeSettings) => {
  let styleEl = document.getElementById("babybites-dynamic-theme-styles") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "babybites-dynamic-theme-styles";
    document.head.appendChild(styleEl);
  }

  let css = "";

  // Apply custom element styles
  Object.entries(settings.elementStyles || {}).forEach(([selector, style]) => {
    if (!selector) return;
    const rules: string[] = [];
    if (style.bg) rules.push(`background-color: ${style.bg} !important;`);
    if (style.text) rules.push(`color: ${style.text} !important;`);
    if (style.border) rules.push(`border-color: ${style.border} !important;`);
    if (rules.length > 0) {
      css += `${selector} { ${rules.join(" ")} }\n`;
    }
  });

  styleEl.textContent = css;
};

export const useVisualTheme = () => {
  const [settings, setSettings] = useState<CustomThemeSettings>(getStoredThemeSettings);

  useEffect(() => {
    applyThemeToDOM(settings);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<CustomThemeSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
        applyThemeToDOM(customEvent.detail);
      }
    };

    window.addEventListener("babybites-theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("babybites-theme-changed", handleThemeChange);
    };
  }, [settings]);

  const updateSettings = useCallback((updater: (prev: CustomThemeSettings) => CustomThemeSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      saveStoredThemeSettings(next);
      applyThemeToDOM(next);
      return next;
    });
  }, []);

  const setWallpaper = useCallback((url: string | null, opacityLight?: number, opacityDark?: number, blur?: number) => {
    updateSettings((prev) => ({
      ...prev,
      wallpaperUrl: url !== undefined ? url : prev.wallpaperUrl,
      wallpaperOpacityLight: opacityLight !== undefined ? opacityLight : prev.wallpaperOpacityLight,
      wallpaperOpacityDark: opacityDark !== undefined ? opacityDark : prev.wallpaperOpacityDark,
      wallpaperBlur: blur !== undefined ? blur : prev.wallpaperBlur,
    }));
  }, [updateSettings]);

  const setTabBackground = useCallback((tabPath: string, color: string) => {
    updateSettings((prev) => ({
      ...prev,
      tabBackgrounds: {
        ...prev.tabBackgrounds,
        [tabPath]: color,
      },
    }));
  }, [updateSettings]);

  const removeTabBackground = useCallback((tabPath: string) => {
    updateSettings((prev) => {
      const nextTabBgs = { ...prev.tabBackgrounds };
      delete nextTabBgs[tabPath];
      return {
        ...prev,
        tabBackgrounds: nextTabBgs,
      };
    });
  }, [updateSettings]);

  const setElementStyle = useCallback((selector: string, style: { bg?: string; text?: string; border?: string }) => {
    updateSettings((prev) => ({
      ...prev,
      elementStyles: {
        ...prev.elementStyles,
        [selector]: style,
      },
    }));
  }, [updateSettings]);

  const removeElementStyle = useCallback((selector: string) => {
    updateSettings((prev) => {
      const nextStyles = { ...prev.elementStyles };
      delete nextStyles[selector];
      return {
        ...prev,
        elementStyles: nextStyles,
      };
    });
  }, [updateSettings]);

  const toggleInspector = useCallback((active?: boolean) => {
    updateSettings((prev) => ({
      ...prev,
      isInspectorActive: active !== undefined ? active : !prev.isInspectorActive,
    }));
  }, [updateSettings]);

  const resetAll = useCallback(() => {
    const fresh = { ...DEFAULT_THEME_SETTINGS };
    setSettings(fresh);
    saveStoredThemeSettings(fresh);
    applyThemeToDOM(fresh);
  }, []);

  return {
    settings,
    setWallpaper,
    setTabBackground,
    removeTabBackground,
    setElementStyle,
    removeElementStyle,
    toggleInspector,
    resetAll,
  };
};

export default useVisualTheme;
