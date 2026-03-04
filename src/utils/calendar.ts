import { Lunar } from 'lunar-javascript';

// 主要农历节日
const LUNAR_FESTIVALS: Record<string, string> = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '10-1': '寒衣节',
  '10-15': '下元节',
  '12-8': '腊八节',
  '12-23': '小年',
  '12-30': '除夕',
};

// 藏历主要节日（简化版，实际藏历计算复杂，这里用近似日期）
const TIBETAN_FESTIVALS: Record<string, string> = {
  // 藏历新年（通常在农历1月，但日期不同）
  'tibetan-1-1': '藏历新年',
  'tibetan-1-15': '酥油花灯节',
  // 萨嘎达瓦节（藏历4月15日，佛诞日）
  'tibetan-4-15': '萨嘎达瓦节',
  // 转山转湖的主要日子
  'tibetan-4-7': '佛诞',
  // 六月法会
  'tibetan-6-4': '转法轮日',
  // 天降节
  'tibetan-9-22': '天降节',
  // 燃灯节（宗喀巴大师圆寂日）
  'tibetan-10-25': '燃灯节',
  // 驱鬼节
  'tibetan-12-29': '驱鬼节',
};

// 公历固定节日
const SOLAR_FESTIVALS: Record<string, string> = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-8': '妇女节',
  '3-12': '植树节',
  '4-1': '愚人节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
  '10-24': '联合国日',
  '11-11': '双十一',
  '12-24': '平安夜',
  '12-25': '圣诞节',
};



export interface CalendarInfo {
  lunarDate: string;      // 农历日期，如"正月十五"
  lunarFestival?: string; // 农历节日
  solarFestival?: string; // 公历节日
  solarTerm?: string;     // 节气
  tibetanFestival?: string; // 藏历节日
  isTerm: boolean;        // 是否是节气
}

/**
 * 获取指定日期的日历信息
 */
export function getCalendarInfo(date: Date): CalendarInfo {
  const lunar = Lunar.fromDate(date);
  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();
  
  // 农历日期显示
  const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
  const lunarDays = [
    '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ];
  
  const lunarDate = `${lunarMonths[lunarMonth - 1]}月${lunarDays[lunarDay - 1]}`;
  
  // 农历节日
  const lunarKey = `${lunarMonth}-${lunarDay}`;
  const lunarFestival = LUNAR_FESTIVALS[lunarKey];
  
  // 公历节日
  const solarMonth = date.getMonth() + 1;
  const solarDay = date.getDate();
  const solarKey = `${solarMonth}-${solarDay}`;
  const solarFestival = SOLAR_FESTIVALS[solarKey];
  
  // 节气
  const solarTerm = lunar.getJieQi();
  const isTerm = !!solarTerm;
  
  // 藏历节日（简化处理，根据农历近似）
  // 藏历与农历有差异，这里用农历月份+1作为近似
  const tibetanMonth = lunarMonth;
  const tibetanDay = lunarDay;
  const tibetanKey = `tibetan-${tibetanMonth}-${tibetanDay}`;
  const tibetanFestival = TIBETAN_FESTIVALS[tibetanKey];
  
  return {
    lunarDate,
    lunarFestival,
    solarFestival,
    solarTerm: solarTerm || undefined,
    tibetanFestival,
    isTerm,
  };
}

/**
 * 获取节日显示文本（优先级：藏历 > 农历 > 公历 > 节气）
 */
export function getFestivalText(info: CalendarInfo): string | undefined {
  // 优先显示藏历节日
  if (info.tibetanFestival) {
    return `藏·${info.tibetanFestival}`;
  }
  // 其次是农历节日
  if (info.lunarFestival) {
    return info.lunarFestival;
  }
  // 然后是公历节日
  if (info.solarFestival) {
    return info.solarFestival;
  }
  // 最后是节气
  if (info.solarTerm) {
    return info.solarTerm;
  }
  return undefined;
}

/**
 * 获取显示用的农历日期（节日优先）
 */
export function getDisplayLunarDate(info: CalendarInfo): string {
  const festival = getFestivalText(info);
  if (festival) {
    return festival;
  }
  // 初一显示月份
  if (info.lunarDate.endsWith('初一')) {
    return info.lunarDate.replace('初一', '');
  }
  return info.lunarDate;
}
