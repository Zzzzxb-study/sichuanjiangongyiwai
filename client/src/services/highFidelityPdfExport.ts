/**
 * 高保真 PDF 导出服务
 * 使用 html2canvas 捕获页面视觉效果，jsPDF 转换为 PDF，然后与条款 PDF 合并
 */

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:58080/api';

/**
 * 捕获 DOM 元素为 PDF
 * @param element 要捕获的 DOM 元素
 * @param filename PDF 文件名
 * @returns PDF 文件的 ArrayBuffer
 */
export const captureElementAsPDF = async (
  element: HTMLElement,
  filename: string = 'quote.pdf'
): Promise<ArrayBuffer> => {
  console.log('[captureElementAsPDF] 开始捕获 DOM 元素');

  // 创建临时样式标签，用于隐藏不需要导出的元素
  const style = document.createElement('style');
  style.id = 'pdf-export-temp-style';
  style.textContent = `
    /* 隐藏带有 data-export-exclude 属性的元素 */
    [data-export-exclude="true"] {
      display: none !important;
    }

    /* 给导出容器添加内边距，实现页边留白 */
    [data-export-container="true"] {
      padding-top: 50px !important;
      padding-bottom: 100px !important;
      padding-left: 100px !important;
      padding-right: 100px !important;
      box-sizing: border-box !important;
    }
  `;
  document.head.appendChild(style);

  try {
    // 使用 html2canvas 捕获元素
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 支持跨域图片
      logging: true, // 开启日志以便调试
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth + 40, // 增加宽度避免内容被裁剪
      windowHeight: element.scrollHeight + 40,
      allowTaint: false,
    });

    console.log('[captureElementAsPDF] Canvas 捕获完成，尺寸:', canvas.width, 'x', canvas.height);

    // 获取 canvas 尺寸
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // A4 尺寸（以毫米为单位）
    const a4WidthMM = 210;
    const a4HeightMM = 297;

    // 创建 PDF（横向或纵向根据内容决定）
    const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    // 获取 PDF 页面尺寸（以毫米为单位）
    const pdfWidthMM = pdf.internal.pageSize.getWidth();
    const pdfHeightMM = pdf.internal.pageSize.getHeight();

    // 计算缩放比例（使内容适应 PDF 页面）
    const scaleX = pdfWidthMM / (imgWidth / 2.83); // 2.83 是像素到毫米的转换系数
    const scale = Math.min(scaleX, 1); // 不放大，只缩小

    // 计算最终图片尺寸（以毫米为单位）
    const finalImgWidthMM = (imgWidth / 2.83) * scale;
    const finalImgHeightMM = (imgHeight / 2.83) * scale;

    console.log('[captureElementAsPDF] PDF 配置:', {
      orientation,
      pdfWidthMM,
      pdfHeightMM,
      finalImgWidthMM,
      finalImgHeightMM,
      scale,
    });

    // 添加图片到 PDF
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, finalImgWidthMM, finalImgHeightMM);

    // 返回 PDF 的 ArrayBuffer
    const pdfArrayBuffer = await pdf.output('arraybuffer');
    console.log('[captureElementAsPDF] PDF 生成完成，大小:', pdfArrayBuffer.byteLength);

    return pdfArrayBuffer;
  } finally {
    // 无论成功或失败，都移除临时样式
    const tempStyle = document.getElementById('pdf-export-temp-style');
    if (tempStyle) {
      tempStyle.remove();
    }
    console.log('[captureElementAsPDF] 已清理临时样式');
  }
};

/**
 * 高保真导出报价方案 PDF（包含条款）
 * @param planId 方案 ID
 * @param element 要捕获的 DOM 元素
 * @param filename 文件名
 */
export const exportHighFidelityPDF = async (
  planId: string,
  element: HTMLElement,
  filename?: string
): Promise<void> => {
  try {
    console.log('[exportHighFidelityPDF] 开始高保真 PDF 导出，planId:', planId);

    // 1. 捕获详情页面为 PDF（ArrayBuffer）
    const firstPagePdfBuffer = await captureElementAsPDF(element, filename || '报价单.pdf');
    console.log('[exportHighFidelityPDF] 首页 PDF 捕获完成');

    // 2. 将第一页 PDF 发送到后端与条款合并
    const formData = new FormData();
    formData.append('firstPage', new Blob([firstPagePdfBuffer], { type: 'application/pdf' }));

    console.log('[exportHighFidelityPDF] 发送到后端合并 API');
    const response = await fetch(`${API_BASE_URL}/pricing-plans/${planId}/export-pdf-merged`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[exportHighFidelityPDF] 后端合并失败:', response.status, errorText);
      throw new Error(`导出PDF失败: ${response.status} ${errorText}`);
    }

    // 3. 下载合并后的 PDF
    const contentDisposition = response.headers.get('Content-Disposition');
    let finalFilename = filename || '报价单.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        finalFilename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }

    console.log('[exportHighFidelityPDF] 下载合并后的 PDF，文件名:', finalFilename);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    console.log('[exportHighFidelityPDF] PDF 导出完成');
  } catch (error) {
    console.error('[exportHighFidelityPDF] 高保真PDF导出失败:', error);
    throw error;
  }
};
