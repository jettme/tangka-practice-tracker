import Dexie, { type Table } from 'dexie';

export interface CheckIn {
  id: string;
  date: string;
  duration: number;
  note: string;
  imageData: string[];
  isCompleteWork: boolean; // 是否完成完整作品
  createdAt: number;
}

export interface Goal {
  id: string;
  title: string;
  targetDays: number;
  startDate: string;
  color: string;
  isActive: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt: number;
  description: string;
}

export interface ReferenceImage {
  id: string;
  name: string;
  category: string;
  imageData: string;
  createdAt: number;
}

export class TangkaDatabase extends Dexie {
  checkIns!: Table<CheckIn>;
  goals!: Table<Goal>;
  badges!: Table<Badge>;
  referenceImages!: Table<ReferenceImage>;

  constructor() {
    super('TangkaDB');
    this.version(2).stores({
      checkIns: 'id, date',
      goals: 'id',
      badges: 'id',
      referenceImages: 'id, category',
    }).upgrade(tx => {
      // 迁移旧数据，设置 isCompleteWork 默认为 false
      return tx.table('checkIns').toCollection().modify(checkIn => {
        if (checkIn.isCompleteWork === undefined) {
          checkIn.isCompleteWork = false;
        }
      });
    });
  }
}

export const db = new TangkaDatabase();

export async function getTodayCheckIn(): Promise<CheckIn | undefined> {
  const today = new Date().toISOString().split('T')[0];
  return await db.checkIns.get(today);
}

export async function getMonthCheckIns(year: number, month: number): Promise<CheckIn[]> {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return await db.checkIns
    .filter(ci => ci.date.startsWith(prefix))
    .toArray();
}

export async function getStreak(): Promise<number> {
  const checkIns = await db.checkIns.orderBy('date').reverse().toArray();
  if (checkIns.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (const ci of checkIns) {
    const ciDate = new Date(ci.date);
    ciDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((today.getTime() - ciDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays > streak) {
      break;
    }
  }
  
  return streak;
}

export async function getTotalStats(): Promise<{ 
  totalDays: number; 
  totalMinutes: number;
  completeWorks: number;
}> {
  const all = await db.checkIns.toArray();
  return {
    totalDays: all.length,
    totalMinutes: all.reduce((sum, ci) => sum + ci.duration, 0),
    completeWorks: all.filter(ci => ci.isCompleteWork).length,
  };
}

// 获取完整作品统计
export async function getCompleteWorkStats(): Promise<{
  totalCompleteWorks: number;
  totalWorkDuration: number;
  monthlyCompleteWorks: number;
}> {
  const all = await db.checkIns.toArray();
  const completeWorks = all.filter(ci => ci.isCompleteWork);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const monthlyCompleteWorks = completeWorks.filter(ci => {
    const date = new Date(ci.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;
  
  return {
    totalCompleteWorks: completeWorks.length,
    totalWorkDuration: completeWorks.reduce((sum, ci) => sum + ci.duration, 0),
    monthlyCompleteWorks,
  };
}
