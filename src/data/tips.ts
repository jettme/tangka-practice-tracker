// 唐卡相关小知识、鼓励语录
export const tangkaTips = [
  // 唐卡小知识
  {
    type: 'knowledge',
    content: '唐卡是藏族文化中一种独特的绘画艺术形式，被誉为藏族的"百科全书"。'
  },
  {
    type: 'knowledge',
    content: '传统唐卡绘制必须使用天然矿物颜料，如朱砂、石青、石绿等，历经千年不褪色。'
  },
  {
    type: 'knowledge',
    content: '绘制唐卡前，画师需要进行净身、诵经等仪式，保持身心清净。'
  },
  {
    type: 'knowledge',
    content: '《度量经》详细规定了佛像的比例尺度，是唐卡绘制的根本准则。'
  },
  {
    type: 'knowledge',
    content: '唐卡分为勉唐派、钦泽派、噶玛嘎孜派三大主流画派，各具特色。'
  },
  {
    type: 'knowledge',
    content: '绘制一幅精品唐卡可能需要数月甚至数年时间，需要极大的耐心与专注。'
  },
  {
    type: 'knowledge',
    content: '唐卡的底色通常为白色或浅色，象征着清净与光明。'
  },
  {
    type: 'knowledge',
    content: '金箔的运用是唐卡的重要特色，需要使用玛瑙笔进行磨光处理。'
  },
  {
    type: 'knowledge',
    content: '唐卡装裱时会用黄色或红色绸缎包裹，象征庄严与神圣。'
  },
  {
    type: 'knowledge',
    content: '开脸是唐卡绘制中最关键的步骤，决定着整幅作品的灵动与否。'
  },
  {
    type: 'knowledge',
    content: '传统唐卡画师从小就开始学习，需要经过十余年的严格训练。'
  },
  {
    type: 'knowledge',
    content: '《佛说造像度量经》是唐卡绘制的根本经典，必须严格遵守。'
  },
  {
    type: 'knowledge',
    content: '曼陀罗是唐卡的重要题材，象征着佛法的圆满与和谐。'
  },
  {
    type: 'knowledge',
    content: '绘制佛像时，画师需观想本尊，将虔诚之心融入每一笔。'
  },
  {
    type: 'knowledge',
    content: '传统唐卡使用的画布需要将棉布层层涂抹石灰，打磨至光滑如镜。'
  },

  // 鼓励语录
  {
    type: 'encouragement',
    content: '每一笔都是修行，每一画都是功德。坚持练习，终有所成。'
  },
  {
    type: 'encouragement',
    content: '心正则笔正，心静则画静。让呼吸与笔触同步，进入禅定的境界。'
  },
  {
    type: 'encouragement',
    content: '唐卡绘画需要耐心和专注。今天的练习，是明天进步的基础。'
  },
  {
    type: 'encouragement',
    content: '不急于求成，不畏惧困难。持之以恒，水滴石穿。'
  },
  {
    type: 'encouragement',
    content: '练习不是为了完美，而是为了在每一笔中找到内心的平静。'
  },
  {
    type: 'encouragement',
    content: '每一次打卡，都是对自我的承诺。你已经比昨天更进步了！'
  },
  {
    type: 'encouragement',
    content: '大师也是从一笔一画开始的。保持热爱，继续前行。'
  },
  {
    type: 'encouragement',
    content: '专注于当下这一笔，不要想太多。心手合一，自然成画。'
  },
  {
    type: 'encouragement',
    content: '即使只有15分钟，也是向梦想迈进的一步。坚持就是胜利！'
  },
  {
    type: 'encouragement',
    content: '绘画如修行，不在于速度，而在于用心。慢慢来，比较快。'
  },
  {
    type: 'encouragement',
    content: '今天的练习，是对明天最好的投资。加油！'
  },
  {
    type: 'encouragement',
    content: '不与他人比较，只与昨日的自己相比。每一天都在成长。'
  },
  {
    type: 'encouragement',
    content: '当你专注于笔尖时，所有的烦恼都会消散。享受这份宁静。'
  },
  {
    type: 'encouragement',
    content: '最好的作品永远是下一幅。保持好奇心，继续探索。'
  },
  {
    type: 'encouragement',
    content: '练习不是负担，而是与自己相处的珍贵时光。珍惜每一次练习。'
  },
  {
    type: 'encouragement',
    content: '画中的佛像庄严，源自画师的虔诚。用心描绘，功德无量。'
  },
  {
    type: 'encouragement',
    content: '不要因为线条不够完美而气馁，每一笔都是独一无二的。'
  },
  {
    type: 'encouragement',
    content: '保持规律的练习，胜过偶尔的突击。细水长流，方能致远。'
  },
  {
    type: 'encouragement',
    content: '画唐卡是修心的过程，不必太在意结果。享受过程，即是圆满。'
  },
  {
    type: 'encouragement',
    content: '当你想要放弃时，请记住当初为什么开始。初心不改，方得始终。'
  }
];

// 根据日期获取当天的提示（确保同一天总是显示相同的提示）
export function getDailyTip(date: Date = new Date()): typeof tangkaTips[0] {
  // 使用日期作为种子，确保同一天总是返回相同的提示
  const dateStr = date.toISOString().split('T')[0];
  const seed = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = seed % tangkaTips.length;
  return tangkaTips[index];
}

// 随机获取一条提示（用于初始显示或特殊场景）
export function getRandomTip(): typeof tangkaTips[0] {
  const index = Math.floor(Math.random() * tangkaTips.length);
  return tangkaTips[index];
}

// 获取多条不重复的提示
export function getMultipleTips(count: number): typeof tangkaTips[0][] {
  const shuffled = [...tangkaTips].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
