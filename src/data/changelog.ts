// 版本更新记录
export interface VersionInfo {
  version: string;
  date: string;
  updates: string[];
  type: 'major' | 'minor' | 'patch';
}

export const CHANGELOG: VersionInfo[] = [
  {
    version: '1.1.0',
    date: '2026-03-04',
    type: 'minor',
    updates: [
      '新增作品完成功能，可标记完整作品',
      '日历显示农历、藏历节日和二十四节气',
      '统计页新增作品统计和作品里程碑',
      '作品完成日期在日历和记录中以金色标识',
    ],
  },
  {
    version: '1.0.2',
    date: '2026-03-04',
    type: 'patch',
    updates: [
      '优化计时器界面，支持背景音乐播放',
      '新增分享功能，支持生成分享卡片',
      '首页增加动态Tips，包含唐卡小知识和鼓励语录',
      '同一天多次打卡自动累加时长',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-03-03',
    type: 'patch',
    updates: [
      '优化UI细节和动画效果',
      '修复数据备份和恢复功能',
      '改进热力图显示效果',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-03',
    type: 'major',
    updates: [
      '唐卡练习打卡PWA正式发布',
      '支持练习打卡、时长统计',
      '支持参考图库管理',
      '支持数据导出备份',
      'PWA支持离线使用',
    ],
  },
];

// 获取最新版本
export function getLatestVersion(): string {
  return CHANGELOG[0]?.version || '1.0.0';
}

// 获取版本类型对应的颜色
export function getVersionTypeColor(type: VersionInfo['type']): string {
  switch (type) {
    case 'major':
      return '#C62828'; // 红色 - 大版本
    case 'minor':
      return '#FFD700'; // 金色 - 功能更新
    case 'patch':
      return '#6b7280'; // 灰色 - 修复
    default:
      return '#6b7280';
  }
}

// 获取版本类型对应的中文
export function getVersionTypeLabel(type: VersionInfo['type']): string {
  switch (type) {
    case 'major':
      return '重大更新';
    case 'minor':
      return '功能更新';
    case 'patch':
      return '问题修复';
    default:
      return '更新';
  }
}
