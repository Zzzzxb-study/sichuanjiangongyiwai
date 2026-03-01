/**
 * AI服务 - 调用大模型API进行合同解析
 */

import { buildPrompt, CONTRACT_ANALYSIS_PROMPT, CONTRACT_ANALYSIS_PROMPT_SIMPLE } from '../prompts/contractAnalysisPrompt';

// 从系统配置获取API配置
const getAPIConfig = () => {
  const configStr = localStorage.getItem('ai_api_config');
  if (configStr) {
    return JSON.parse(configStr);
  }
  return {
    provider: 'openai',
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    enabled: false,
  };
};

/**
 * 合同解析结果接口 - 精简版（仅保留保费计算相关字段）
 *
 * 根据技术规范，保费计算需要以下核心维度：
 * 1. 计算基数（B）: projectCost（万元）或 buildingArea（平方米）
 * 2. 工程分类: engineeringClass（一类/二类/三类/四类）
 * 3. 计费模式: 由 isRuralBuilding 决定（造价型/面积型）
 * 4. 风险因子: location, altitude, specialFeatures 等
 * 5. 系数基准: standardFeeRate, businessCategory
 */
export interface ContractAnalysisResult {
  // === 基本信息 ===
  /** 工程项目名称 */
  projectName: string;

  /**
   * 施工方名称数组
   * 施工合同中可能有多家施工方（总承包方、分包方等）
   */
  contractors: string[];

  /**
   * 施工合同类型（影响费率调整系数）
   * - 总包、专业分包：调整系数 1.0
   * - 一类工程劳务分包：调整系数 4.0（一类工程的劳务分包）
   * - 二类工程劳务分包：调整系数 5.0（二类工程的劳务分包）
   * - 三类工程劳务分包：调整系数 6.0（三类工程的劳务分包）
   * - 四类工程劳务分包：调整系数 7.0（四类工程的劳务分包）
   *
   * 判断依据：
   * 1. 劳务分包：只提供劳务服务，不提供材料设备，通常标注"劳务分包"或"劳务承包"
   * 2. 总包/专业分包：提供材料设备+施工，或明确为总承包/专业分包
   * 3. 劳务分包的工程类别：根据所分包工程的工程分类（1-4类）确定
   */
  contractType: string;

  /**
   * 公司业务分类（AI智能匹配）
   * 根据工程造价、工程分类、风险等级综合判断
   * 包含置信度和推荐理由
   */
  businessClassification?: {
    category_level: string;
    category_name: string;
    category_description?: string;
    underwriting_guide?: string;
    /** AI推荐的置信度：high（高置信）/medium（中等）/low（低置信） */
    confidence?: 'high' | 'medium' | 'low';
    /** AI推荐理由，详细说明判断依据（造价、工程分类、风险等级等） */
    reasoning?: string;
  } | null;

  // === 计算基数（二选一，根据计费模式决定）===
  /** 工程造价（万元）- 造价型项目的计算基数 */
  projectCost: number;

  /** 建筑面积（平方米）- 面积型项目的计算基数 */
  buildingArea: number;

  // === 工程分类（决定基准费率和风险系数）===
  /**
   * 工程分类（1-4类）
   * - 1类（一类）：普通基建/装饰（室内装修、绿化、市政道路无桥隧、河湖治理）
   * - 2类（二类）：机电/能源（电力工程、港口码头、消防、机电安装）
   * - 3类（三类）：高风险/农村（农村自建房、矿山、路桥<50%、安装工程）
   * - 4类（四类）：极高风险（桥隧≥50%、架线、高空安装、边坡治理）
   */
  engineeringClass: 1 | 2 | 3 | 4;

  /** 工程分类判断依据 */
  classificationReason: string;

  // === 计费模式判定 ===
  /**
   * 是否农村自建房
   * - true: 计费模式锁定为"面积型"，工程分类锁定为三类
   * - false: 计费模式为"造价型"
   */
  isRuralBuilding: boolean;

  // === 风险因子（影响K系数）===
  /** 项目地点（省市区）- 影响区域风险系数R2 */
  location: string;

  /** 预计施工人数 - 影响部分K系数 */
  workerCount: number;

  /** 施工工期（天）- 影响部分系数计算 */
  duration: number;

  /**
   * 特殊工程特征列表（影响K系数选择）
   * 包括但不限于：深基坑、爆破工程、拆除工程、隧道盾构、
   * 水上作业、高层建筑(>100米)、大跨度钢结构等
   */
  specialFeatures: string[];

  /** 风险等级评估（1-5级）- 综合评估工程风险 */
  riskLevel: 1 | 2 | 3 | 4 | 5;

  /** 风险等级评估说明 */
  riskReason: string;

  // === 费率基准 ===
  /**
   * 业务分类
   * - 鼓励类: 25%费用率
   * - 一般类: 20%费用率
   * - 谨慎类: 15%费用率
   * - 限制类: 5%费用率
   * - 严格限制类: 0%费用率
   */
  businessCategory: string;

  /**
   * 标准费率（‰）
   * 根据工程分类+业务类别查表得出
   */
  standardFeeRate: number;

  // === 置信度评估 ===
  confidence: {
    /** 工程造价/面积置信度 */
    baseAmount: 'high' | 'medium' | 'low';
    /** 工程分类置信度 */
    engineeringClass: 'high' | 'medium' | 'low';
    /** 风险等级置信度 */
    riskLevel: 'high' | 'medium' | 'low';
  };
}

/**
 * 调用AI API解析合同
 */
export async function analyzeContract(
  contractText: string,
  useSimplePrompt: boolean = false
): Promise<ContractAnalysisResult> {
  const config = getAPIConfig();

  if (!config.enabled || !config.apiKey) {
    throw new Error('AI功能未启用或未配置API密钥，请在系统配置中设置');
  }

  // 构建请求prompt
  const promptTemplate = useSimplePrompt ? CONTRACT_ANALYSIS_PROMPT_SIMPLE : CONTRACT_ANALYSIS_PROMPT;
  const prompt = buildPrompt(promptTemplate, {
    contract_text: contractText,
  });

  try {
    let endpoint = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any = {};

    // 使用配置中的参数
    const temperature = config.temperature || 0.7;
    const maxTokens = config.maxTokens || 2000;

    console.log('AI调用配置:', {
      provider: config.provider,
      model: config.model,
      endpoint: config.apiEndpoint,
      temperature,
      maxTokens,
    });

    // 根据不同的provider构建请求
    switch (config.provider) {
      case 'openai':
        endpoint = `${config.apiEndpoint}/chat/completions`;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的建筑保险合同分析专家。请严格按照JSON格式返回分析结果。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        };
        break;

      case 'qwen':
        // 通义千问使用DashScope兼容OpenAI的端点
        endpoint = config.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = {
          model: config.model,
          messages: [
            {
              role: 'system',
              content: '你是一位专业的建筑保险合同分析专家。请严格按照JSON格式返回分析结果。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        };
        break;

      case 'anthropic':
        endpoint = `${config.apiEndpoint}/v1/messages`;
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: config.model,
          max_tokens: maxTokens,
          system: '你是一位专业的建筑保险合同分析专家。请严格按照JSON格式返回分析结果。',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        };
        break;

      case 'azure':
        endpoint = `${config.apiEndpoint}/openai/deployments/${config.model}/chat/completions?api-version=2023-05-15`;
        headers['api-key'] = config.apiKey;
        body = {
          messages: [
            {
              role: 'system',
              content: '你是一位专业的建筑保险合同分析专家。请严格按照JSON格式返回分析结果。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        };
        break;

      default:
        throw new Error(`不支持的AI提供商: ${config.provider}`);
    }

    console.log('发送AI请求到:', endpoint);
    console.log('请求头:', JSON.stringify(headers, null, 2));
    console.log('请求体（部分）:', JSON.stringify({
      ...body,
      messages: body.messages ? '[messages数据]' : undefined,
    }, null, 2));

    // 发送请求
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      // 添加CORS模式
      mode: 'cors',
    });

    console.log('API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      throw new Error(`API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API响应数据:', JSON.stringify(data, null, 2));

    // 解析响应
    let content = '';
    try {
      if (config.provider === 'anthropic') {
        content = data.content?.[0]?.text || '';
      } else {
        // OpenAI、通义千问（兼容模式）、Azure OpenAI都使用相同格式
        content = data.choices?.[0]?.message?.content || '';
      }

      if (!content) {
        console.error('无法从响应中提取内容，完整响应:', data);
        throw new Error('AI返回的内容为空');
      }

      console.log('提取的内容:', content.substring(0, 200) + '...');

      // 提取JSON（AI可能返回markdown格式的JSON）
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('未找到JSON格式，原始内容:', content);
        throw new Error('AI返回的内容中未找到JSON格式');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const result = JSON.parse(jsonStr) as ContractAnalysisResult;

      console.log('解析结果成功:', result);
      return result;
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.error('原始内容:', content);
      console.error('完整API响应:', data);
      throw new Error(`解析AI响应失败: ${parseError instanceof Error ? parseError.message : '未知错误'}`);
    }
  } catch (error) {
    console.error('AI合同解析失败:', error);
    throw error;
  }
}

/**
 * 验证并修正提取的数据
 */
export async function verifyAndCorrectData(
  extractedData: ContractAnalysisResult,
  contractInfo: {
    contractName: string;
    contractAmount: string;
    contractPeriod: string;
    projectTypeKeywords: string;
  }
): Promise<ContractAnalysisResult> {
  const config = getAPIConfig();

  if (!config.enabled || !config.apiKey) {
    throw new Error('AI功能未启用或未配置API密钥');
  }

  const prompt = buildPrompt(CONTRACT_ANALYSIS_PROMPT, {
    extracted_data: JSON.stringify(extractedData),
    contract_name: contractInfo.contractName,
    contract_amount: contractInfo.contractAmount,
    contract_period: contractInfo.contractPeriod,
    project_type_keywords: contractInfo.projectTypeKeywords,
  });

  // 这里使用简化版的验证提示词
  const verificationPrompt = `请验证以下从合同中提取的数据是否合理，如有明显错误请修正：

### 提取的数据：
${JSON.stringify(extractedData)}

### 原始合同关键信息：
- 合同名称：${contractInfo.contractName}
- 合同金额：${contractInfo.contractAmount}
- 工期：${contractInfo.contractPeriod}
- 工程类型：${contractInfo.projectTypeKeywords}

### 验证规则：
1. 工程造价（万元）≈ 合同金额（万元），误差不超过20%
2. 工期：根据开工/竣工日期计算，与提取值比对
3. 施工人数：建筑面积÷30-50，范围是否合理
4. 风险等级：根据工程类型和特征判断是否合理

请返回修正后的JSON，如有明显错误请修正，并说明修正原因。`;

  try {
    let endpoint = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    let body: any = {};

    switch (config.provider) {
      case 'openai':
        endpoint = `${config.apiEndpoint}/chat/completions`;
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = {
          model: config.model,
          messages: [
            { role: 'user', content: verificationPrompt },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        };
        break;

      case 'qwen':
        // 通义千问使用DashScope API
        endpoint = config.apiEndpoint || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = {
          model: config.model,
          input: {
            messages: [
              { role: 'user', content: verificationPrompt },
            ],
          },
          parameters: {
            temperature: 0.2,
            max_tokens: 1500,
            result_format: 'message',
          },
        };
        break;

      case 'anthropic':
        endpoint = `${config.apiEndpoint}/v1/messages`;
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: config.model,
          max_tokens: 1500,
          messages: [
            { role: 'user', content: verificationPrompt },
          ],
        };
        break;

      default:
        throw new Error(`不支持的AI提供商: ${config.provider}`);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    let content = '';

    if (config.provider === 'anthropic') {
      content = data.content[0]?.text || '';
    } else if (config.provider === 'qwen') {
      // 通义千问DashScope API响应格式
      content = data.output?.choices?.[0]?.message?.content || data.output?.text || '';
    } else {
      content = data.choices[0]?.message?.content || '';
    }

    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI返回的内容中未找到JSON格式');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonStr) as ContractAnalysisResult;
  } catch (error) {
    console.error('数据验证失败:', error);
    throw error;
  }
}

/**
 * 使用大模型视觉能力识别图片或PDF中的文本
 * @param imageBase64 base64编码的图片或PDF（不包含data:前缀）
 * @param prompt 可选的自定义提示词
 * @param fileType 文件类型（'image' 或 'pdf'）
 * @returns 识别出的文本内容
 */
export async function extractTextFromImage(
  imageBase64: string,
  prompt?: string,
  fileType: 'image' | 'pdf' = 'image'
): Promise<string> {
  const config = getAPIConfig();

  if (!config.enabled || !config.apiKey) {
    throw new Error('AI功能未启用或未配置API密钥');
  }

  // 检查模型是否支持视觉能力
  const visionModels = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4-vision-preview', 'gpt-4o-mini'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
               'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    qwen: ['qwen-vl-max', 'qwen-vl-plus', 'qwen-vl-v1'],
  };

  const supportedModels = visionModels[config.provider as keyof typeof visionModels] || [];
  const isVisionSupported = supportedModels.some(m => config.model.includes(m));

  if (!isVisionSupported) {
    throw new Error(`当前配置的模型 ${config.model} 不支持视觉能力。请使用以下模型之一：
${supportedModels.join(', ')}`);
  }

  const temperature = config.temperature || 0.7;
  const maxTokens = config.maxTokens || 4000;

  // 根据文件类型生成不同的提示词
  const getFileTypePrompt = () => {
    if (fileType === 'pdf') {
      return prompt || `请识别这份PDF文件中的所有文字内容。这是一份建筑保险施工合同。
请逐字逐句提取所有文字，保持原有的格式和结构。
特别注意提取：工程名称、工程造价、建筑面积、工期、项目地点、工程类型等关键信息。`;
    }
    return prompt || `请仔细识别这张图片中的所有文字内容。这是一份建筑保险合同或相关文档。
请按原文内容逐字逐句地提取所有文字，保持原有的格式和结构。
不要添加任何解释或分析，只需要返回图片中显示的原始文字内容。`;
  };

  const defaultPrompt = getFileTypePrompt();

  // 根据文件类型确定MIME类型
  const mimeType = fileType === 'pdf' ? 'application/pdf' : 'image/jpeg';

  let endpoint = '';
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  let body: any = {};

  console.log(`使用视觉模型识别${fileType === 'pdf' ? 'PDF' : '图片'}:`, config.model);

  switch (config.provider) {
    case 'openai':
      endpoint = `${config.apiEndpoint}/chat/completions`;
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: defaultPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        temperature,
        max_tokens: maxTokens,
      };
      break;

    case 'anthropic':
      endpoint = `${config.apiEndpoint}/v1/messages`;
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      body = {
        model: config.model,
        max_tokens: maxTokens,
        system: '你是一位专业的文档识别专家。请准确识别文档中的所有文字内容。',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: defaultPrompt,
              },
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      };
      break;

    case 'qwen':
      // 通义千问视觉模型 - 使用兼容OpenAI的格式
      endpoint = config.apiEndpoint || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      body = {
        model: config.model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的文档识别专家。请准确识别文档中的所有文字内容。',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: defaultPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature,
        max_tokens: maxTokens,
      };
      break;

    default:
      throw new Error(`不支持的AI提供商: ${config.provider}`);
  }

  console.log('发送视觉识别请求到:', endpoint);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);  // 2分钟超时

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('视觉识别API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      throw new Error(`视觉识别API请求失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('视觉识别响应数据:', JSON.stringify(data, null, 2));

    // 解析响应
    let content = '';
    if (config.provider === 'anthropic') {
      content = data.content?.[0]?.text || '';
    } else {
      // OpenAI、通义千问（兼容模式）、Azure都使用相同格式
      content = data.choices?.[0]?.message?.content || '';
    }

    if (!content) {
      console.error('无法从响应中提取内容，完整响应:', data);
      throw new Error('视觉识别返回的内容为空');
    }

    console.log('视觉识别成功，内容长度:', content.length);
    return content;

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('视觉识别请求超时（超过2分钟），请尝试减少PDF页数或降低图片质量');
    }

    console.error('视觉识别失败:', error);
    throw error;
  }
}
