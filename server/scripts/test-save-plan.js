/**
 * 测试保存方案API
 * 验证项目名称、施工方、项目地点字段的保存逻辑
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:58080';

// 测试数据
const testCases = [
  {
    name: '测试1: 填写了项目基本信息',
    data: {
      planName: '测试方案_完整信息',
      projectName: '测试项目名称',
      contractor: '测试施工单位',
      projectLocation: '四川省成都市',
      mainParams: {
        projectNature: 'non_rural',
        baseAmount: 85000000,
        contractType: 'general_contract',
        engineeringClass: 2,
        durationDays: 730,
        qualification: 'grade_2',
        riskManagementLevel: 'sound',
        coverageAmount: 500000
      },
      calculationResult: {
        totalPremium: 50000
      }
    },
    expected: {
      projectName: '测试项目名称',
      contractor: '测试施工单位',
      projectLocation: '四川省成都市'
    }
  },
  {
    name: '测试2: 未填写项目基本信息（空字符串）',
    data: {
      planName: '测试方案_空信息',
      projectName: '',
      contractor: '',
      projectLocation: '',
      mainParams: {
        projectNature: 'non_rural',
        baseAmount: 85000000,
        contractType: 'general_contract',
        engineeringClass: 2,
        durationDays: 730,
        qualification: 'grade_2',
        riskManagementLevel: 'sound',
        coverageAmount: 500000
      },
      calculationResult: {
        totalPremium: 50000
      }
    },
    expected: {
      projectName: null,
      contractor: null,
      projectLocation: null
    }
  },
  {
    name: '测试3: 只填写了部分信息',
    data: {
      planName: '测试方案_部分信息',
      projectName: '部分项目名称',
      contractor: '',
      projectLocation: '',
      mainParams: {
        projectNature: 'non_rural',
        baseAmount: 85000000,
        contractType: 'general_contract',
        engineeringClass: 2,
        durationDays: 730,
        qualification: 'grade_2',
        riskManagementLevel: 'sound',
        coverageAmount: 500000
      },
      calculationResult: {
        totalPremium: 50000
      }
    },
    expected: {
      projectName: '部分项目名称',
      contractor: null,
      projectLocation: null
    }
  },
  {
    name: '测试4: 只有空格的字段',
    data: {
      planName: '测试方案_纯空格',
      projectName: '   ',
      contractor: '  ',
      projectLocation: '   ',
      mainParams: {
        projectNature: 'non_rural',
        baseAmount: 85000000,
        contractType: 'general_contract',
        engineeringClass: 2,
        durationDays: 730,
        qualification: 'grade_2',
        riskManagementLevel: 'sound',
        coverageAmount: 500000
      },
      calculationResult: {
        totalPremium: 50000
      }
    },
    expected: {
      projectName: null,
      contractor: null,
      projectLocation: null
    }
  }
];

// 发送POST请求
function postData(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 58080,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);

    req.write(postData);
    req.end();
  });
}

// 发送GET请求
function getData(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:58080${path}`, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// 运行测试
async function runTests() {
  console.log('==========================================');
  console.log('开始测试方案保存功能');
  console.log('==========================================\n');

  const savedIds = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`【${testCase.name}】`);
    console.log('发送数据:', JSON.stringify(testCase.data, null, 2));

    try {
      // 保存方案
      const saveResponse = await postData('/api/pricing-plans', testCase.data);

      if (saveResponse.status !== 200 || !saveResponse.data.success) {
        console.log('❌ 保存失败:', saveResponse.data);
        continue;
      }

      const planId = saveResponse.data.data.id;
      savedIds.push(planId);
      console.log('✅ 保存成功, ID:', planId);

      // 查询方案详情
      const detailResponse = await getData(`/api/pricing-plans/${planId}`);

      if (detailResponse.status !== 200 || !detailResponse.data.success) {
        console.log('❌ 查询失败:', detailResponse.data);
        continue;
      }

      const plan = detailResponse.data.data;
      console.log('查询结果:');
      console.log('  项目名称:', plan.projectName || '(null)');
      console.log('  施工方:', plan.contractor || '(null)');
      console.log('  项目地点:', plan.projectLocation || '(null)');

      // 验证结果
      let passed = true;
      if (plan.projectName !== testCase.expected.projectName) {
        console.log(`❌ 项目名称不匹配: 期望 ${testCase.expected.projectName}, 实际 ${plan.projectName}`);
        passed = false;
      }
      if (plan.contractor !== testCase.expected.contractor) {
        console.log(`❌ 施工方不匹配: 期望 ${testCase.expected.contractor}, 实际 ${plan.contractor}`);
        passed = false;
      }
      if (plan.projectLocation !== testCase.expected.projectLocation) {
        console.log(`❌ 项目地点不匹配: 期望 ${testCase.expected.projectLocation}, 实际 ${plan.projectLocation}`);
        passed = false;
      }

      if (passed) {
        console.log('✅ 测试通过');
      }

    } catch (error) {
      console.log('❌ 测试失败:', error.message);
    }

    console.log('');
  }

  console.log('==========================================');
  console.log('测试完成');

  // 清理测试数据
  console.log('\n清理测试数据...');
  console.log('已保存的方案ID:', savedIds);
  console.log('请手动删除这些测试方案，或使用DELETE API删除');
  console.log('==========================================');
}

// 检查服务器是否运行
console.log('检查服务器状态...');
http.get('http://localhost:58080/api/pricing-plans?limit=1', (res) => {
  console.log('✅ 服务器运行正常\n');
  runTests();
}).on('error', (error) => {
  console.error('❌ 无法连接到服务器');
  console.error('请确保后端服务器正在运行: npm run dev');
  console.error('\n错误详情:', error.message);
  process.exit(1);
});
