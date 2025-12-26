import { useEffect, useState, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [targetRef, isActive]);

  if (!isActive) return null;

  const padding = 12;
  const tooltipOffset = 20;

  // Calculate pointing hand position
  const getHandPosition = () => {
    if (!targetRect) return null;
    
    return {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left + targetRect.width / 2,
    };
  };

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return { 
        position: 'fixed',
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      };
    }

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    switch (position) {
      case 'top':
        return {
          position: 'fixed',
          bottom: viewportHeight - targetRect.top + tooltipOffset,
          left: Math.min(Math.max(16, targetRect.left + targetRect.width / 2), viewportWidth - 16),
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 32px)',
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: targetRect.bottom + tooltipOffset,
          left: Math.min(Math.max(16, targetRect.left + targetRect.width / 2), viewportWidth - 16),
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 32px)',
        };
      default:
        return {
          position: 'fixed',
          top: targetRect.bottom + tooltipOffset,
          left: Math.min(Math.max(16, targetRect.left + targetRect.width / 2), viewportWidth - 16),
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 32px)',
        };
    }
  };

  const handPos = getHandPosition();

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Dark overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] bg-black/70"
          />

          {/* Spotlight cutout */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="fixed z-[101] pointer-events-none rounded-2xl"
              style={{
                top: targetRect.top - padding,
                left: targetRect.left - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 30px 10px hsl(var(--primary) / 0.3)',
                border: '2px solid hsl(var(--primary) / 0.6)',
              }}
            />
          )}

          {/* Pointing hand animation */}
          {handPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -8, 0],
              }}
              transition={{ 
                opacity: { duration: 0.3, delay: 0.2 },
                scale: { duration: 0.3, delay: 0.2 },
                y: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="fixed z-[102] pointer-events-none"
              style={{
                top: handPos.top - 20,
                left: handPos.left - 15,
              }}
            >
              <span className="text-4xl drop-shadow-lg">👆</span>
            </motion.div>
          )}

          {/* Tooltip content */}
          <motion.div
            initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="z-[103] w-full max-w-sm"
            style={getTooltipStyle()}
          >
            {children}
          </motion.div>

          {/* Click blocker */}
          <div className="fixed inset-0 z-[99]" />
        </>
      )}
    </AnimatePresence>
  );
};

export default TourSpotlight;
