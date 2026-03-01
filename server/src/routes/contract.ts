import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { ContractController } from '../controllers/contractController';
import { validateContractUpload } from '../middleware/validation';

const router = Router();
const contractController = new ContractController();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/contracts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持PDF和Word文档格式'));
    }
  }
});

/**
 * 上传并解析合同
 * POST /api/contract/parse
 */
router.post('/parse', upload.single('contract'), validateContractUpload, contractController.parseContract);

/**
 * 获取解析历史
 * GET /api/contract/history
 */
router.get('/history', contractController.getParseHistory);

/**
 * 重新解析合同
 * POST /api/contract/reparse/:id
 */
router.post('/reparse/:id', contractController.reparseContract);

/**
 * 删除解析记录
 * DELETE /api/contract/:id
 */
router.delete('/:id', contractController.deleteParseRecord);

/**
 * 获取工程分类建议
 * POST /api/contract/classify
 */
router.post('/classify', contractController.getEngineeringClassification);

/**
 * 检测高原地区
 * POST /api/contract/check-altitude
 */
router.post('/check-altitude', contractController.checkHighAltitude);

export default router;