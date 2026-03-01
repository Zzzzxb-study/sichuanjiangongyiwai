/**
 * 合同解析记录服务
 * 用于保存和查询合同解析历史记录
 */

import { type ContractAnalysisResult } from './aiService';

export interface ContractRecord {
  id: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  parseMethod: 'pdf' | 'word' | 'ocr' | 'text';
  parseSuccess: boolean;
  analysisSuccess: boolean;
  data: ContractAnalysisResult;
  errorMessage?: string;
  projectId?: string;
  businessNo?: string;
}

const STORAGE_KEY = 'contract_analysis_records';

/**
 * 保存合同解析记录
 */
export function saveContractRecord(record: ContractRecord): void {
  try {
    const records = loadContractRecords();
    // 将新记录添加到开头
    records.unshift(record);
    // 最多保留100条记录
    const limitedRecords = records.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedRecords));
  } catch (error) {
    console.error('保存合同记录失败:', error);
  }
}

/**
 * 加载所有合同解析记录
 */
export function loadContractRecords(): ContractRecord[] {
  try {
    const recordsStr = localStorage.getItem(STORAGE_KEY);
    if (recordsStr) {
      return JSON.parse(recordsStr);
    }
  } catch (error) {
    console.error('加载合同记录失败:', error);
  }
  return [];
}

/**
 * 根据ID更新合同记录
 */
export function updateContractRecord(id: string, updatedData: Partial<ContractAnalysisResult>): boolean {
  try {
    const records = loadContractRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      records[index].data = {
        ...records[index].data,
        ...updatedData
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      console.log('合同记录已更新:', id, updatedData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('更新合同记录失败:', error);
    return false;
  }
}

/**
 * 根据ID更新合同记录的元数据（projectId、businessNo等）
 */
export function updateContractRecordMetadata(id: string, metadata: { projectId?: string; businessNo?: string }): boolean {
  try {
    const records = loadContractRecords();
    const index = records.findIndex(r => r.id === id);
    if (index !== -1) {
      if (metadata.projectId !== undefined) {
        records[index].projectId = metadata.projectId;
      }
      if (metadata.businessNo !== undefined) {
        records[index].businessNo = metadata.businessNo;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      console.log('合同记录元数据已更新:', id, metadata);
      return true;
    }
    return false;
  } catch (error) {
    console.error('更新合同记录元数据失败:', error);
    return false;
  }
}

/**
 * 根据ID删除合同记录
 */
export function deleteContractRecord(id: string): boolean {
  try {
    const records = loadContractRecords();
    const filteredRecords = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
    return true;
  } catch (error) {
    console.error('删除合同记录失败:', error);
    return false;
  }
}

/**
 * 批量删除合同记录
 */
export function batchDeleteContractRecords(ids: string[]): boolean {
  try {
    const records = loadContractRecords();
    const filteredRecords = records.filter(r => !ids.includes(r.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords));
    return true;
  } catch (error) {
    console.error('批量删除合同记录失败:', error);
    return false;
  }
}

/**
 * 清空所有记录
 */
export function clearAllRecords(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('清空合同记录失败:', error);
    return false;
  }
}

/**
 * 根据项目名称搜索记录
 */
export function searchRecordsByProjectName(keyword: string): ContractRecord[] {
  const records = loadContractRecords();
  if (!keyword.trim()) {
    return records;
  }
  return records.filter(r =>
    r.data.projectName.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * 根据日期范围筛选记录
 */
export function filterRecordsByDateRange(
  records: ContractRecord[],
  startDate?: string,
  endDate?: string
): ContractRecord[] {
  let filtered = records;

  if (startDate) {
    filtered = filtered.filter(r => r.uploadTime >= startDate);
  }

  if (endDate) {
    // 结束日期需要加一天，以包含当天
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    filtered = filtered.filter(r => r.uploadTime <= endDateTime.toISOString());
  }

  return filtered;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 格式化日期时间
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
