/**
 * 文件解析服务
 * 用于从PDF、Word、图片等文件中提取文本内容
 * 优先使用大模型视觉能力进行识别
 */

// 文件解析库
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import { extractTextFromImage as extractTextFromImageAI } from './aiService';

// 配置PDF.js worker - 使用本地worker文件
console.log('正在配置PDF.js...');
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
console.log('PDF.js配置完成');

export interface ParseResult {
  text: string;
  confidence?: number;
  method: 'pdf' | 'word' | 'ocr' | 'text';
  success: boolean;
  error?: string;
}

/**
 * 从文件中提取文本
 */
export async function extractTextFromFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  try {
    // PDF文件
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      return await extractFromPDF(file);
    }

    // Word文档
    if (
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      fileType.includes('wordprocessingml') ||
      fileType.includes('msword')
    ) {
      return await extractFromWord(file);
    }

    // 图片文件
    if (
      fileName.match(/\.(jpg|jpeg|png|bmp|gif|tiff|webp)$/) ||
      fileType.startsWith('image/')
    ) {
      return await extractFromImage(file);
    }

    // 纯文本文件
    if (
      fileName.endsWith('.txt') ||
      fileName.endsWith('.md') ||
      fileType === 'text/plain'
    ) {
      return await extractFromText(file);
    }

    return {
      text: '',
      success: false,
      method: 'text',
      error: `不支持的文件格式: ${fileName}`,
    };
  } catch (error) {
    console.error('文件解析失败:', error);
    return {
      text: '',
      success: false,
      method: 'text',
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 从PDF文件中提取文本
 * 优先使用文本提取（快），仅扫描版使用视觉识别（慢）
 */
async function extractFromPDF(file: File): Promise<ParseResult> {
  try {
    console.log('开始解析PDF文件:', file.name);
    const arrayBuffer = await file.arrayBuffer();

    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;

    console.log(`PDF文件共 ${totalPages} 页，开始提取文本...`);

    // 第一步：快速提取文本（适用于非扫描版PDF）
    let fullText = '';
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      fullText += `${pageText}\n`;
    }

    // 判断文本量，检测是否为扫描版PDF
    const textLength = fullText.trim().length;
    const avgCharsPerPage = textLength / totalPages;

    console.log(`PDF文本提取结果: 总字符数 ${textLength}, 平均每页 ${avgCharsPerPage.toFixed(0)} 字符`);

    // 如果每页平均字符少于100，很可能是扫描版PDF，需要使用视觉识别
    if (avgCharsPerPage < 100) {
      console.log('检测到扫描版PDF，启用AI视觉识别...');

      // 智能页面选择策略：根据总页数动态决定处理哪些页面
      let pagesToProcess: number[];
      let strategyNote = '';

      if (totalPages <= 5) {
        // 少于5页：全部处理
        pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
        strategyNote = `共${totalPages}页，全部处理`;
      } else if (totalPages <= 20) {
        // 5-20页：处理前5页（通常包含所有核心信息）
        pagesToProcess = [1, 2, 3, 4, 5];
        strategyNote = `共${totalPages}页，处理前5页（关键信息通常在前5页）`;
      } else {
        // 超过20页：前3页 + 中间页 + 最后页
        const middlePage = Math.floor(totalPages / 2);
        pagesToProcess = [1, 2, 3, middlePage, totalPages];
        strategyNote = `共${totalPages}页，处理关键页面（前3页+第${middlePage}页+最后页）。建议使用PDF编辑器提取文本后上传以获得最佳效果。`;
      }

      console.log(`智能页面选择策略: ${strategyNote}`);
      console.log(`将处理以下页面: ${pagesToProcess.join(', ')}`);

      fullText = '';
      fullText += `\n=== PDF解析信息 ===\n`;
      fullText += `总页数: ${totalPages}\n`;
      fullText += `处理策略: ${strategyNote}\n`;
      fullText += `处理页面: ${pagesToProcess.join(', ')}\n`;
      fullText += `===================\n\n`;

      for (const pageNum of pagesToProcess) {
        console.log(`AI识别第 ${pageNum}/${totalPages} 页...`);

        try {
          const page = await pdf.getPage(pageNum);

          // 渲染PDF页面为canvas（优化参数提升速度）
          const scale = 1.0;  // 降低分辨率：从1.5降到1.0
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });  // 优化：关闭alpha通道
          if (!context) {
            throw new Error('无法创建canvas context');
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;

          // 将canvas转换为base64图片（降低质量以提升速度）
          const imageData = canvas.toDataURL('image/jpeg', 0.5);  // 降低质量：从0.7降到0.5
          const base64 = imageData.split(',')[1];

          console.log(`第 ${pageNum} 页已转换为图片，base64长度:`, base64.length);

          // 优化的AI提示词：强调只提取关键信息
          const prompt = `请识别这张图片（PDF第${pageNum}页，共${totalPages}页）中的所有文字内容。
这是一份建筑保险施工合同。

重点提取以下关键信息：
1. 工程名称、项目名称
2. 工程造价、合同价款、签约合同价
3. 建筑面积、施工规模
4. 承包人、施工方、乙方信息
5. 工期、开工日期、竣工日期
6. 项目地点、工程地址
7. 特殊施工工艺（如爆破、隧道、深基坑、高空作业等）
8. 保险相关条款

请逐字逐句提取，保持原有格式，忽略通用的法律条款和模板内容。`;

          const pageText = await extractTextFromImageAI(base64, prompt);
          fullText += `\n--- 第 ${pageNum} 页 ---\n${pageText}\n`;

          // 清理canvas
          canvas.remove();

        } catch (pageError) {
          console.error(`第 ${pageNum} 页AI识别失败:`, pageError);
          fullText += `\n--- 第 ${pageNum} 页（识别失败）---\n`;
        }
      }

      if (totalPages > 5) {
        fullText += `\n=== 提示 ===\n${strategyNote}\n`;
        if (totalPages > 20) {
          fullText += `如需完整解析，建议使用Adobe Acrobat等PDF编辑器提取文本后上传，或将合同拆分为多个文件上传。\n`;
        }
        fullText += `===========\n`;
      }
    } else {
      console.log('PDF文本提取成功（非扫描版）');

      // 非扫描版PDF：智能内容过滤提示
      fullText += `\n=== PDF解析信息 ===\n`;
      fullText += `总页数: ${totalPages}页\n`;
      fullText += `解析方式: 文本提取（非扫描版）\n`;
      fullText += `===================\n\n`;
    }

    if (!fullText.trim() || fullText.trim().length < 10) {
      return {
        text: '',
        success: false,
        method: 'pdf',
        error: '未能从PDF中提取到足够的文字内容',
      };
    }

    console.log('PDF解析完成，总内容长度:', fullText.length);

    return {
      text: fullText.trim(),
      success: true,
      method: 'pdf',
    };

  } catch (error) {
    console.error('PDF解析失败:', error);

    const errorMessage = error instanceof Error ? error.message : '未知错误';

    // 提供更友好的错误提示
    if (errorMessage.includes('worker') || errorMessage.includes('Worker')) {
      return {
        text: '',
        success: false,
        method: 'pdf',
        error: 'PDF组件初始化失败，请尝试将PDF转换为图片后上传',
      };
    }

    return {
      text: '',
      success: false,
      method: 'pdf',
      error: `PDF解析失败: ${errorMessage}`,
    };
  }
}

/**
 * 从Word文档中提取文本
 */
async function extractFromWord(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    if (result.messages && result.messages.length > 0) {
      console.warn('Word解析警告:', result.messages);
    }

    return {
      text: result.value.trim(),
      success: true,
      method: 'word',
    };
  } catch (error) {
    console.error('Word解析失败:', error);
    return {
      text: '',
      success: false,
      method: 'word',
      error: error instanceof Error ? error.message : 'Word文档解析失败',
    };
  }
}

/**
 * 从图片中提取文本（使用大模型视觉识别）
 */
async function extractFromImage(file: File): Promise<ParseResult> {
  try {
    console.log('开始使用大模型视觉识别图片:', file.name);

    // 将图片文件转换为base64
    const base64 = await fileToBase64(file);

    console.log('图片已转换为base64，长度:', base64.length);

    // 使用大模型视觉识别
    const text = await extractTextFromImageAI(base64);

    if (!text || text.trim().length === 0) {
      return {
        text: '',
        success: false,
        method: 'ocr',
        error: '大模型未能识别出图片中的文字',
      };
    }

    console.log('视觉识别成功，内容长度:', text.length);

    return {
      text: text.trim(),
      success: true,
      method: 'ocr',
    };
  } catch (error) {
    console.error('视觉识别失败:', error);
    return {
      text: '',
      success: false,
      method: 'ocr',
      error: error instanceof Error ? error.message : '视觉识别失败',
    };
  }
}

/**
 * 将文件转换为base64（不含data:image前缀）
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 从纯文本文件中读取
 */
async function extractFromText(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve({
        text: text.trim(),
        success: true,
        method: 'text',
      });
    };

    reader.onerror = () => {
      resolve({
        text: '',
        success: false,
        method: 'text',
        error: '文件读取失败',
      });
    };

    reader.readAsText(file);
  });
}

/**
 * 获取文件大小（格式化）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 预估解析时间
 */
export function estimateParseTime(file: File, method: ParseResult['method']): number {
  const fileSizeMB = file.size / (1024 * 1024);

  // PDF: 每页约2秒
  if (method === 'pdf') {
    return Math.ceil(fileSizeMB * 10); // 粗略估计
  }

  // Word: 较快
  if (method === 'word') {
    return Math.ceil(fileSizeMB * 2);
  }

  // OCR: 较慢，每张图片约10-30秒
  if (method === 'ocr') {
    return 20; // 固定预估20秒
  }

  // 纯文本: 很快
  return 2;
}
