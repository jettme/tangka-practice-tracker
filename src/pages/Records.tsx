import { useEffect, useState } from 'react';
import { db, type CheckIn } from '../db/database';
import { useCheckInStore } from '../stores/checkInStore';
import { ShareCard } from '../components/ShareCard';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Clock, ChevronLeft, ChevronRight, Image as ImageIcon, Share2, Award } from 'lucide-react';
import { Heatmap } from '../components/Heatmap';

export function Records() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [shareCheckIn, setShareCheckIn] = useState<CheckIn | null>(null);
  const { streak, totalDays } = useCheckInStore();
  
  useEffect(() => {
    loadData();
  }, [currentDate]);
  
  async function loadData() {
    const data = await db.checkIns
      .where('date')
      .between(
        format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd'),
        format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd')
      )
      .reverse()
      .toArray();
    setCheckIns(data);
  }
  
  const selectedCheckIn = selectedDate 
    ? checkIns.find(ci => ci.date === selectedDate)
    : null;
  
  function prevMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1));
    setSelectedDate(null);
  }
  
  function nextMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1));
    setSelectedDate(null);
  }
  
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">练习记录</h1>
      </div>
      
      <div className="px-4 space-y-4">
        {/* 月份切换 */}
        <div className="flex items-center justify-between">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-tangka-sand rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-tangka-sand rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* 日历热力图 */}
        <div className="card">
          <Heatmap 
            year={currentDate.getFullYear()} 
            month={currentDate.getMonth()}
            onSelect={setSelectedDate}
          />
        </div>
        
        {/* 选中日期的详情 */}
        {selectedCheckIn && (
          <div className={`card ${selectedCheckIn.isCompleteWork ? 'border-tangka-gold ring-2 ring-tangka-gold/30' : 'border-tangka-red/30'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-tangka-red" />
                <span className="font-bold">
                  {format(parseISO(selectedCheckIn.date), 'M月d日', { locale: zhCN })}
                </span>
                {selectedCheckIn.isCompleteWork && (
                  <span className="px-2 py-0.5 bg-tangka-gold/20 text-tangka-gold text-xs rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    作品完成
                  </span>
                )}
              </div>
              <button
                onClick={() => setShareCheckIn(selectedCheckIn)}
                className="p-2 bg-tangka-red/10 rounded-full text-tangka-red hover:bg-tangka-red/20 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <Clock className="w-4 h-4" />
              <span>练习 {selectedCheckIn.duration} 分钟</span>
            </div>
            {selectedCheckIn.note && (
              <p className="text-sm text-gray-700 bg-tangka-sand/30 p-3 rounded-xl mb-3">
                {selectedCheckIn.note}
              </p>
            )}
            {selectedCheckIn.imageData.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedCheckIn.imageData.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img}
                    alt={`作品${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* 列表 */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-gray-500">本月记录</h3>
          {checkIns.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>本月暂无练习记录</p>
            </div>
          ) : (
            checkIns.map(ci => (
              <div 
                key={ci.date}
                onClick={() => setSelectedDate(ci.date)}
                className={`
                  card p-3 flex items-center gap-3 cursor-pointer
                  ${selectedDate === ci.date ? 'ring-2 ring-tangka-red' : ''}
                  ${ci.isCompleteWork ? 'bg-gradient-to-r from-tangka-gold/10 to-transparent border-tangka-gold/30' : ''}
                `}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ci.isCompleteWork ? 'bg-tangka-gold/20' : 'bg-tangka-red/10'}`}>
                  {ci.isCompleteWork ? (
                    <Award className="w-6 h-6 text-tangka-gold" />
                  ) : (
                    <span className="text-lg font-bold text-tangka-red">
                      {format(parseISO(ci.date), 'd')}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    {format(parseISO(ci.date), 'EEEE', { locale: zhCN })}
                    {ci.isCompleteWork && (
                      <span className="text-xs px-1.5 py-0.5 bg-tangka-gold/20 text-tangka-gold rounded">作品</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    练习 {ci.duration} 分钟
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareCheckIn(ci);
                  }}
                  className="p-2 text-gray-400 hover:text-tangka-red transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {ci.imageData.length > 0 && (
                  <div className="flex items-center gap-1 text-gray-400">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs">{ci.imageData.length}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 分享卡片 */}
      {shareCheckIn && (
        <ShareCard
          isOpen={!!shareCheckIn}
          onClose={() => setShareCheckIn(null)}
          date={shareCheckIn.date}
          duration={shareCheckIn.duration}
          streak={streak}
          totalDays={totalDays}
          note={shareCheckIn.note}
        />
      )}
    </div>
  );
}
