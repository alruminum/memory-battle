import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'memory-battle',
  brand: {
    displayName: '기억력배틀',
    primaryColor: '#ff6900',
    icon: null, // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
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
});
