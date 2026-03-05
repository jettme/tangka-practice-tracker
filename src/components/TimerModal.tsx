import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, CheckCircle2, Circle, ChevronLeft, Plus, Trash2 } from 'lucide-react';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (duration: number, note: string, images: string[], isCompleteWork: boolean) => void;
  initialNote?: string;
  initialImages?: string[];
  initialIsCompleteWork?: boolean;
  existingDuration?: number;
}

interface MusicTrack {
  id: string;
  name: string;
  url: string;
  type: 'built-in' | 'custom';
}

// 内置音乐列表（使用可靠的 CDN 资源）
const BUILT_IN_TRACKS: MusicTrack[] = [
  {
    id: 'builtin-1',
    name: '静心禅音',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    type: 'built-in'
  },
  {
    id: 'builtin-2',
    name: '藏传颂钵',
    url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_5e5c7c68e7.mp3',
    type: 'built-in'
  },
  {
    id: 'builtin-3',
    name: '山间流水',
    url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_825bbf3e4c.mp3',
    type: 'built-in'
  },
  {
    id: 'builtin-4',
    name: '晨钟暮鼓',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
    type: 'built-in'
  }
];

const STORAGE_KEY = 'tangka-custom-music';

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
  
  // 音乐相关
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(BUILT_IN_TRACKS);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 触摸滑动相关
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  // 加载自定义音乐
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const customTracks: MusicTrack[] = JSON.parse(stored);
        setMusicTracks([...BUILT_IN_TRACKS, ...customTracks]);
      } catch {
        console.error('Failed to load custom music');
      }
    }
  }, []);

  // 保存自定义音乐
  const saveCustomMusic = (tracks: MusicTrack[]) => {
    const customTracks = tracks.filter(t => t.type === 'custom');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTracks));
  };

  // 处理返回键（浏览器/安卓）
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ modal: 'timer' }, '');

    const handlePopState = () => {
      if (seconds > 0 && !showComplete) {
        stopTimer();
      } else {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMusicPanel) {
          setShowMusicPanel(false);
        } else if (seconds > 0 && !showComplete) {
          stopTimer();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, seconds, showComplete, onClose, showMusicPanel]);

  // 初始化音频
  useEffect(() => {
    if (isOpen && !audioRef.current) {
      initAudio();
    }
    
    return () => {
      // 清理函数在组件卸载时调用
    };
  }, [isOpen]);

  const initAudio = () => {
    const track = musicTracks[currentTrackIndex];
    if (!track) return;

    // 清理旧音频
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.volume = 0.5;
    
    // 事件监听
    audio.addEventListener('canplaythrough', () => {
      setAudioLoaded(true);
      setAudioError(null);
      console.log('Audio loaded:', track.name);
    });
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      setAudioError(`无法加载: ${track.name}`);
      setAudioLoaded(true);
    });

    audio.addEventListener('stalled', () => {
      console.warn('Audio stalled');
    });

    // 设置源并加载
    audio.src = track.url;
    audio.load();
    
    audioRef.current = audio;
  };

  // 切换音轨
  const changeTrack = (index?: number) => {
    const newIndex = index !== undefined ? index : (currentTrackIndex + 1) % musicTracks.length;
    setCurrentTrackIndex(newIndex);
    
    // 重新初始化音频
    const wasPlaying = isRunning && audioRef.current && !audioRef.current.paused;
    
    setAudioLoaded(false);
    setAudioError(null);
    
    // 延迟初始化，让状态更新
    setTimeout(() => {
      const track = musicTracks[newIndex];
      if (!track || !audioRef.current) return;

      audioRef.current.src = track.url;
      audioRef.current.load();
      
      if (wasPlaying && !isMuted) {
        audioRef.current.play().catch(err => {
          console.warn('Auto-play failed:', err);
        });
      }
    }, 100);
  };

  // 添加自定义音乐
  const handleAddMusic = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/mp3,audio/mpeg,audio/wav,audio/ogg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // 检查文件大小（限制 10MB）
      if (file.size > 10 * 1024 * 1024) {
        alert('文件太大，请选择小于 10MB 的音频文件');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const newTrack: MusicTrack = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''), // 去掉扩展名
          url: reader.result as string,
          type: 'custom'
        };
        
        const newTracks = [...musicTracks, newTrack];
        setMusicTracks(newTracks);
        saveCustomMusic(newTracks);
        
        // 切换到新添加的音乐
        setTimeout(() => changeTrack(newTracks.length - 1), 100);
        
        alert(`已添加: ${newTrack.name}`);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // 删除自定义音乐
  const handleDeleteMusic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除这首音乐吗？')) return;
    
    const trackIndex = musicTracks.findIndex(t => t.id === id);
    const newTracks = musicTracks.filter(t => t.id !== id);
    setMusicTracks(newTracks);
    saveCustomMusic(newTracks);
    
    // 如果删除的是当前播放的，切换到第一首
    if (trackIndex === currentTrackIndex) {
      changeTrack(0);
    }
  };

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

  // 触摸事件处理
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    
    if (deltaX > 80 && deltaY < 50) {
      if (showMusicPanel) {
        setShowMusicPanel(false);
      } else if (seconds > 0 && !showComplete) {
        stopTimer();
      } else {
        onClose();
      }
    }
  }, [seconds, showComplete, onClose, showMusicPanel]);

  const startTimer = async () => {
    setIsRunning(true);
    
    if (audioRef.current && !isMuted) {
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

  const currentTrack = musicTracks[currentTrackIndex];

  // 音乐选择面板
  if (showMusicPanel) {
    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-4 pt-12 bg-tangka-brown">
          <button
            onClick={() => setShowMusicPanel(false)}
            className="flex items-center gap-1 text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
            <span>返回</span>
          </button>
          <h2 className="text-white font-bold">选择音乐</h2>
          <button
            onClick={handleAddMusic}
            className="p-2 bg-tangka-red rounded-full text-white"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* 音乐列表 */}
        <div className="flex-1 overflow-y-auto bg-tangka-cream p-4">
          <div className="space-y-3">
            {musicTracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => {
                  changeTrack(index);
                  setShowMusicPanel(false);
                }}
                className={`
                  p-4 rounded-xl flex items-center gap-3 cursor-pointer
                  ${currentTrackIndex === index 
                    ? 'bg-tangka-red text-white' 
                    : 'bg-white hover:bg-tangka-sand/50'
                  }
                `}
              >
                <Music className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name}</p>
                  <p className="text-xs opacity-70">
                    {track.type === 'built-in' ? '内置音乐' : '自定义音乐'}
                  </p>
                </div>
                {currentTrackIndex === index && (
                  <span className="text-xs px-2 py-1 bg-white/20 rounded-full">
                    播放中
                  </span>
                )}
                {track.type === 'custom' && (
                  <button
                    onClick={(e) => handleDeleteMusic(track.id, e)}
                    className="p-2 hover:bg-red-500 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 添加音乐提示 */}
          <div className="mt-6 p-4 bg-tangka-sand/30 rounded-xl">
            <h3 className="font-bold mb-2">添加自己的音乐</h3>
            <p className="text-sm text-gray-600 mb-3">
              点击右上角 + 按钮，选择 MP3 格式的音乐文件（最大 10MB）
            </p>
            <button
              onClick={handleAddMusic}
              className="w-full py-3 rounded-xl bg-tangka-red text-white font-medium"
            >
              添加本地音乐
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 完成界面
  if (showComplete) {
    return (
      <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="bg-tangka-cream rounded-3xl w-full max-w-md p-6 animate-in max-h-[90vh] overflow-y-auto relative">
          {/* 返回按钮 */}
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 hover:bg-tangka-sand rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-6 pt-8">
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
    <div 
      className="fixed inset-0 bg-gradient-to-b from-tangka-brown to-tangka-brown/90 z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center p-4 pt-12">
        <button
          onClick={stopTimer}
          className="flex items-center gap-1 text-white/70 hover:text-white"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-sm">返回</span>
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowMusicPanel(true)}
            className="p-2 text-white/70 hover:text-white flex items-center gap-1 bg-white/10 rounded-full"
          >
            <Music className="w-5 h-5" />
            <span className="text-xs max-w-[80px] truncate">
              {currentTrack?.name || '选择音乐'}
            </span>
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
          <p className="text-yellow-400 text-xs mt-4">{audioError}</p>
        )}
        {!audioLoaded && !audioError && (
          <p className="text-white/30 text-xs mt-4">正在加载音乐...</p>
        )}
        {audioLoaded && !audioError && !isMuted && (
          <p className="text-white/30 text-xs mt-4">
            正在播放: {currentTrack?.name}
          </p>
        )}
      </div>

      {/* 滑动提示 */}
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2 opacity-30 pointer-events-none">
        <div className="w-1 h-12 bg-white rounded-full" />
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
        <p className="text-center text-white/20 text-xs mt-2">
          ← 右滑返回 | 点击音乐按钮切换
        </p>
      </div>
    </div>
  );
}
