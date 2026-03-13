/// <reference types="vite/client" />

// 为 CSS 模块提供类型声明
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// 为其他样式文件类型提供声明
declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.less' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.sass' {
  const content: Record<string, string>;
  export default content;
}
