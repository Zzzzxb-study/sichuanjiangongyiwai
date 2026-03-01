const http = require('http');

const data = JSON.stringify({
  planName: 'SimpleTest',
  projectName: '简单测试项目',
  contractor: '简单测试单位',
  projectLocation: '简单测试地点',
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
});

const options = {
  hostname: 'localhost',
  port: 58080,
  path: '/api/pricing-plans',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('发送的数据:', data);
console.log('数据长度:', data.length);
console.log('');

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('响应状态:', res.statusCode);
    console.log('响应体:', body);
  });
});

req.on('error', (error) => {
  console.error('请求失败:', error);
});

req.write(data);
req.end();
