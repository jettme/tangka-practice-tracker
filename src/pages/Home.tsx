import { useEffect, useState } from 'react';
import { useCheckInStore } from '../stores/checkInStore';
import { useSettingsStore } from '../stores/settingsStore';
import { CheckInButton } from '../components/CheckInButton';
import { ShareCard } from '../components/ShareCard';
import { Heatmap, YearHeatmap } from '../components/Heatmap';
import { StatCard } from '../components/StatCard';
import { Flame, Calendar, Clock, Award, Lightbulb, Share2, RefreshCw, Palette } from 'lucide-react';
import { formatDuration } from '../utils/format';
import { getDailyTip, getRandomTip, tangkaTips } from '../data/tips';

export function Home() {
  const { streak, totalDays, totalMinutes, completeWorks, todayCheckIn, loadToday } = useCheckInStore();
  const { userName } = useSettingsStore();
  const [tip, setTip] = useState(tangkaTips[0]);
  const [showShare, setShowShare] = useState(false);
  
  useEffect(() => {
    loadToday();
    setTip(getDailyTip());
  }, []);
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 11) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const refreshTip = () => {
    setTip(getRandomTip());
  };
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 bg-gradient-to-b from-tangka-sand/50 to-transparent">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">
              {greeting()}{userName ? `，${userName}` : ''}
            </h1>
            <p className="text-gray-500 mt-1">坚持练习，日日精进</p>
          </div>
          {todayCheckIn && (
            <button
              onClick={() => setShowShare(true)}
              className="p-3 bg-tangka-red/10 rounded-full text-tangka-red hover:bg-tangka-red/20 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="px-4 space-y-6">
        {/* 打卡按钮 */}
        <CheckInButton />
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="连续打卡"
            value={`${streak}天`}
            subtitle="保持好习惯"
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            color="red"
          />
          <StatCard
            title="累计练习"
            value={formatDuration(totalMinutes)}
            subtitle={`${totalDays}天`}
            icon={<Clock className="w-5 h-5 text-blue-500" />}
            color="brown"
          />
          <StatCard
            title="完整作品"
            value={`${completeWorks}幅`}
            subtitle="继续加油"
            icon={<Palette className="w-5 h-5 text-tangka-gold" />}
            color="gold"
          />
          <StatCard
            title="打卡天数"
            value={`${totalDays}天`}
            subtitle="坚持就是胜利"
            icon={<Calendar className="w-5 h-5 text-green-500" />}
            color="brown"
          />
        </div>
        
        {/* 本月热力图 */}
        <div className="card">
          <Heatmap />
        </div>
        
        {/* 近期趋势 */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-tangka-red" />
            <h3 className="font-bold">近12周练习趋势</h3>
          </div>
          <YearHeatmap />
        </div>
        
        {/* 动态Tips */}
        <div className="bg-gradient-to-r from-tangka-gold/20 to-tangka-gold/5 rounded-2xl p-4 relative">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-tangka-gold/30 rounded-full flex items-center justify-center flex-shrink-0">
              {tip.type === 'knowledge' ? (
                <Lightbulb className="w-5 h-5 text-tangka-gold" />
              ) : (
                <Award className="w-5 h-5 text-tangka-gold" />
              )}
            </div>
            <div className="flex-1 pr-8">
              <h4 className="font-bold text-sm mb-1">
                {tip.type === 'knowledge' ? '唐卡小知识' : '每日心语'}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {tip.content}
              </p>
            </div>
          </div>
          <button
            onClick={refreshTip}
            className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-tangka-red transition-colors"
            title="换一条"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 分享卡片 */}
      {todayCheckIn && (
        <ShareCard
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          date={todayCheckIn.date}
          duration={todayCheckIn.duration}
          streak={streak}
          totalDays={totalDays}
          note={todayCheckIn.note}
        />
      )}
    </div>
  );
}
