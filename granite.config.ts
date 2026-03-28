import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'memory-battle',
  brand: {
    displayName: '기억력배틀',
    primaryColor: '#ff6900',
    icon: 'https://static.toss.im/icons/png/4x/icon-person-man.png', // 콘솔 등록 후 실제 앱 아이콘 URL로 교체
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite',
      build: 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
  webViewProps: {
    type: 'game',
  },
});
