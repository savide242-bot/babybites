import { useEffect, useState } from 'react';

export const useCountUp = (end: number, duration: number = 1500, start: number = 0) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (start === end) return;

    const startTime = Date.now();
    const range = end - start;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeOut = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.round(start + range * easeOut));

      if (progress === 1) {
        clearInterval(timer);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [end, duration, start]);

  return count;
};
