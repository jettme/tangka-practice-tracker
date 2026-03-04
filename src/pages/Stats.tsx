import { useEffect, useState } from 'react';
import { db, type CheckIn, getCompleteWorkStats } from '../db/database';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { StatCard } from '../components/StatCard';
import { Flame, Clock, Calendar, TrendingUp, Award, Palette } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export function Stats() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    totalMinutes: 0,
    avgDuration: 0,
    maxStreak: 0,
    thisWeekMinutes: 0,
    lastWeekMinutes: 0,
    completeWorks: 0,
    workDuration: 0,
    monthlyCompleteWorks: 0,
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    const all = await db.checkIns.toArray();
    setCheckIns(all);
    
    // Calculate stats
    const totalDays = all.length;
    const totalMinutes = all.reduce((sum, ci) => sum + ci.duration, 0);
    const avgDuration = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;
    
    // Calculate max streak
    const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;
    
    for (const ci of sorted) {
      const date = parseISO(ci.date);
      if (prevDate) {
        const diff = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          currentStreak++;
        } else {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      prevDate = date;
    }
    maxStreak = Math.max(maxStreak, currentStreak);
    
    // Weekly stats
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);
    
    const thisWeekMinutes = all
      .filter(ci => {
        const d = parseISO(ci.date);
        return d >= thisWeekStart && d <= thisWeekEnd;
      })
      .reduce((sum, ci) => sum + ci.duration, 0);
    
    const lastWeekMinutes = all
      .filter(ci => {
        const d = parseISO(ci.date);
        return d >= lastWeekStart && d <= lastWeekEnd;
      })
      .reduce((sum, ci) => sum + ci.duration, 0);
    
    // Complete work stats
    const workStats = await getCompleteWorkStats();
    
    setStats({
      totalDays,
      totalMinutes,
      avgDuration,
      maxStreak,
      thisWeekMinutes,
      lastWeekMinutes,
      completeWorks: workStats.totalCompleteWorks,
      workDuration: workStats.totalWorkDuration,
      monthlyCompleteWorks: workStats.monthlyCompleteWorks,
    });
  }
  
  // Weekly chart data
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });
  
  const weekData = weekDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const ci = checkIns.find(c => c.date === dateStr);
    return {
      day: format(day, 'E', { locale: zhCN }),
      minutes: ci?.duration || 0,
      isCompleteWork: ci?.isCompleteWork || false,
    };
  });
  
  // Duration distribution
  const ranges = [
    { label: '<30分', min: 0, max: 30, color: '#E8DFD0' },
    { label: '30-60分', min: 30, max: 60, color: '#C6282833' },
    { label: '60-90分', min: 60, max: 90, color: '#C6282866' },
    { label: '90分+', min: 90, max: Infinity, color: '#C62828' },
  ];
  
  const distribution = ranges.map(r => ({
    name: r.label,
    value: checkIns.filter(ci => ci.duration >= r.min && ci.duration < r.max).length,
    color: r.color,
  })).filter(d => d.value > 0);
  
  const weekGrowth = stats.lastWeekMinutes > 0
    ? Math.round(((stats.thisWeekMinutes - stats.lastWeekMinutes) / stats.lastWeekMinutes) * 100)
    : 0;
  
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">数据统计</h1>
      </div>
      
      <div className="px-4 space-y-4">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="总练习天数"
            value={`${stats.totalDays}天`}
            icon={<Calendar className="w-5 h-5 text-blue-500" />}
            color="brown"
          />
          <StatCard
            title="平均时长"
            value={`${stats.avgDuration}分`}
            icon={<Clock className="w-5 h-5 text-green-500" />}
            color="gold"
          />
          <StatCard
            title="最长连续"
            value={`${stats.maxStreak}天`}
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            color="red"
          />
          <StatCard
            title="本周增长"
            value={weekGrowth >= 0 ? `+${weekGrowth}%` : `${weekGrowth}%`}
            subtitle={`${stats.thisWeekMinutes}分钟`}
            icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
            color="gold"
          />
        </div>

        {/* 作品统计 - 新增 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-tangka-gold" />
            作品统计
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-tangka-gold/10 rounded-xl">
              <div className="text-2xl font-bold text-tangka-gold">{stats.completeWorks}</div>
              <div className="text-xs text-gray-500 mt-1">完整作品</div>
            </div>
            <div className="text-center p-3 bg-tangka-gold/10 rounded-xl">
              <div className="text-2xl font-bold text-tangka-gold">{stats.monthlyCompleteWorks}</div>
              <div className="text-xs text-gray-500 mt-1">本月作品</div>
            </div>
            <div className="text-center p-3 bg-tangka-gold/10 rounded-xl">
              <div className="text-2xl font-bold text-tangka-gold">
                {stats.completeWorks > 0 ? Math.round(stats.workDuration / stats.completeWorks) : 0}
              </div>
              <div className="text-xs text-gray-500 mt-1">平均耗时(分)</div>
            </div>
          </div>
        </div>
        
        {/* 本周趋势 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-tangka-red" />
            本周练习趋势
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value, _name, props) => {
                    const isComplete = props?.payload?.isCompleteWork;
                    return [`${value}分钟${isComplete ? ' (作品完成)' : ''}`, '练习时长'];
                  }}
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="minutes" 
                  fill="#C62828" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 时长分布 */}
        {distribution.length > 0 && (
          <div className="card">
            <h3 className="font-bold mb-4">练习时长分布</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 flex-wrap mt-2">
              {distribution.map(d => (
                <div key={d.name} className="flex items-center gap-1 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: d.color }}
                  />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 里程碑 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-tangka-gold" />
            练习里程碑
          </h3>
          <div className="space-y-3">
            {[
              { label: '初入门径', desc: '累计练习7天', target: 7, current: Math.min(stats.totalDays, 7) },
              { label: '渐入佳境', desc: '累计练习30天', target: 30, current: Math.min(stats.totalDays, 30) },
              { label: '持之以恒', desc: '累计练习100天', target: 100, current: Math.min(stats.totalDays, 100) },
              { label: '大师之路', desc: '累计练习365天', target: 365, current: Math.min(stats.totalDays, 365) },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-gray-500">{m.current}/{m.target}</span>
                </div>
                <div className="h-2 bg-tangka-sand rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tangka-red rounded-full transition-all"
                    style={{ width: `${(m.current / m.target) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 作品里程碑 - 新增 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-tangka-gold" />
            作品里程碑
          </h3>
          <div className="space-y-3">
            {[
              { label: '初出茅庐', desc: '完成1幅完整作品', target: 1, current: Math.min(stats.completeWorks, 1) },
              { label: '渐入佳境', desc: '完成5幅完整作品', target: 5, current: Math.min(stats.completeWorks, 5) },
              { label: '技艺精进', desc: '完成20幅完整作品', target: 20, current: Math.min(stats.completeWorks, 20) },
              { label: '大师风范', desc: '完成50幅完整作品', target: 50, current: Math.min(stats.completeWorks, 50) },
              { label: '传世之作', desc: '完成100幅完整作品', target: 100, current: Math.min(stats.completeWorks, 100) },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-gray-500">{m.current}/{m.target}</span>
                </div>
                <div className="h-2 bg-tangka-sand rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-tangka-gold rounded-full transition-all"
                    style={{ width: `${(m.current / m.target) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
