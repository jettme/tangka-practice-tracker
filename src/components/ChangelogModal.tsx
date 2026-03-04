import { X, Gift, Sparkles, Wrench, Calendar } from 'lucide-react';
import { CHANGELOG, getVersionTypeColor, getVersionTypeLabel } from '../data/changelog';
import { format, parseISO } from 'date-fns';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  if (!isOpen) return null;

  const getTypeIcon = (type: 'major' | 'minor' | 'patch') => {
    switch (type) {
      case 'major':
        return <Gift className="w-4 h-4" />;
      case 'minor':
        return <Sparkles className="w-4 h-4" />;
      case 'patch':
        return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-tangka-cream rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-in">
        {/* 头部 */}
        <div className="flex justify-between items-center p-4 border-b border-tangka-sand">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-tangka-red/10 rounded-full flex items-center justify-center">
              <Gift className="w-4 h-4 text-tangka-red" />
            </div>
            <div>
              <h3 className="font-bold">版本更新</h3>
              <p className="text-xs text-gray-400">查看每次更新内容</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-tangka-sand rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {CHANGELOG.map((version, index) => (
            <div 
              key={version.version}
              className={`relative pl-6 pb-4 ${index !== CHANGELOG.length - 1 ? 'border-l-2 border-tangka-sand' : ''}`}
            >
              {/* 时间线节点 */}
              <div 
                className="absolute left-0 top-0 w-4 h-4 rounded-full border-2 bg-tangka-cream flex items-center justify-center"
                style={{ borderColor: getVersionTypeColor(version.type) }}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: getVersionTypeColor(version.type) }}
                />
              </div>

              {/* 版本信息 */}
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">v{version.version}</span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full text-white flex items-center gap-1"
                      style={{ backgroundColor: getVersionTypeColor(version.type) }}
                    >
                      {getTypeIcon(version.type)}
                      {getVersionTypeLabel(version.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(version.date), 'yyyy-MM-dd')}
                  </div>
                </div>

                {/* 更新内容 */}
                <ul className="space-y-1.5">
                  {version.updates.map((update, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-tangka-red mt-1.5">•</span>
                      <span>{update}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-tangka-sand text-center">
          <p className="text-xs text-gray-400">
            感谢您的使用，我们会持续改进产品体验
          </p>
        </div>
      </div>
    </div>
  );
}
