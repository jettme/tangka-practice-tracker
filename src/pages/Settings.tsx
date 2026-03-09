import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useNotificationStore, checkNotificationPermission, testNotification, initNotifications } from '../stores/notificationStore';
import { ChangelogModal } from '../components/ChangelogModal';
import { 
  Bell, User, Download, Upload, Trash2, 
  ChevronRight, Palette, Gift, ExternalLink, BellRing, Volume2, VolumeX
} from 'lucide-react';
import { getLatestVersion } from '../data/changelog';

export function Settings() {
  const {
    userName,
    setUserName,
    exportData,
    importData,
  } = useSettingsStore();
  
  const {
    dailyReminder,
    reminderTime,
    setReminder,
  } = useNotificationStore();
  
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importDataStr, setImportDataStr] = useState('');
  const [showChangelog, setShowChangelog] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default'>('default');
  const [isNativeApp, setIsNativeApp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 检查通知权限和环境
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await checkNotificationPermission();
      setNotificationStatus(hasPermission ? 'granted' : 'default');
      
      // 检测是否在原生 App 中
      const native = typeof (window as any).Capacitor !== 'undefined';
      setIsNativeApp(native);
      
      // 初始化通知
      initNotifications();
    };
    
    checkPermission();
  }, []);
  
  async function handleExport() {
    const data = await exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tangka-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  function handleImportClick() {
    fileInputRef.current?.click();
  }
  
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      setImportDataStr(reader.result as string);
      setShowImportConfirm(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  }
  
  async function confirmImport() {
    const success = await importData(importDataStr);
    if (success) {
      alert('数据导入成功！');
      window.location.reload();
    } else {
      alert('数据导入失败，请检查文件格式');
    }
    setShowImportConfirm(false);
  }
  
  async function handleClearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
      const { db } = await import('../db/database');
      await db.checkIns.clear();
      await db.goals.clear();
      await db.badges.clear();
      await db.referenceImages.clear();
      alert('数据已清空');
      window.location.reload();
    }
  }
  
  async function handleRequestPermission() {
    const { requestNotificationPermission } = await import('../stores/notificationStore');
    const granted = await requestNotificationPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
    if (granted) {
      alert('通知权限已开启！');
    } else {
      alert('请在系统设置中允许通知权限');
    }
  }
  
  async function handleTestReminder() {
    try {
      await testNotification();
      alert('测试通知已发送，请查看手机通知栏！');
    } catch (error) {
      alert('发送失败：' + (error as Error).message);
    }
  }
  
  async function handleToggleReminder(enabled: boolean) {
    setReminder(enabled);
    if (enabled) {
      const { requestNotificationPermission } = await import('../stores/notificationStore');
      const granted = await requestNotificationPermission();
      setNotificationStatus(granted ? 'granted' : 'denied');
    }
  }
  
  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold">设置</h1>
      </div>
      
      <div className="px-4 space-y-4">
        {/* 个人信息 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-tangka-red" />
            个人信息
          </h3>
          <div>
            <label className="block text-sm text-gray-500 mb-1">昵称</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="请输入昵称"
              className="w-full p-3 bg-tangka-sand/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-tangka-red/30"
            />
          </div>
        </div>
        
        {/* 提醒设置 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-tangka-red" />
            练习提醒
            {isNativeApp && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                原生App
              </span>
            )}
          </h3>
          
          {/* 通知权限状态 */}
          <div className={`
            p-3 rounded-xl mb-4 flex items-center gap-3
            ${notificationStatus === 'granted' 
              ? 'bg-green-100 text-green-700' 
              : notificationStatus === 'denied'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }
          `}>
            {notificationStatus === 'granted' ? (
              <Volume2 className="w-5 h-5" />
            ) : notificationStatus === 'denied' ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <BellRing className="w-5 h-5" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">
                {notificationStatus === 'granted' 
                  ? '通知权限已开启' 
                  : notificationStatus === 'denied'
                    ? '通知权限被拒绝'
                    : '需要开启通知权限'
                }
              </p>
              <p className="text-xs opacity-70">
                {isNativeApp 
                  ? '将在手机通知栏显示提醒' 
                  : '浏览器通知可能不稳定'}
              </p>
            </div>
            {notificationStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="text-xs px-3 py-1 bg-white rounded-full font-medium"
              >
                去开启
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">每日提醒</span>
                <p className="text-xs text-gray-500">每天定时推送通知</p>
              </div>
              <button
                onClick={() => handleToggleReminder(!dailyReminder)}
                className={`
                  w-12 h-7 rounded-full transition-colors relative
                  ${dailyReminder ? 'bg-tangka-red' : 'bg-gray-300'}
                `}
              >
                <div className={`
                  w-5 h-5 bg-white rounded-full absolute top-1 transition-all
                  ${dailyReminder ? 'left-6' : 'left-1'}
                `} />
              </button>
            </div>
            
            {dailyReminder && (
              <>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">提醒时间</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminder(true, e.target.value)}
                    className="w-full p-3 bg-tangka-sand/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-tangka-red/30"
                  />
                </div>
                
                {/* 测试提醒按钮 */}
                <button
                  onClick={handleTestReminder}
                  disabled={notificationStatus !== 'granted'}
                  className="w-full py-3 rounded-xl bg-tangka-gold/20 text-tangka-gold font-medium flex items-center justify-center gap-2 hover:bg-tangka-gold/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BellRing className="w-5 h-5" />
                  测试提醒通知
                </button>
                
                {notificationStatus !== 'granted' && (
                  <p className="text-xs text-orange-500">
                    请先开启通知权限再测试
                  </p>
                )}
                
                <p className="text-xs text-gray-500">
                  点击"测试提醒"会在手机通知栏显示一条测试消息
                </p>
              </>
            )}
          </div>
        </div>
        
        {/* 数据管理 */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-tangka-red" />
            数据管理
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-between p-3 hover:bg-tangka-sand/30 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">导出数据</p>
                  <p className="text-xs text-gray-500">备份到本地文件</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button
              onClick={handleImportClick}
              className="w-full flex items-center justify-between p-3 hover:bg-tangka-sand/30 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium">导入数据</p>
                  <p className="text-xs text-gray-500">从备份文件恢复</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-600">清空数据</p>
                  <p className="text-xs text-gray-500">删除所有记录</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        {/* 关于 */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-tangka-red rounded-xl flex items-center justify-center">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold">唐卡练习打卡</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">版本 {getLatestVersion()}</p>
                  <button
                    onClick={() => setShowChangelog(true)}
                    className="text-xs px-2 py-0.5 bg-tangka-sand/50 text-tangka-red rounded-full 
                               hover:bg-tangka-red hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Gift className="w-3 h-3" />
                    更新说明
                  </button>
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300" />
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-400 py-4">
          数据仅存储在本地浏览器中
        </p>
      </div>
      
      {/* 导入确认对话框 */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-tangka-cream rounded-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">确认导入</h3>
            <p className="text-gray-600 text-sm mb-4">
              导入数据将覆盖现有的所有记录，确定要继续吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-tangka-sand font-medium"
              >
                取消
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-3 rounded-xl bg-tangka-red text-white font-medium"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 版本更新说明弹窗 */}
      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </div>
  );
}
