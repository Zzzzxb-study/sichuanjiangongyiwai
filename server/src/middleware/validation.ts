import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

// 项目信息验证模式
const projectInfoSchema = Joi.object({
  projectName: Joi.string().required().min(1).max(200).messages({
    'string.empty': '项目名称不能为空',
    'string.max': '项目名称不能超过200个字符'
  }),
  projectType: Joi.string().valid('rural', 'non_rural').required().messages({
    'any.only': '项目性质必须是rural或non_rural'
  }),
  totalCost: Joi.when('projectType', {
    is: 'non_rural',
    then: Joi.number().positive().required().messages({
      'number.positive': '项目总造价必须大于0',
      'any.required': '非农村项目必须提供总造价'
    }),
    otherwise: Joi.number().positive().optional()
  }),
  totalArea: Joi.when('projectType', {
    is: 'rural',
    then: Joi.number().positive().required().messages({
      'number.positive': '项目总面积必须大于0',
      'any.required': '农村项目必须提供总面积'
    }),
    otherwise: Joi.number().positive().optional()
  }),
  engineeringClass: Joi.number().integer().min(1).max(4).required().messages({
    'number.base': '工程分类必须是数字',
    'number.integer': '工程分类必须是整数',
    'number.min': '工程分类必须在1-4之间',
    'number.max': '工程分类必须在1-4之间'
  }),
  startDate: Joi.date().required().messages({
    'date.base': '开工日期格式不正确'
  }),
  endDate: Joi.date().greater(Joi.ref('startDate')).required().messages({
    'date.base': '竣工日期格式不正确',
    'date.greater': '竣工日期必须晚于开工日期'
  }),
  contractType: Joi.string().valid('general', 'professional', 'labor').required().messages({
    'any.only': '合同类型必须是general、professional或labor之一'
  }),
  companyQualification: Joi.string().valid('special', 'first', 'second', 'third', 'unclassified').required(),
  managementLevel: Joi.string().valid('sound', 'relatively_sound', 'unsound').required(),
  address: Joi.string().required().min(1).max(500).messages({
    'string.empty': '工程地址不能为空',
    'string.max': '工程地址不能超过500个字符'
  }),
  constructionUnit: Joi.string().required().min(1).max(200).messages({
    'string.empty': '施工单位不能为空',
    'string.max': '施工单位不能超过200个字符'
  })
});

// 主险参数验证模式
const mainInsuranceSchema = Joi.object({
  coverageAmount: Joi.number().positive().required().messages({
    'number.positive': '保险金额必须大于0'
  }),
  k7ManagementLevel: Joi.number().min(0.5).max(1.5).required().messages({
    'number.min': 'K7管理水平系数不能小于0.5',
    'number.max': 'K7管理水平系数不能大于1.5'
  }),
  k8LossRecord: Joi.number().min(0.5).max(1.2).required().messages({
    'number.min': 'K8损失记录系数不能小于0.5',
    'number.max': 'K8损失记录系数不能大于1.2'
  })
});

// 附加医疗险参数验证模式
const medicalInsuranceSchema = Joi.object({
  coverageAmount: Joi.number().positive().max(200000).required().messages({
    'number.positive': '医疗保险金额必须大于0',
    'number.max': '医疗保险金额不能超过20万元'
  }),
  deductible: Joi.number().min(0).max(5000).required().messages({
    'number.min': '免赔额不能小于0',
    'number.max': '免赔额不能超过5000元'
  }),
  paymentRatio: Joi.number().min(50).max(100).required().messages({
    'number.min': '给付比例不能小于50%',
    'number.max': '给付比例不能超过100%'
  }),
  hasSocialInsurance: Joi.boolean().required(),
  hasOtherMedicalInsurance: Joi.boolean().required()
});

// 高原病险参数验证模式
const plateauDiseaseSchema = Joi.object({
  personnelRiskLevel: Joi.string().valid('A', 'B', 'C').required(),
  regionRiskLevel: Joi.string().valid('A', 'B', 'C').required(),
  applicableInsurances: Joi.array().items(
    Joi.string().valid('main', 'medical', 'allowance', 'acute_disease')
  ).min(1).required().messages({
    'array.min': '至少需要选择一个适用的险种'
  })
});

// 保费计算请求验证模式
const calculationRequestSchema = Joi.object({
  projectInfo: projectInfoSchema.required(),
  insuranceParams: Joi.object({
    main: mainInsuranceSchema.required(),
    medical: medicalInsuranceSchema.optional(),
    allowance: Joi.object({
      dailyLimit: Joi.number().positive().max(500).required(),
      waitingDays: Joi.number().integer().min(0).max(30).required(),
      paymentDays: Joi.number().integer().min(1).max(365).required()
    }).optional(),
    acuteDisease: Joi.object({
      coverageAmount: Joi.number().positive().max(100000).required()
    }).optional(),
    plateauDisease: plateauDiseaseSchema.optional()
  }).required()
});

/**
 * 验证保费计算请求
 */
export const validateCalculationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = calculationRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);

    logger.warn('请求参数验证失败', {
      url: req.url,
      method: req.method,
      errors: errorMessages,
      body: req.body
    });

    res.status(400).json({
      success: false,
      error: '请求参数验证失败',
      details: errorMessages
    });
    return;
  }

  // 将验证后的数据赋值给req.body
  req.body = value;
  next();
};

/**
 * 验证合同上传请求
 */
export const validateContractUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: '请上传合同文件'
    });
    return;
  }

  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    res.status(400).json({
      success: false,
      error: '只支持PDF和Word文档格式'
    });
    return;
  }

  // 文件大小限制：50MB
  const maxSize = 50 * 1024 * 1024;
  if (req.file.size > maxSize) {
    res.status(400).json({
      success: false,
      error: '文件大小不能超过50MB'
    });
    return;
  }

  next();
};

/**
 * 通用参数验证中间件
 */
export const validateSchema = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);

      logger.warn('参数验证失败', {
        url: req.url,
        method: req.method,
        errors: errorMessages,
        body: req.body // 记录请求体
      });

      res.status(400).json({
        success: false,
        error: '参数验证失败',
        details: errorMessages
      });
      return;
    }

    req.body = value;
    next();
  };
};