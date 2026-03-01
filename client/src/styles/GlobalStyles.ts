import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

  :root {
    /* Primary Colors - Deep Navy & Purple */
    --primary-navy: #1a2332;
    --primary-navy-light: #2a3441;
    --primary-navy-dark: #0f1419;
    --accent-purple: #764ba2;
    --accent-purple-light: #9f7aea;
    --accent-purple-dark: #6b46c1;

    /* Secondary Colors */
    --secondary-blue: #3b82f6;
    --secondary-green: #10b981;
    --secondary-red: #ef4444;
    --secondary-orange: #f59e0b;

    /* Neutral Colors */
    --neutral-50: #fafbfc;
    --neutral-100: #f4f6f8;
    --neutral-200: #e5e9ed;
    --neutral-300: #d1d8e0;
    --neutral-400: #9ca3af;
    --neutral-500: #6b7280;
    --neutral-600: #4b5563;
    --neutral-700: #374151;
    --neutral-800: #1f2937;
    --neutral-900: #111827;

    /* Semantic Colors */
    --success: #10b981;
    --warning: #f59e0b;
    --error: #ef4444;
    --info: #3b82f6;

    /* Typography */
    --font-display: 'Crimson Pro', serif;
    --font-body: 'Inter', sans-serif;

    /* Spacing */
    --space-xs: 0.25rem;
    --space-sm: 0.5rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;
    --space-3xl: 4rem;

    /* Border Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(26, 35, 50, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(26, 35, 50, 0.1), 0 2px 4px -1px rgba(26, 35, 50, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(26, 35, 50, 0.1), 0 4px 6px -2px rgba(26, 35, 50, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(26, 35, 50, 0.1), 0 10px 10px -5px rgba(26, 35, 50, 0.04);

    /* Transitions */
    --transition-fast: 150ms ease-in-out;
    --transition-normal: 250ms ease-in-out;
    --transition-slow: 350ms ease-in-out;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    font-size: 16px;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-body);
    font-weight: 400;
    line-height: 1.6;
    color: var(--neutral-700);
    background: linear-gradient(135deg, var(--neutral-50) 0%, var(--neutral-100) 100%);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 1.2;
    color: var(--primary-navy);
    margin-bottom: var(--space-md);
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
  }

  h2 {
    font-size: 2rem;
  }

  h3 {
    font-size: 1.5rem;
  }

  h4 {
    font-size: 1.25rem;
  }

  p {
    margin-bottom: var(--space-md);
  }

  a {
    color: var(--secondary-blue);
    text-decoration: none;
    transition: color var(--transition-fast);

    &:hover {
      color: var(--accent-purple);
    }
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all var(--transition-fast);
  }

  input, textarea, select {
    font-family: inherit;
    outline: none;
    transition: all var(--transition-fast);
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: var(--neutral-100);
  }

  ::-webkit-scrollbar-thumb {
    background: var(--neutral-300);
    border-radius: var(--radius-md);

    &:hover {
      background: var(--neutral-400);
    }
  }

  /* Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .animate-fade-in-scale {
    animation: fadeInScale 0.4s ease-out;
  }

  /* Utility Classes */
  .text-gradient {
    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--accent-purple) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .glass-effect {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .card-hover {
    transition: all var(--transition-normal);

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
    }
  }

  /* Ant Design Overrides */
  .ant-btn-primary {
    background: linear-gradient(135deg, var(--primary-navy) 0%, var(--primary-navy-light) 100%);
    border: none;
    box-shadow: var(--shadow-md);

    &:hover {
      background: linear-gradient(135deg, var(--primary-navy-light) 0%, var(--accent-purple-dark) 100%);
      transform: translateY(-1px);
      box-shadow: var(--shadow-lg);
    }
  }

  .ant-upload-drag {
    border: 2px dashed var(--neutral-300);
    background: var(--neutral-50);
    transition: all var(--transition-normal);

    &:hover {
      border-color: var(--accent-purple);
      background: rgba(118, 75, 162, 0.05);
    }
  }

  .ant-table-thead > tr > th {
    background: var(--neutral-100);
    color: var(--primary-navy);
    font-weight: 600;
    border-bottom: 2px solid var(--accent-purple);
  }

  .ant-card {
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--neutral-200);

    .ant-card-head {
      border-bottom: 1px solid var(--neutral-200);

      .ant-card-head-title {
        font-family: var(--font-display);
        font-weight: 600;
        color: var(--primary-navy);
      }
    }
  }
`;