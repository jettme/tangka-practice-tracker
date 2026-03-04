import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, VolumeX, Music, CheckCircle2, Circle } from 'lucide-react';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (duration: number, note: string, images: string[], isCompleteWork: boolean) => void;
  initialNote?: string;
  initialImages?: string[];
  initialIsCompleteWork?: boolean;
  existingDuration?: number;
}

// 内置音乐列表（使用免费的放松音乐/佛教音乐）
const MUSIC_TRACKS = [
  {
    name: '静心禅音',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=meditation-impulse-10882.mp3',
    type: 'meditation'
  },
  {
    name: ' Buddhist Chant',
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=buddhist-chant-31826.mp3',
    type: 'buddhist'
  },
  {
    name: '西藏颂钵',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/24/audio_5e5c7c68e7.mp3?filename=tibetan-singing-bowl-7389.mp3',
    type: 'bowl'
  },
  {
    name: '流水禅心',
    url: 'https://cdn.pixabay.com/download/audio/2021/09/06/audio_825bbf3e4c.mp3?filename=relaxing-mountains-rivers-streams-birds-singing-18178.mp3',
    type: 'nature'
  }
];

export function TimerModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  initialNote = '', 
  initialImages = [],
  initialIsCompleteWork = false,
  existingDuration = 0
}: TimerModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [note, setNote] = useState(initialNote);
  const [images, setImages] = useState<string[]>(initialImages);
  const [isCompleteWork, setIsCompleteWork] = useState(initialIsCompleteWork);
  const [showComplete, setShowComplete] = useState(false);
  
  // 音频相关
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 清理函数
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 初始化音频
  useEffect(() => {
    if (isOpen && !audioRef.current) {
      const audio = new Audio(MUSIC_TRACKS[0].url);
      audio.loop = true;
      audio.volume = 0.5;
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        setAudioLoaded(true);
        setAudioError(false);
      });
      
      audio.addEventListener('error', () => {
        console.warn('音频加载失败，继续无音乐模式');
        setAudioError(true);
        setAudioLoaded(true);
      });
      
      audioRef.current = audio;
    }
  }, [isOpen]);

  // 计时器逻辑
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const startTimer = async () => {
    setIsRunning(true);
    
    if (audioRef.current && !isMuted && !audioError) {
      try {
        await audioRef.current.play();
      } catch (e) {
        console.warn('自动播放被阻止:', e);
      }
    }
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (seconds > 0) {
      setShowComplete(true);
    } else {
      onClose();
    }
  };

  const toggleMusic = async () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      setIsMuted(false);
      if (isRunning) {
        try {
          await audioRef.current.play();
        } catch (e) {
          console.warn('播放失败:', e);
        }
      }
    } else {
      setIsMuted(true);
      audioRef.current.pause();
    }
  };

  const changeTrack = () => {
    const nextTrack = (currentTrack + 1) % MUSIC_TRACKS.length;
    setCurrentTrack(nextTrack);
    
    if (audioRef.current) {
      const wasPlaying = !audioRef.current.paused;
      audioRef.current.src = MUSIC_TRACKS[nextTrack].url;
      audioRef.current.load();
      
      if (wasPlaying && !isMuted) {
        audioRef.current.play().catch(console.warn);
      }
    }
  };

  const handleComplete = () => {
    const totalDuration = existingDuration + Math.floor(seconds / 60);
    onComplete(totalDuration, note, images, isCompleteWork);
    
    // 重置状态
    setSeconds(0);
    setShowComplete(false);
    setNote('');
    setImages([]);
    setIsCompleteWork(false);
    setIsRunning(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // 完成界面
  if (showComplete) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-tangka-cream rounded-3xl w-full max-w-md p-6 animate-in max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-tangka-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-10 h-10 text-tangka-gold" />
            </div>
            <h2 className="text-2xl font-bold mb-2">练习完成</h2>
            <p className="text-gray-500">
              本次练习 {formatTime(seconds)}
              {existingDuration > 0 && `（累计 ${existingDuration + Math.floor(seconds / 60)} 分钟）`}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {/* 作品完成标识 */}
            <div 
              onClick={() => setIsCompleteWork(!isCompleteWork)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all
                flex items-center gap-3
                ${isCompleteWork 
                  ? 'border-tangka-gold bg-tangka-gold/10' 
                  : 'border-tangka-sand hover:border-tangka-gold/50'
                }
              `}
            >
              {isCompleteWork ? (
                <CheckCircle2 className="w-6 h-6 text-tangka-gold flex-shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-bold">作品完成</div>
                <div className="text-sm text-gray-500">
                  标记今天完成了一幅完整的唐卡作品
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">心得笔记</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="记录今天的练习感受..."
                className="w-full p-3 rounded-xl bg-white border border-tangka-sand resize-none h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">作品照片</label>
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative">
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleAddImage}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-tangka-sand flex items-center justify-center text-2xl text-gray-400"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowComplete(false);
                setIsRunning(true);
                startTimer();
              }}
              className="flex-1 py-3 rounded-xl bg-tangka-sand font-medium"
            >
              继续练习
            </button>
            <button
              onClick={handleComplete}
              className="flex-1 py-3 rounded-xl bg-tangka-red text-white font-medium"
            >
              保存记录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 计时界面
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-tangka-brown to-tangka-brown/90 z-50 flex flex-col">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center p-4 pt-12">
        <button
          onClick={stopTimer}
          className="p-2 text-white/70 hover:text-white"
        >
          <Square className="w-6 h-6" />
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={changeTrack}
            className="p-2 text-white/70 hover:text-white flex items-center gap-1"
          >
            <Music className="w-5 h-5" />
            <span className="text-xs">{MUSIC_TRACKS[currentTrack].name}</span>
          </button>
          <button
            onClick={toggleMusic}
            className="p-2 text-white/70 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 计时显示 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-8xl font-mono font-bold text-white tracking-wider mb-4">
            {formatTime(seconds)}
          </div>
          {existingDuration > 0 && (
            <p className="text-white/50 text-sm">
              今日已练习 {existingDuration} 分钟
            </p>
          )}
        </div>

        {/* 音乐状态 */}
        {audioError && (
          <p className="text-yellow-400 text-xs mt-4">音乐加载失败，以静音模式继续</p>
        )}
        {!audioLoaded && !audioError && (
          <p className="text-white/30 text-xs mt-4">正在加载音乐...</p>
        )}
      </div>

      {/* 底部控制 */}
      <div className="p-8 pb-16">
        <div className="flex justify-center gap-6">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="w-20 h-20 rounded-full bg-tangka-red flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="w-20 h-20 rounded-full bg-tangka-gold flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
              <Pause className="w-10 h-10 text-tangka-brown" fill="currentColor" />
            </button>
          )}
        </div>
        
        <p className="text-center text-white/40 text-sm mt-6">
          {isRunning ? '专注练习中...' : '点击开始练习'}
        </p>
      </div>
    </div>
  );
}
