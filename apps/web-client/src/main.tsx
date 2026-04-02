import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient } from '#pkg/seedar/ui-core';
import type { ApiConfig } from '#pkg/seedar/types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 初始化 API 客户端
const apiConfig: ApiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  autoParseResponse: true,
  globalOnError: (error) => {
    console.error('API Error:', error);
    if (error.code === '401') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  },
};

ApiClient.init(apiConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </DndProvider>
  </React.StrictMode>,
);
