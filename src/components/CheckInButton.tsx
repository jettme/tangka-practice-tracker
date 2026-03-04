import { useState } from 'react';
import { useCheckInStore } from '../stores/checkInStore';
import { TimerModal } from './TimerModal';
import { Check, Play, Award } from 'lucide-react';

interface CheckInButtonProps {
  onSuccess?: () => void;
}

export function CheckInButton({ onSuccess }: CheckInButtonProps) {
  const { todayCheckIn, checkIn, updateToday, loadToday } = useCheckInStore();
  const [showTimer, setShowTimer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const hasCheckedIn = !!todayCheckIn;
  
  async function handleComplete(duration: number, note: string, images: string[], isCompleteWork: boolean) {
    setIsLoading(true);
    
    try {
      if (hasCheckedIn) {
        // 更新已有记录，累加时长，合并图片
        const mergedImages = [...(todayCheckIn.imageData || []), ...images];
        // 如果之前已经标记为作品完成，保持完成状态
        const finalIsCompleteWork = todayCheckIn.isCompleteWork || isCompleteWork;
        await updateToday(duration, note, mergedImages, finalIsCompleteWork);
      } else {
        // 创建新记录
        await checkIn(duration, note, images, isCompleteWork);
      }
      
      await loadToday();
      setShowTimer(false);
      onSuccess?.();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <>
      <button
        onClick={() => setShowTimer(true)}
        disabled={isLoading}
        className={`
          w-full py-4 rounded-2xl font-bold text-lg shadow-lg
          flex items-center justify-center gap-2
          transition-all active:scale-95
          ${hasCheckedIn 
            ? todayCheckIn?.isCompleteWork
              ? 'bg-gradient-to-r from-tangka-gold to-yellow-400 text-tangka-brown'
              : 'bg-tangka-sand text-tangka-brown'
            : 'bg-tangka-red text-white'
          }
          disabled:opacity-50
        `}
      >
        {isLoading ? (
          <span>保存中...</span>
        ) : hasCheckedIn ? (
          <>
            {todayCheckIn?.isCompleteWork ? (
              <Award className="w-6 h-6" />
            ) : (
              <Check className="w-6 h-6" />
            )}
            今日已练习 {todayCheckIn?.duration} 分钟
            {todayCheckIn?.isCompleteWork && <span className="ml-1">· 作品完成</span>}
            <span className="text-sm font-normal opacity-70">（点击继续）</span>
          </>
        ) : (
          <>
            <Play className="w-6 h-6" />
            开始练习打卡
          </>
        )}
      </button>
      
      <TimerModal
        isOpen={showTimer}
        onClose={() => setShowTimer(false)}
        onComplete={handleComplete}
        initialNote={todayCheckIn?.note || ''}
        initialImages={[]}
        initialIsCompleteWork={todayCheckIn?.isCompleteWork || false}
        existingDuration={todayCheckIn?.duration || 0}
      />
    </>
  );
}
