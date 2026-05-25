import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** 预设约80个常见健身动作 */
const exercises = [
  // === 胸部 ===
  { name: '杠铃卧推', category: 'chest', muscleGroup: '胸大肌', equipment: '杠铃', difficulty: 'intermediate', description: '经典胸部训练动作，主要锻炼胸大肌', instructions: '仰卧在卧推凳上，双手握杠铃，从胸部推起至手臂伸直，缓慢下放至胸前。' },
  { name: '哑铃卧推', category: 'chest', muscleGroup: '胸大肌', equipment: '哑铃', difficulty: 'intermediate', description: '使用哑铃进行卧推，活动范围更大', instructions: '仰卧，双手各持哑铃，从胸部两侧推起至手臂伸直，控制下放。' },
  { name: '上斜哑铃卧推', category: 'chest', muscleGroup: '上胸', equipment: '哑铃', difficulty: 'intermediate', description: '上斜角度重点锻炼上胸部', instructions: '将卧推凳调至30-45度，双手持哑铃，推起至手臂伸直。' },
  { name: '下斜卧推', category: 'chest', muscleGroup: '下胸', equipment: '杠铃', difficulty: 'intermediate', description: '下斜角度重点锻炼下胸部', instructions: '将卧推凳调至下斜角度，进行杠铃卧推动作。' },
  { name: '哑铃飞鸟', category: 'chest', muscleGroup: '胸大肌', equipment: '哑铃', difficulty: 'intermediate', description: '孤立训练胸大肌，增加胸部宽度', instructions: '仰卧，双手持哑铃向两侧打开，保持微弯手臂，像拥抱一样合拢。' },
  { name: '绳索夹胸', category: 'chest', muscleGroup: '胸大肌', equipment: '龙门架', difficulty: 'beginner', description: '使用龙门架进行夹胸，持续张力', instructions: '站于龙门架中间，双手持把手，从两侧向中间合拢，挤压胸部。' },
  { name: '俯卧撑', category: 'chest', muscleGroup: '胸大肌', equipment: '徒手', difficulty: 'beginner', description: '经典徒手胸部训练', instructions: '双手撑地略宽于肩，身体保持直线，屈肘下降后推起。' },
  { name: '钻石俯卧撑', category: 'chest', muscleGroup: '胸大肌/肱三头肌', equipment: '徒手', difficulty: 'intermediate', description: '窄距俯卧撑，可同时训练胸部和三头肌', instructions: '双手拇指和食指触碰形成钻石形状，进行俯卧撑。' },
  { name: '器械推胸', category: 'chest', muscleGroup: '胸大肌', equipment: '固定器械', difficulty: 'beginner', description: '适合新手的胸部器械训练', instructions: '坐于器械上，调整座椅高度，双手前推至手臂伸直，缓慢回收。' },
  { name: '斯万推胸', category: 'chest', muscleGroup: '胸大肌内侧', equipment: '杠铃片', difficulty: 'beginner', description: '双手夹杠铃片前推，锻炼胸肌内侧', instructions: '双手掌心相对夹住杠铃片，从胸前向前推出，挤压胸部。' },

  // === 背部 ===
  { name: '引体向上', category: 'back', muscleGroup: '背阔肌', equipment: '单杠', difficulty: 'intermediate', description: '王牌背部训练动作', instructions: '双手正握单杠，身体悬垂，背肌发力拉起身体至下巴过杠，缓慢下放。' },
  { name: '高位下拉', category: 'back', muscleGroup: '背阔肌', equipment: '龙门架', difficulty: 'beginner', description: '模拟引体向上的器械训练', instructions: '坐于器械上，宽握把手，下拉至锁骨位置，挤压背部肌肉。' },
  { name: '杠铃划船', category: 'back', muscleGroup: '背阔肌', equipment: '杠铃', difficulty: 'intermediate', description: '增加背部厚度的核心动作', instructions: '俯身45度，双手握杠铃，沿大腿方向上拉至腹部，挤压背部。' },
  { name: '哑铃单臂划船', category: 'back', muscleGroup: '背阔肌', equipment: '哑铃', difficulty: 'beginner', description: '单侧训练，改善左右不平衡', instructions: '一手撑凳，另一手持哑铃，上臂贴身体向上拉起，挤压背肌。' },
  { name: '坐姿划船', category: 'back', muscleGroup: '背阔肌/中背部', equipment: '龙门架', difficulty: 'beginner', description: '器械划船，稳定安全', instructions: '坐于器械上，双脚蹬踏板，双手拉把手至腹部，挤压背部。' },
  { name: 'T杆划船', category: 'back', muscleGroup: '背阔肌/中背部', equipment: 'T杆', difficulty: 'intermediate', description: '杠铃一端固定，适合大重量训练', instructions: '骑跨在T杆上，双手握把手，背肌发力拉起至胸部下方。' },
  { name: '硬拉', category: 'back', muscleGroup: '竖脊肌/全身', equipment: '杠铃', difficulty: 'advanced', description: '全身性复合动作，锻炼后链肌群', instructions: '双脚与肩同宽，正反手握杠铃，腰背挺直，腿部和背部同时发力拉起。' },
  { name: '罗马尼亚硬拉', category: 'back', muscleGroup: '竖脊肌/腘绳肌', equipment: '杠铃', difficulty: 'intermediate', description: '强调腘绳肌和臀部', instructions: '膝盖微弯，臀部后推，上身下降至杠铃过膝，保持腰背挺直拉起。' },
  { name: '背屈伸/山羊挺身', category: 'back', muscleGroup: '竖脊肌', equipment: '罗马椅', difficulty: 'beginner', description: '孤立训练下背部', instructions: '俯卧在罗马椅上，身体下垂后利用腰部力量抬起身体至水平。' },
  { name: '仰卧哑铃上拉', category: 'back', muscleGroup: '背阔肌', equipment: '哑铃', difficulty: 'intermediate', description: '同时练习背部和胸部', instructions: '仰卧于凳上，双手持哑铃过头顶，从头顶拉起至胸前上方。' },

  // === 肩部 ===
  { name: '杠铃推举', category: 'shoulders', muscleGroup: '三角肌', equipment: '杠铃', difficulty: 'intermediate', description: '主要锻炼肩部整体', instructions: '坐姿或站姿，杠铃置于锁骨前方，向上推举至头顶上方，控制下放。' },
  { name: '哑铃推举', category: 'shoulders', muscleGroup: '三角肌', equipment: '哑铃', difficulty: 'intermediate', description: '双手各持哑铃进行推举', instructions: '坐姿，哑铃置于肩部高度，向上推举至手臂伸直，缓慢下放。' },
  { name: '阿诺德推举', category: 'shoulders', muscleGroup: '三角肌前中束', equipment: '哑铃', difficulty: 'intermediate', description: '旋转式推举，全方位刺激肩部', instructions: '起始掌心朝自己，推起过程中旋转手腕至掌心朝前。' },
  { name: '哑铃侧平举', category: 'shoulders', muscleGroup: '三角肌中束', equipment: '哑铃', difficulty: 'beginner', description: '增加肩部宽度的关键动作', instructions: '双手持哑铃于体侧，肘部微弯，向两侧抬起至与肩同高。' },
  { name: '哑铃前平举', category: 'shoulders', muscleGroup: '三角肌前束', equipment: '哑铃', difficulty: 'beginner', description: '锻炼肩部前束', instructions: '双手持哑铃于大腿前方，向前方抬起至与肩同高。' },
  { name: '俯身哑铃飞鸟', category: 'shoulders', muscleGroup: '三角肌后束', equipment: '哑铃', difficulty: 'beginner', description: '锻炼肩部后束', instructions: '俯身接近水平，双手持哑铃向两侧打开，挤压后肩。' },
  { name: '绳索面拉', category: 'shoulders', muscleGroup: '三角肌后束', equipment: '龙门架', difficulty: 'beginner', description: '锻炼肩后束和肩袖肌群', instructions: '高位滑轮，绳索拉向面部，手肘向两侧打开。' },
  { name: '杠铃直立划船', category: 'shoulders', muscleGroup: '三角肌/斜方肌', equipment: '杠铃', difficulty: 'intermediate', description: '锻炼肩部和斜方肌', instructions: '窄握杠铃于大腿前方，沿身体前方上拉至下巴高度。' },
  { name: '哑铃耸肩', category: 'shoulders', muscleGroup: '斜方肌', equipment: '哑铃', difficulty: 'beginner', description: '锻炼斜方肌上部', instructions: '双手持重哑铃于体侧，肩部向上提起靠近耳朵，顶峰收缩。' },
  { name: '器械推举', category: 'shoulders', muscleGroup: '三角肌', equipment: '固定器械', difficulty: 'beginner', description: '安全的肩部推举器械', instructions: '坐于器械上，握把手向上推举，控制回收。' },

  // === 腿部 ===
  { name: '杠铃深蹲', category: 'legs', muscleGroup: '股四头肌/臀部', equipment: '杠铃', difficulty: 'intermediate', description: '腿部训练之王', instructions: '杠铃置于斜方肌上，下蹲至大腿与地面平行，脚跟发力站起。' },
  { name: '前蹲', category: 'legs', muscleGroup: '股四头肌', equipment: '杠铃', difficulty: 'advanced', description: '杠铃置于锁骨前侧，更强调股四头肌', instructions: '杠铃置于锁骨和肩前，保持躯干直立，下蹲后起立。' },
  { name: '高脚杯深蹲', category: 'legs', muscleGroup: '股四头肌/臀部', equipment: '哑铃', difficulty: 'beginner', description: '适合新手的深蹲变式', instructions: '双手持哑铃于胸前，保持躯干直立下蹲至大腿平行地面。' },
  { name: '保加利亚分腿蹲', category: 'legs', muscleGroup: '股四头肌/臀部', equipment: '哑铃', difficulty: 'intermediate', description: '单侧训练，改善平衡', instructions: '后脚放在凳上，前脚向前，双手持哑铃，下蹲至前大腿平行地面。' },
  { name: '腿举/倒蹬', category: 'legs', muscleGroup: '股四头肌/臀部', equipment: '固定器械', difficulty: 'beginner', description: '大重量腿部训练器械', instructions: '坐/躺于器械上，双脚蹬踏板，屈膝后蹬出，注意不要锁死膝盖。' },
  { name: '腿屈伸', category: 'legs', muscleGroup: '股四头肌', equipment: '固定器械', difficulty: 'beginner', description: '孤立训练股四头肌', instructions: '坐于器械上，脚踝置于滚轴下，伸直双腿抬起重量，缓慢下放。' },
  { name: '腿弯举', category: 'legs', muscleGroup: '腘绳肌', equipment: '固定器械', difficulty: 'beginner', description: '孤立训练大腿后侧', instructions: '俯卧或坐姿，脚跟勾住滚轴，向臀部方向弯曲膝盖。' },
  { name: '罗马尼亚哑铃硬拉', category: 'legs', muscleGroup: '腘绳肌/臀部', equipment: '哑铃', difficulty: 'beginner', description: '强调腘绳肌的硬拉变式', instructions: '双手持哑铃，膝盖微弯，臀部后推，保持腰背挺直，感受大腿后侧拉伸。' },
  { name: '负重臀推', category: 'legs', muscleGroup: '臀大肌', equipment: '杠铃', difficulty: 'intermediate', description: '臀部训练的黄金动作', instructions: '上背靠在凳沿，杠铃置于髋部，臀部发力顶起至身体水平。' },
  { name: '哑铃弓步蹲', category: 'legs', muscleGroup: '股四头肌/臀部', equipment: '哑铃', difficulty: 'beginner', description: '功能性腿部训练', instructions: '双手持哑铃，交替向前迈步下蹲，双膝均呈90度。' },
  { name: '杠铃臀桥', category: 'legs', muscleGroup: '臀大肌', equipment: '杠铃', difficulty: 'beginner', description: '仰卧进行臀部训练', instructions: '仰卧屈膝，杠铃置于髋部，臀部发力向上顶起，顶峰收缩。' },
  { name: '坐姿提踵', category: 'legs', muscleGroup: '小腿', equipment: '固定器械', difficulty: 'beginner', description: '锻炼小腿比目鱼肌', instructions: '坐姿，前脚掌踩踏板，膝盖上方负重，脚踝做屈伸运动。' },
  { name: '站姿提踵', category: 'legs', muscleGroup: '小腿', equipment: '史密斯机', difficulty: 'beginner', description: '锻炼小腿腓肠肌', instructions: '前脚掌站在踏板边缘，负重做提踵动作，顶峰收缩。' },

  // === 手臂 ===
  { name: '杠铃弯举', category: 'arms', muscleGroup: '肱二头肌', equipment: '杠铃', difficulty: 'beginner', description: '经典肱二头肌训练', instructions: '双手与肩同宽握杠铃，肘部固定于体侧，弯举至肩前。' },
  { name: '哑铃弯举', category: 'arms', muscleGroup: '肱二头肌', equipment: '哑铃', difficulty: 'beginner', description: '双臂交替进行弯举', instructions: '双手持哑铃于体侧，掌心朝前，交替弯举至肩前。' },
  { name: '锤式弯举', category: 'arms', muscleGroup: '肱二头肌/肱桡肌', equipment: '哑铃', difficulty: 'beginner', description: '掌心相对的弯举方式', instructions: '双手持哑铃，掌心相对（锤式握法），弯举至肩前。' },
  { name: '牧师凳弯举', category: 'arms', muscleGroup: '肱二头肌', equipment: '杠铃', difficulty: 'intermediate', description: '使用牧师凳隔离肱二头肌', instructions: '手臂放在牧师凳斜面上，弯举杠铃，充分挤压二头肌。' },
  { name: '绳索弯举', category: 'arms', muscleGroup: '肱二头肌', equipment: '龙门架', difficulty: 'beginner', description: '龙门架弯举，持续张力', instructions: '低位滑轮，双手持绳索把手，弯举至肩前，缓慢下放。' },
  { name: '窄距卧推', category: 'arms', muscleGroup: '肱三头肌', equipment: '杠铃', difficulty: 'intermediate', description: '锻炼肱三头肌的主要动作', instructions: '窄握杠铃（与肩同宽），下放至下胸部，推起时三头肌发力。' },
  { name: '绳索下压', category: 'arms', muscleGroup: '肱三头肌', equipment: '龙门架', difficulty: 'beginner', description: '龙门架三头肌下压', instructions: '高位滑轮，双手持绳索/直杆，肘部固定，下压至手臂伸直。' },
  { name: '哑铃过头臂屈伸', category: 'arms', muscleGroup: '肱三头肌', equipment: '哑铃', difficulty: 'beginner', description: '锻炼三头肌长头', instructions: '双手持哑铃过头顶，肘部朝前，屈伸肘关节。' },
  { name: '双杠臂屈伸', category: 'arms', muscleGroup: '肱三头肌/胸肌下沿', equipment: '双杠', difficulty: 'intermediate', description: '徒手三头肌和胸部训练', instructions: '双手撑双杠，身体下降至肩低于肘，三头肌发力推起。' },
  { name: '杠铃腕弯举', category: 'arms', muscleGroup: '前臂', equipment: '杠铃', difficulty: 'beginner', description: '锻炼前臂屈肌', instructions: '坐姿，前臂放在大腿上，手腕悬空，做屈腕动作。' },
  { name: '反握杠铃弯举', category: 'arms', muscleGroup: '前臂/肱桡肌', equipment: '杠铃', difficulty: 'beginner', description: '反手握杠铃弯举', instructions: '反握（掌心朝下）杠铃，弯举至肩前。' },
  { name: '集中弯举', category: 'arms', muscleGroup: '肱二头肌', equipment: '哑铃', difficulty: 'beginner', description: '单臂弯举，高度孤立', instructions: '坐姿，持哑铃的手臂肘部抵住大腿内侧，做弯举。' },

  // === 核心 ===
  { name: '卷腹', category: 'core', muscleGroup: '腹直肌', equipment: '徒手', difficulty: 'beginner', description: '经典腹肌训练', instructions: '仰卧屈膝，双手置于头侧，肩胛骨离地，腹肌收缩卷起上半身。' },
  { name: '平板支撑', category: 'core', muscleGroup: '核心整体', equipment: '徒手', difficulty: 'beginner', description: '锻炼核心稳定性的基础动作', instructions: '俯卧，肘部和脚尖支撑，身体保持一条直线，收紧核心。' },
  { name: '仰卧抬腿', category: 'core', muscleGroup: '腹直肌下部', equipment: '徒手', difficulty: 'beginner', description: '锻炼下腹部', instructions: '仰卧，双腿伸直并拢，腹肌发力抬起双腿至垂直，缓慢下放。' },
  { name: '俄罗斯转体', category: 'core', muscleGroup: '腹斜肌', equipment: '哑铃', difficulty: 'beginner', description: '锻炼腹部斜肌', instructions: '坐姿，身体后仰，双脚离地，双手持哑铃左右转体。' },
  { name: '悬垂举腿', category: 'core', muscleGroup: '腹直肌/腹斜肌', equipment: '单杠', difficulty: 'intermediate', description: '悬挂在单杠上抬腿', instructions: '双手握住单杠悬垂，腹肌发力抬起双腿至水平或更高。' },
  { name: '死虫式', category: 'core', muscleGroup: '核心稳定性', equipment: '徒手', difficulty: 'beginner', description: '锻炼核心抗旋转能力', instructions: '仰卧，四肢朝天，交替伸展对侧手脚，保持核心收紧。' },
  { name: '登山者', category: 'core', muscleGroup: '核心/有氧', equipment: '徒手', difficulty: 'beginner', description: '动态核心训练，提升心率', instructions: '俯卧撑姿势，交替提膝至胸前，保持快速节奏。' },
  { name: '侧平板支撑', category: 'core', muscleGroup: '腹斜肌', equipment: '徒手', difficulty: 'beginner', description: '锻炼侧腹肌', instructions: '侧卧，单肘支撑，身体成一直线，保持核心收紧。' },
  { name: 'V字两头起', category: 'core', muscleGroup: '腹直肌', equipment: '徒手', difficulty: 'intermediate', description: '同时锻炼上腹和下腹', instructions: '仰卧，同时抬起上半身和双腿，手触脚尖，形成V字形。' },
  { name: '负重卷腹', category: 'core', muscleGroup: '腹直肌', equipment: '杠铃片', difficulty: 'intermediate', description: '增加阻力的卷腹', instructions: '双手持杠铃片于胸前，进行卷腹动作。' },

  // === 全身 ===
  { name: '波比跳', category: 'full_body', muscleGroup: '全身', equipment: '徒手', difficulty: 'intermediate', description: '高强度全身燃脂动作', instructions: '站立→下蹲→双手撑地→双腿后跳→俯卧撑→收腿→跳起。' },
  { name: '壶铃摇摆', category: 'full_body', muscleGroup: '全身/臀部', equipment: '壶铃', difficulty: 'intermediate', description: '壶铃核心训练动作', instructions: '双脚略宽于肩，双手持壶铃，臀部发力摇摆壶铃至肩高。' },
  { name: '农夫行走', category: 'full_body', muscleGroup: '全身/握力', equipment: '哑铃', difficulty: 'beginner', description: '功能性全身训练', instructions: '双手各持重哑铃，保持身体正直，稳步行走一定距离。' },
  { name: '战绳', category: 'full_body', muscleGroup: '全身/心肺', equipment: '战绳', difficulty: 'intermediate', description: '高强度心肺训练', instructions: '双手各持战绳一端，交替上下摆动，制造波浪效果。' },
  { name: '开合跳', category: 'full_body', muscleGroup: '全身/心肺', equipment: '徒手', difficulty: 'beginner', description: '基础热身动作', instructions: '双腿并拢站立，跳起分腿同时双手在头顶击掌。' },
  { name: '熊爬', category: 'full_body', muscleGroup: '全身/核心', equipment: '徒手', difficulty: 'beginner', description: '全身协调性训练', instructions: '四肢着地，膝盖离地，像熊一样对侧手脚交替向前爬行。' },
];

async function main() {
  console.log('🌱 Seeding exercises...');

  // 先清空已有数据
  await prisma.workoutLogSet.deleteMany();
  await prisma.workoutLogExercise.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.workoutPlanExercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.exercise.deleteMany();

  let count = 0;
  for (const ex of exercises) {
    await prisma.exercise.create({
      data: {
        name: ex.name,
        description: ex.description,
        category: ex.category,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        difficulty: ex.difficulty,
        instructions: ex.instructions,
        imageUrl: '',
      },
    });
    count++;
  }

  console.log(`✅ Seeded ${count} exercises successfully.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
