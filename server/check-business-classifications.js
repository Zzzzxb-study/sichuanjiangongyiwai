const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'insurance.db');
const db = new Database(dbPath);

console.log('=== 公司业务分类数据 ===');
const rows = db.prepare('SELECT id, category_level, category_name, category_description FROM company_business_classification ORDER BY display_order').all();

if (rows.length === 0) {
  console.log('❌ 业务分类数据为空');
} else {
  console.log(`✅ 找到 ${rows.length} 条业务分类数据：\n`);
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.category_name} (${row.category_level})`);
    console.log(`   描述: ${row.category_description}`);
    console.log(`   ID: ${row.id}`);
    console.log('');
  });
}

db.close();
