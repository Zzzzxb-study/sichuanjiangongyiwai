const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'insurance.db');
const db = new Database(dbPath);

console.log('=== 数据库表列表 ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();

if (tables.length === 0) {
  console.log('❌ 数据库为空，没有任何表');
} else {
  console.log(`✅ 找到 ${tables.length} 个表：\n`);
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`);
  });
}

console.log('\n=== 检查 company_business_classification 表 ===');
const businessTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='company_business_classification'").get();

if (businessTable) {
  console.log('✅ company_business_classification 表存在');
  const count = db.prepare('SELECT COUNT(*) as count FROM company_business_classification').get();
  console.log(`   数据行数: ${count.count}`);
} else {
  console.log('❌ company_business_classification 表不存在！');
  console.log('   需要创建表并插入数据');
}

db.close();
