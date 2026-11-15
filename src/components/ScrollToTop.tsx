import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scrolls window to top on route change,
 * preventing pages (especially recipes) from opening halfway scrolled down.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate instant reset
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    
    // Fallback for containers with custom overflow
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
