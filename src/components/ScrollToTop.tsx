import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// In-memory cache for scroll positions per route path
const scrollPositions: Record<string, number> = {};

/**
 * Intelligent scroll manager:
 * - When navigating FORWARD (PUSH), saves current scroll and resets new page to top.
 * - When navigating BACK (POP) from a recipe or detail page, restores the previous exact scroll position!
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const prevPathRef = useRef(pathname);

  // Continuously record scroll position for the current path
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      scrollPositions[pathname] = currentScroll;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  // Handle route change
  useEffect(() => {
    prevPathRef.current = pathname;

    // If navigating back (history POP)
    if (navType === "POP") {
      const savedY = scrollPositions[pathname];
      if (typeof savedY === "number" && savedY > 0) {
        // Wait for page layout/DOM to mount before restoring scroll
        const frameId = requestAnimationFrame(() => {
          window.scrollTo({ top: savedY, left: 0, behavior: "instant" as ScrollBehavior });
          document.documentElement.scrollTop = savedY;
          document.body.scrollTop = savedY;
        });
        return () => cancelAnimationFrame(frameId);
      }
    }

    // Default for fresh PUSH navigations: reset to top
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
