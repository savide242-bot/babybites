import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ProgressDonutChartProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
}

const ProgressDonutChart = ({ value, max, size = 80, strokeWidth = 8 }: ProgressDonutChartProps) => {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  const remaining = 100 - percentage;
  
  const data = [
    { name: 'completed', value: percentage },
    { name: 'remaining', value: remaining },
  ];

  // Dynamic color based on progress
  const getProgressColor = () => {
    if (percentage >= 100) return 'hsl(var(--mint))';
    if (percentage >= 70) return 'hsl(var(--primary))';
    if (percentage >= 40) return 'hsl(var(--secondary))';
    return 'hsl(var(--accent))';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size / 2 - strokeWidth - 4}
            outerRadius={size / 2 - 4}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell 
              fill={getProgressColor()} 
            />
            <Cell fill="hsl(var(--muted))" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      >
        <div className="text-center">
          <motion.span 
            className="text-lg font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {percentage}%
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressDonutChart;
