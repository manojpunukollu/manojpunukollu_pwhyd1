export const getRiskColor = (level: string) => {
  switch (level) {
    case 'CRITICAL': return 'text-google-red border-google-red bg-google-red/10';
    case 'HIGH': return 'text-orange-500 border-orange-500 bg-orange-500/10';
    case 'MEDIUM': return 'text-google-yellow border-google-yellow bg-google-yellow/10';
    default: return 'text-google-green border-google-green bg-google-green/10';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'CRITICAL': return 'bg-google-red text-white';
    case 'HIGH': return 'bg-orange-500 text-white';
    case 'MEDIUM': return 'bg-google-yellow text-black';
    default: return 'bg-google-blue text-white';
  }
};
