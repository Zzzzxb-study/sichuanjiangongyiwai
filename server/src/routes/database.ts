import { Router } from 'express';
import { database } from '../database/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * 获取数据库统计信息
 */
router.get('/stats', (req, res) => {
  try {
    const stats = database.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('获取数据库统计失败', error);
    res.status(500).json({
      success: false,
      error: '获取数据库统计失败'
    });
  }
});

/**
 * 备份数据库
 */
router.post('/backup', (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./data/backups/insurance_pricing_${timestamp}.db`;

    database.backup(backupPath);

    return res.json({
      success: true,
      message: '数据库备份成功',
      data: { backupPath }
    });
  } catch (error) {
    logger.error('数据库备份失败', error);
    return res.status(500).json({
      success: false,
      error: '数据库备份失败'
    });
  }
});

/**
 * 清空所有数据（危险操作）
 */
router.post('/clear', (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'YES_I_AM_SURE') {
      return res.status(400).json({
        success: false,
        error: '请确认操作：confirm参数必须为"YES_I_AM_SURE"'
      });
    }

    database.clearAll();

    return res.json({
      success: true,
      message: '所有数据已清空'
    });
  } catch (error) {
    logger.error('清空数据失败', error);
    return res.status(500).json({
      success: false,
      error: '清空数据失败'
    });
  }
});

export default router;
