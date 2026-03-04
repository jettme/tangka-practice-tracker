import { useEffect, useState } from 'react';
import { db, type CheckIn } from '../db/database';
import { format, startOfMonth, endOfMonth, getDay, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { getCalendarInfo, getDisplayLunarDate, getFestivalText } from '../utils/calendar';
import { Award } from 'lucide-react';

interface HeatmapProps {
  year?: number;
  month?: number;
  onSelect?: (date: string) => void;
}

export function Heatmap({ year = new Date().getFullYear(), month = new Date().getMonth(), onSelect }: HeatmapProps) {
  const [checkIns, setCheckIns] = useState<Map<string, CheckIn>>(new Map());
  const [calendarInfos, setCalendarInfos] = useState<Map<string, ReturnType<typeof getCalendarInfo>>>(new Map());
  
  useEffect(() => {
    loadData();
  }, [year, month]);
  
  async function loadData() {
    const data = await db.checkIns
      .filter(ci => {
        const d = new Date(ci.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .toArray();
    
    const map = new Map(data.map(ci => [ci.date, ci]));
    setCheckIns(map);
    
    const calendarMap = new Map();
    const start = startOfMonth(new Date(year, month));
    const end = endOfMonth(new Date(year, month));
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      calendarMap.set(dateStr, getCalendarInfo(new Date(d)));
    }
    setCalendarInfos(calendarMap);
  }
  
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const daysInMonth = end.getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const startWeekday = getDay(start);
  const emptyCells = Array(startWeekday).fill(null);
  
  const getIntensity = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd');
    const ci = checkIns.get(key);
    if (!ci) return 0;
    if (ci.duration >= 120) return 4;
    if (ci.duration >= 60) return 3;
    if (ci.duration >= 30) return 2;
    return 1;
  };
  
  const isCompleteWork = (dateStr: string) => {
    const ci = checkIns.get(dateStr);
    return ci?.isCompleteWork || false;
  };
  
  const intensityColors = [
    'bg-tangka-sand/30',
    'bg-tangka-red/30',
    'bg-tangka-red/50',
    'bg-tangka-red/70',
    'bg-tangka-red',
  ];
  
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">
          {format(new Date(year, month), 'yyyy年 M月', { locale: zhCN })}
        </h3>
        <div className="flex gap-2 text-xs text-gray-500">
          <span>少</span>
          <div className="flex gap-1">
            {intensityColors.slice(1).map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded ${c}`} />
            ))}
          </div>
          <span>多</span>
          <span className="ml-2 flex items-center gap-1">
            <Award className="w-3 h-3 text-tangka-gold" />
            作品
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
        ))}
        {emptyCells.map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(dayNum => {
          const day = new Date(year, month, dayNum);
          const intensity = getIntensity(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
          const hasCompleteWork = isCompleteWork(dateStr);
          const calendarInfo = calendarInfos.get(dateStr);
          const festival = calendarInfo ? getFestivalText(calendarInfo) : undefined;
          const lunarDate = calendarInfo ? getDisplayLunarDate(calendarInfo) : '';
          
          return (
            <button
              key={dateStr}
              onClick={() => onSelect?.(dateStr)}
              className={`
                relative aspect-square rounded-lg flex flex-col items-center justify-center
                ${intensity > 0 ? intensityColors[intensity] : 'bg-tangka-sand/10'}
                ${isToday ? 'ring-2 ring-tangka-gold' : ''}
                ${intensity > 0 ? 'text-white' : 'text-gray-700'}
                ${hasCompleteWork ? 'ring-2 ring-tangka-gold shadow-md' : ''}
                active:scale-90 transition-transform
              `}
            >
              <span className={`text-sm font-medium ${hasCompleteWork ? 'text-tangka-brown' : ''}`}>
                {dayNum}
              </span>
              
              <span className={`
                text-[10px] leading-tight truncate w-full text-center px-1
                ${festival 
                  ? 'text-tangka-red font-medium' 
                  : hasCompleteWork ? 'text-tangka-brown/70' : 'text-white/80'
                }
              `}>
                {festival || lunarDate}
              </span>
              
              {hasCompleteWork && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-tangka-gold rounded-full flex items-center justify-center">
                  <Award className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YearHeatmap() {
  const [data, setData] = useState<Map<string, { duration: number; isCompleteWork: boolean }>>(new Map());
  
  useEffect(() => {
    loadYearData();
  }, []);
  
  async function loadYearData() {
    const checkIns = await db.checkIns.toArray();
    const map = new Map<string, { duration: number; isCompleteWork: boolean }>();
    
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const ci = checkIns.find(c => c.date === key);
      map.set(key, { 
        duration: ci ? ci.duration : 0,
        isCompleteWork: ci ? ci.isCompleteWork : false
      });
    }
    
    setData(map);
  }
  
  const weeks = 12;
  
  return (
    <div className="flex gap-1 overflow-x-auto py-2">
      {Array.from({ length: weeks }).map((_, weekIdx) => (
        <div key={weekIdx} className="flex flex-col gap-1">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const dayOffset = (weeks - 1 - weekIdx) * 7 + (6 - dayIdx);
            const date = subDays(new Date(), dayOffset);
            const key = format(date, 'yyyy-MM-dd');
            const dayData = data.get(key) || { duration: 0, isCompleteWork: false };
            
            let color = 'bg-tangka-sand/20';
            if (dayData.duration > 0) {
              if (dayData.duration >= 120) color = 'bg-tangka-red';
              else if (dayData.duration >= 60) color = 'bg-tangka-red/70';
              else if (dayData.duration >= 30) color = 'bg-tangka-red/50';
              else color = 'bg-tangka-red/30';
            }
            
            return (
              <div key={`${weekIdx}-${dayIdx}`} className="relative">
                <div
                  className={`w-3 h-3 rounded-sm ${color}`}
                  title={`${key}: ${dayData.duration}分钟${dayData.isCompleteWork ? ' · 作品完成' : ''}`}
                />
                {dayData.isCompleteWork && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-tangka-gold rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
