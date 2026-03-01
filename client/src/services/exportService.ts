/**
 * 导出服务
 * 用于将方案详情导出为PDF或图片
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * 导出为PDF
 * @param element 要导出的DOM元素
 * @param filename 文件名
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string = `方案详情_${new Date().toLocaleDateString()}.pdf`
): Promise<void> {
  try {
    console.log('[Export] 开始导出PDF...', { filename, element });

    // 显示加载提示
    const loadingMessage = document.createElement('div');
    loadingMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 16px;
    `;
    loadingMessage.textContent = '正在生成PDF...';
    document.body.appendChild(loadingMessage);

    // 添加留白参数
    const padding = 60; // 上下左右留白（像素）
    const elementWidth = element.scrollWidth;
    const elementHeight = element.scrollHeight;

    console.log('[Export] 元素尺寸:', {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      scrollWidth: elementWidth,
      scrollHeight: elementHeight
    });

    // 使用 html2canvas 直接捕捉元素，添加白色背景包装
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      logging: true, // 启用日志以便调试
      backgroundColor: '#ffffff',
      windowWidth: elementWidth + padding * 2,
      windowHeight: elementHeight + padding * 2,
    });

    console.log('[Export] html2canvas完成，canvas尺寸:', {
      width: canvas.width,
      height: canvas.height
    });

    // 移除加载提示
    document.body.removeChild(loadingMessage);

    // 计算 PDF 尺寸（A4 纸张比例，添加留白）
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const pdfPageWidth = 675; // A4 宽度 + 留白（单位：点）
    const pdfPageHeight = (imgHeight * pdfPageWidth) / imgWidth;
    const pdfWidth = pdfPageWidth - padding; // 实际内容宽度
    const pdfHeight = pdfPageHeight - padding; // 实际内容高度
    const pdfX = padding / 2; // 水平居中
    const pdfY = padding / 2; // 垂直居中

    // 创建 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [pdfPageWidth, pdfPageHeight],
    });

    // 添加图片到 PDF（带留白）
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', pdfX, pdfY, pdfWidth, pdfHeight);

    // 保存 PDF
    pdf.save(filename);

    console.log('[Export] PDF 导出成功');
  } catch (error) {
    console.error('[Export] PDF 导出失败:', error);
    throw new Error('PDF 导出失败: ' + (error as Error).message);
  }
}

/**
 * 导出为图片
 * @param element 要导出的DOM元素
 * @param filename 文件名
 */
export async function exportToImage(
  element: HTMLElement,
  filename: string = `方案详情_${new Date().toLocaleDateString()}.png`
): Promise<void> {
  try {
    console.log('[Export] 开始导出图片...', { filename, element });

    // 显示加载提示
    const loadingMessage = document.createElement('div');
    loadingMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 40px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 16px;
    `;
    loadingMessage.textContent = '正在生成图片...';
    document.body.appendChild(loadingMessage);

    // 添加留白参数
    const padding = 80; // 上下左右留白（像素）
    const elementWidth = element.scrollWidth;
    const elementHeight = element.scrollHeight;

    console.log('[Export] 元素尺寸:', {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      scrollWidth: elementWidth,
      scrollHeight: elementHeight
    });

    console.log('[Export] 开始使用html2canvas...');

    // 使用 html2canvas 直接捕捉元素，添加留白
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true,
      logging: true, // 启用日志以便调试
      backgroundColor: '#ffffff',
      windowWidth: elementWidth + padding * 2,
      windowHeight: elementHeight + padding * 2,
    });

    console.log('[Export] html2canvas完成，canvas尺寸:', {
      width: canvas.width,
      height: canvas.height
    });

    // 创建带留白的新 canvas
    const paddedCanvas = document.createElement('canvas');
    const ctx = paddedCanvas.getContext('2d');
    const scale = 2; // 与 html2canvas 的 scale 一致

    paddedCanvas.width = canvas.width + padding * 2 * scale;
    paddedCanvas.height = canvas.height + padding * 2 * scale;

    // 填充白色背景
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);

      // 将原 canvas 绘制到中心位置
      ctx.drawImage(
        canvas,
        padding * scale, // x 偏移
        padding * scale, // y 偏移
        canvas.width,
        canvas.height
      );
    }

    console.log('[Export] 带留白的canvas尺寸:', {
      width: paddedCanvas.width,
      height: paddedCanvas.height
    });

    // 移除加载提示
    document.body.removeChild(loadingMessage);

    // 转换为图片并下载
    paddedCanvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('图片生成失败');
      }
      console.log('[Export] 图片生成成功，blob大小:', blob.size);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      console.log('[Export] 图片导出成功');
    }, 'image/png');
  } catch (error) {
    console.error('[Export] 图片导出失败:', error);
    throw new Error('图片导出失败: ' + (error as Error).message);
  }
}
