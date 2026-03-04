import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'red' | 'gold' | 'brown';
}

export function StatCard({ title, value, subtitle, icon, color = 'red' }: StatCardProps) {
  const colorClasses = {
    red: 'from-tangka-red/20 to-tangka-red/5 text-tangka-red',
    gold: 'from-yellow-400/20 to-yellow-400/5 text-yellow-600',
    brown: 'from-tangka-brown/20 to-tangka-brown/5 text-tangka-brown',
  };
  
  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} border-0`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-70 mb-1">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 bg-white/50 rounded-xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
