/**
 * 检查报价方案表中的数据
 * 用于诊断项目名称、施工方、项目地点字段的存储情况
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/insurance_pricing.db');

// 确保数据库文件存在
const fs = require('fs');
if (!fs.existsSync(dbPath)) {
  console.error('❌ 数据库文件不存在:', dbPath);
  console.log('请确保已启动过服务器，数据库会自动创建');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('==========================================');
console.log('报价方案数据检查');
console.log('数据库路径:', dbPath);
console.log('==========================================\n');

try {
  // 检查表是否存在
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='pricing_plans'
  `).get();

  if (!tableExists) {
    console.log('❌ pricing_plans 表不存在');
    process.exit(1);
  }

  // 获取总记录数
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM pricing_plans').get();
  console.log(`📊 总记录数: ${totalCount.count}\n`);

  // 检查最近10条记录的关键字段
  console.log('==========================================');
  console.log('最近10条记录的字段值:');
  console.log('==========================================\n');

  const recentPlans = db.prepare(`
    SELECT
      id,
      plan_name,
      project_name,
      contractor,
      project_location,
      created_at
    FROM pricing_plans
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  if (recentPlans.length === 0) {
    console.log('⚠️  数据库中没有记录');
  } else {
    recentPlans.forEach((plan, index) => {
      console.log(`【记录 ${index + 1}】`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  方案名称: ${plan.plan_name || '(空)'}`);
      console.log(`  项目名称: ${plan.project_name || '(NULL - 显示为"未填写")'}`);
      console.log(`  施工方: ${plan.contractor || '(NULL - 显示为"未填写")'}`);
      console.log(`  项目地点: ${plan.project_location || '(NULL - 显示为"未填写")'}`);
      console.log(`  创建时间: ${plan.created_at}`);
      console.log('');
    });
  }

  // 统计字段为NULL的记录数
  console.log('==========================================');
  console.log('字段NULL值统计:');
  console.log('==========================================\n');

  const nullProjectName = db.prepare(`
    SELECT COUNT(*) as count FROM pricing_plans
    WHERE project_name IS NULL
  `).get();

  const nullContractor = db.prepare(`
    SELECT COUNT(*) as count FROM pricing_plans
    WHERE contractor IS NULL
  `).get();

  const nullProjectLocation = db.prepare(`
    SELECT COUNT(*) as count FROM pricing_plans
    WHERE project_location IS NULL
  `).get();

  const withData = db.prepare(`
    SELECT COUNT(*) as count FROM pricing_plans
    WHERE project_name IS NOT NULL
      OR contractor IS NOT NULL
      OR project_location IS NOT NULL
  `).get();

  console.log(`  项目名称为NULL的记录: ${nullProjectName.count} 条`);
  console.log(`  施工方为NULL的记录: ${nullContractor.count} 条`);
  console.log(`  项目地点为NULL的记录: ${nullProjectLocation.count} 条`);
  console.log(`  至少有一个字段有数据的记录: ${withData.count} 条`);
  console.log('');

  // 查看表结构
  console.log('==========================================');
  console.log('表结构:');
  console.log('==========================================\n');

  const tableInfo = db.prepare('PRAGMA table_info(pricing_plans)').all();
  tableInfo.forEach(column => {
    if (column.name.includes('name') || column.name.includes('contractor') || column.name.includes('location')) {
      console.log(`  字段名: ${column.name}`);
      console.log(`    类型: ${column.type}`);
      console.log(`    允许NULL: ${column.notnull ? '否' : '是'}`);
      console.log(`    默认值: ${column.dflt_value || '(无)'}`);
      console.log('');
    }
  });

  console.log('==========================================');
  console.log('✅ 检查完成');
  console.log('==========================================');

} catch (error) {
  console.error('❌ 检查失败:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}
