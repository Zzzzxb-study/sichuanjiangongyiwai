export const theme = {
  colors: {
    primary: {
      blue: '#3B82F6',           // 亮蓝色
      blueLight: '#60A5FA',       // 更亮的蓝色
      blueDark: '#2563EB',        // 深蓝色
      sky: '#00A3FF',            // 天蓝色
    },
    accent: {
      gold: '#D4AF37',            // 金色（保留少量使用）
      goldLight: '#E6C659',
      goldDark: '#B8941F',
    },
    secondary: {
      blue: '#3B82F6',            // 主蓝色
      cyan: '#06B6D4',            // 青色
      green: '#10B981',           // 绿色
      mint: '#6EE7B7',            // 薄荷绿
      red: '#EF4444',             // 红色
      orange: '#F59E0B',          // 橙色
    },
    neutral: {
      50: '#FDFCF8',             // 极浅的暖白（主背景）
      100: '#FAF9F6',            // 浅暖白
      200: '#F5F3F0',            // 浅灰暖
      300: '#F0EBE3',            // 分割线颜色
      400: '#E5E2DD',            // 边框颜色
      500: '#D4D0CB',            // 中灰
      600: '#9B9590',            // 深中灰
      700: '#7A746E',            // 正文文字
      800: '#475569',            // 深灰 (slate-600)
      900: '#1E293B',            // 标题文字 (slate-800)
    },
    semantic: {
      success: '#059669',         // 饱和的绿色 (emerald-600) - 增长
      warning: '#F59E0B',         // 橙色
      error: '#E11D48',           // 饱和的红色 (rose-600) - 下降
      info: '#3B82F6',            // 蓝色
    },
    // 浅色背景色
    backgrounds: {
      blue50: '#EFF6FF',          // blue-50 用于图标容器背景
      blue100: '#DBEAFE',         // blue-100
    },
    // 浅色主题渐变
    gradients: {
      warmWhite: 'linear-gradient(135deg, #FDFCF8 0%, #FAF9F6 100%)',
      blueLight: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
      skyBlue: 'linear-gradient(135deg, #00A3FF 0%, #3B82F6 100%)',
      softShadow: 'linear-gradient(135deg, rgba(200, 180, 150, 0.05) 0%, rgba(200, 180, 150, 0.1) 100%)',
    },
  },
  fonts: {
    display: "'Crimson Pro', serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',               // rounded-xl
    '2xl': '1.5rem',          // rounded-2xl
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(67, 62, 58, 0.05)',
    md: '0 4px 6px -1px rgba(67, 62, 58, 0.1), 0 2px 4px -1px rgba(67, 62, 58, 0.06)',
    lg: '0 10px 15px -3px rgba(67, 62, 58, 0.1), 0 4px 6px -2px rgba(67, 62, 58, 0.05)',
    xl: '0 20px 25px -5px rgba(67, 62, 58, 0.1), 0 10px 10px -5px rgba(67, 62, 58, 0.04)',
    // 暖色调阴影
    warm: '0 8px 30px rgba(200, 180, 150, 0.1)',
    warmLg: '0 12px 40px rgba(200, 180, 150, 0.15)',
    soft: '0 4px 20px rgba(59, 130, 246, 0.08)',
    glow: '0 0 20px rgba(59, 130, 246, 0.2)',
  },
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
  // 浅色主题纹理
  patterns: {
    dot: 'radial-gradient(circle, rgba(59, 130, 246, 0.03) 1px, transparent 1px)',
    grid: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(59, 130, 246, 0.02) 20px)',
  },
};