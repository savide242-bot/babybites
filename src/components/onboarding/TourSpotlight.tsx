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

  // Calculate pointing hand position
  const getHandPosition = () => {
    if (!targetRect) return null;
    
    return {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left + targetRect.width / 2,
    };
  };

  // Determine best position for tooltip based on available space
  const getResponsivePosition = () => {
    if (!targetRect) return 'bottom';
    
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    
    // If element is in bottom half, show tooltip above
    if (spaceBelow < 200 && spaceAbove > spaceBelow) {
      return 'top';
    }
    return position;
  };

  const actualPosition = getResponsivePosition();

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
            className="fixed inset-0 z-[100] bg-black/75"
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
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 30px 10px hsl(var(--primary) / 0.4)',
                border: '3px solid hsl(var(--primary))',
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
                y: [0, -10, 0],
              }}
              transition={{ 
                opacity: { duration: 0.3, delay: 0.2 },
                scale: { duration: 0.3, delay: 0.2 },
                y: { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
              }}
              className="fixed z-[102] pointer-events-none"
              style={{
                top: handPos.top - 24,
                left: handPos.left - 16,
              }}
            >
              <span className="text-5xl drop-shadow-lg filter">👆</span>
            </motion.div>
          )}

          {/* Tooltip content - fully responsive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="fixed z-[103] left-4 right-4 mx-auto"
            style={{
              maxWidth: '360px',
              ...(targetRect ? (
                actualPosition === 'top' 
                  ? { bottom: window.innerHeight - targetRect.top + 24 }
                  : { top: targetRect.bottom + 24 }
              ) : {
                top: '50%',
                transform: 'translateY(-50%)'
              })
            }}
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
