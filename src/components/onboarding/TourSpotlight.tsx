import { useEffect, useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TourSpotlightProps {
  targetRef?: RefObject<HTMLElement>;
  isActive: boolean;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const TourSpotlight = ({ targetRef, isActive, children, position = 'bottom' }: TourSpotlightProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!targetRef?.current || !isActive) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const rect = targetRef.current?.getBoundingClientRect();
      if (rect) {
        setTargetRect(rect);
      }
    };

    updateRect();
    
    // Update on scroll and resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetRef, isActive]);

  if (!isActive) return null;

  const padding = 8;
  const tooltipOffset = 16;

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    switch (position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - targetRect.top + tooltipOffset}px`,
          left: `${targetRect.left + scrollX + targetRect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + scrollY + tooltipOffset}px`,
          left: `${targetRect.left + scrollX + targetRect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: `${targetRect.top + scrollY + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + tooltipOffset}px`,
          transform: 'translateY(-50%)'
        };
      case 'right':
        return {
          top: `${targetRect.top + scrollY + targetRect.height / 2}px`,
          left: `${targetRect.right + scrollX + tooltipOffset}px`,
          transform: 'translateY(-50%)'
        };
      default:
        return {
          top: `${targetRect.bottom + scrollY + tooltipOffset}px`,
          left: `${targetRect.left + scrollX + targetRect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay with cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              background: targetRect
                ? `radial-gradient(ellipse ${targetRect.width + padding * 2}px ${targetRect.height + padding * 2}px at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 50%, rgba(0,0,0,0.75) 51%)`
                : 'rgba(0,0,0,0.75)'
            }}
          />

          {/* Spotlight ring around target */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="fixed z-[101] pointer-events-none rounded-2xl border-2 border-primary/50 shadow-[0_0_20px_rgba(var(--primary)/0.3)]"
              style={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={cn(
              "fixed z-[102] w-[calc(100vw-32px)] max-w-sm",
              !targetRect && "pointer-events-auto"
            )}
            style={getTooltipStyle()}
          >
            {children}
          </motion.div>

          {/* Click blocker except on tooltip */}
          <div className="fixed inset-0 z-[99]" />
        </>
      )}
    </AnimatePresence>
  );
};

export default TourSpotlight;
