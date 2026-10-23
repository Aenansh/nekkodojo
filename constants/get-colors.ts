export const CHART_COLORS = [
  "#ef4444",       
  "#f97316",          
  "#eab308",          
  "#22c55e",         
  "#06b6d4",        
  "#3b82f6",        
  "#8b5cf6",          
  "#d946ef",           
  "#f43f5e",        
];

export const getCategoryColor = (index: number) => {
  return CHART_COLORS[index % CHART_COLORS.length];
};
