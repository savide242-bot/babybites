import { motion } from "framer-motion";

const BabyIllustration = () => {
  return (
    <motion.div 
      className="relative w-32 h-32 mx-auto"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Background circle with gradient */}
      <motion.div 
        className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-mint/20 to-peach/30"
        animate={{ 
          scale: [1, 1.05, 1],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Inner glowing circle */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/10 to-mint/10 backdrop-blur-sm" />
      
      {/* Baby face SVG */}
      <svg
        viewBox="0 0 100 100"
        className="relative w-full h-full p-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Baby head - soft peachy color */}
        <motion.circle
          cx="50"
          cy="50"
          r="35"
          className="fill-peach"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        />
        
        {/* Cheeks - rosy glow */}
        <motion.circle
          cx="32"
          cy="55"
          r="6"
          className="fill-primary/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        <motion.circle
          cx="68"
          cy="55"
          r="6"
          className="fill-primary/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        />
        
        {/* Eyes - cute closed happy eyes */}
        <motion.path
          d="M35 48 Q40 44 45 48"
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        />
        <motion.path
          d="M55 48 Q60 44 65 48"
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        />
        
        {/* Cute smile */}
        <motion.path
          d="M40 60 Q50 70 60 60"
          stroke="hsl(var(--foreground))"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        />
        
        {/* Little hair tuft */}
        <motion.path
          d="M45 18 Q50 10 55 18"
          stroke="hsl(var(--accent))"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        />
        <motion.path
          d="M48 20 Q52 12 56 20"
          stroke="hsl(var(--accent))"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 0.2 }}
        />
      </svg>
      
      {/* Floating food icons around the baby */}
      <motion.span
        className="absolute -top-2 -right-2 text-2xl"
        animate={{ 
          y: [-2, 2, -2],
          rotate: [-5, 5, -5]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        🥕
      </motion.span>
      
      <motion.span
        className="absolute -bottom-1 -left-3 text-xl"
        animate={{ 
          y: [2, -2, 2],
          rotate: [5, -5, 5]
        }}
        transition={{ 
          duration: 2.5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        🥣
      </motion.span>
      
      <motion.span
        className="absolute top-1/2 -right-5 text-lg"
        animate={{ 
          x: [-2, 2, -2],
          rotate: [-8, 8, -8]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      >
        🍌
      </motion.span>
    </motion.div>
  );
};

export default BabyIllustration;
