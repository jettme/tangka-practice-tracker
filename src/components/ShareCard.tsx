import { useRef, useState, useEffect, useCallback } from 'react';
import { Share2, Download, X, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  duration: number;
  streak: number;
  totalDays: number;
  note?: string;
}

export function ShareCard({ 
  isOpen, 
  onClose, 
  date, 
  duration, 
  streak, 
  totalDays,
  note 
}: ShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 触摸滑动相关
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);

  // 处理返回键（浏览器/安卓）
  useEffect(() => {
    if (!isOpen) return;

    // 添加历史记录，使能使用返回键关闭
    window.history.pushState({ modal: 'share' }, '');

    const handlePopState = () => {
      // 用户点击返回键，关闭弹窗
      onClose();
    };

    // 监听返回事件
    window.addEventListener('popstate', handlePopState);

    // 监听 ESC 键
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  // 触摸移动
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  // 触摸结束 - 检测右滑返回
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    
    // 右滑超过 80px 且垂直滑动不超过 50px，触发返回
    if (deltaX > 80 && deltaY < 50) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      generateCard();
    }
  }, [isOpen, date, duration, streak, totalDays, note]);

  const generateCard = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布尺寸 (2x for retina)
    const width = 750;
    const height = 1334;
    canvas.width = width;
    canvas.height = height;

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#FAF6F0');
    gradient.addColorStop(1, '#E8DFD0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 装饰图案 - 顶部
    ctx.strokeStyle = '#C62828';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, 100);
    ctx.lineTo(width - 50, 100);
    ctx.stroke();

    // 绘制圆形装饰
    ctx.beginPath();
    ctx.arc(width / 2, 200, 80, 0, Math.PI * 2);
    ctx.strokeStyle = '#C62828';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 内部圆
    ctx.beginPath();
    ctx.arc(width / 2, 200, 60, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 标题
    ctx.fillStyle = '#3E2723';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('唐卡练习打卡', width / 2, 350);

    // 日期
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillStyle = '#666';
    const dateObj = new Date(date);
    ctx.fillText(
      format(dateObj, 'yyyy年M月d日 EEEE', { locale: zhCN }),
      width / 2,
      420
    );

    // 主要数据区域
    const centerY = 600;
    
    // 练习时长大数字
    ctx.font = 'bold 120px system-ui, sans-serif';
    ctx.fillStyle = '#C62828';
    ctx.fillText(String(duration), width / 2, centerY);
    
    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = '#3E2723';
    ctx.fillText('分钟', width / 2, centerY + 60);

    // 分隔线
    ctx.beginPath();
    ctx.moveTo(150, centerY + 120);
    ctx.lineTo(width - 150, centerY + 120);
    ctx.strokeStyle = '#E8DFD0';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 统计数据
    const statsY = centerY + 220;
    const statSpacing = 200;
    const startX = width / 2 - statSpacing;

    // 连续打卡
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillStyle = '#C62828';
    ctx.fillText(String(streak), startX, statsY);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('连续天数', startX, statsY + 40);

    // 累计天数
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillStyle = '#C62828';
    ctx.fillText(String(totalDays), startX + statSpacing * 2, statsY);
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('累计天数', startX + statSpacing * 2, statsY + 40);

    // 心得笔记（如果有）
    if (note) {
      const noteY = statsY + 140;
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillStyle = '#666';
      ctx.fillText('今日心得', width / 2, noteY);
      
      ctx.font = 'italic 32px system-ui, sans-serif';
      ctx.fillStyle = '#3E2723';
      
      // 处理长文本换行
      const maxWidth = 600;
      const lineHeight = 50;
      let y = noteY + 60;
      
      const words = note.split('');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line, width / 2, y);
          line = words[i];
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, y);
    }

    // 底部装饰文字
    const bottomY = height - 150;
    ctx.font = '28px system-ui, sans-serif';
    ctx.fillStyle = '#999';
    ctx.fillText('坚持练习，日日精进', width / 2, bottomY);

    // 生成图片
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setGeneratedImage(dataUrl);
    setIsGenerating(false);
  };

  const handleNativeShare = async () => {
    if (!generatedImage) return;

    // 尝试使用 Web Share API
    if (navigator.share) {
      try {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `tangka-checkin-${date}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: '唐卡练习打卡',
          text: `今日练习${duration}分钟，已连续打卡${streak}天！`,
          files: [file]
        });
        return;
      } catch (error) {
        console.log('Native share failed, falling back to download');
      }
    }

    // 如果不支持或失败，下载图片
    handleDownload();
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.download = `tangka-checkin-${date}.png`;
    link.href = generatedImage;
    link.click();
    
    alert('图片已保存，请在相册中分享到朋友圈！');
  };

  const handleWechatShare = () => {
    // 显示提示
    alert('请保存图片后，打开微信 → 朋友圈 → 从相册选择图片分享');
    handleDownload();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="bg-tangka-cream rounded-3xl w-full max-w-sm overflow-hidden animate-in relative">
        {/* 返回按钮 - 新增 */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-tangka-sand pl-16">
          <h3 className="font-bold text-lg">分享打卡</h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-tangka-sand rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 滑动提示 - 新增 */}
        <div className="absolute top-1/2 left-2 transform -translate-y-1/2 opacity-30 pointer-events-none">
          <div className="w-1 h-12 bg-white rounded-full" />
        </div>

        {/* 预览区域 */}
        <div className="p-4 bg-gray-100">
          {isGenerating ? (
            <div className="aspect-[9/16] bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">生成中...</span>
            </div>
          ) : generatedImage ? (
            <img 
              src={generatedImage} 
              alt="分享卡片"
              className="w-full rounded-lg shadow-lg"
            />
          ) : null}
          
          {/* 隐藏的画布 */}
          <canvas 
            ref={canvasRef}
            className="hidden"
          />
        </div>

        {/* 分享按钮 */}
        <div className="p-4 space-y-3">
          <button
            onClick={handleNativeShare}
            className="w-full py-3 rounded-xl bg-tangka-red text-white font-medium flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            分享
          </button>
          
          <button
            onClick={handleWechatShare}
            className="w-full py-3 rounded-xl bg-green-500 text-white font-medium"
          >
            分享到朋友圈
          </button>
          
          <button
            onClick={handleDownload}
            className="w-full py-3 rounded-xl bg-tangka-sand text-tangka-brown font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            保存图片
          </button>
        </div>

        {/* 手势提示 */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-gray-400">
            ← 右滑返回 | 点击左上角返回
          </p>
        </div>
      </div>
    </div>
  );
}
