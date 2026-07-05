const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/test/Downloads/workspace-f42/src';
const custDir = 'c:/Users/test/Downloads/workspace-f42/washly-customer';
const cleanDir = 'c:/Users/test/Downloads/workspace-f42/washly-cleaner';

function copyFile(relPath, destApp) {
  const sourcePath = path.join(srcDir, relPath);
  const destPath = path.join(destApp, 'src', relPath);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(sourcePath, destPath);
}

const viteConfig = "import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nimport path from 'path'\n\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './src'),\n    },\n  },\n})";

const tsConfig = '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "isolatedModules": true,\n    "moduleDetection": "force",\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": false,\n    "noUnusedParameters": false,\n    "noFallthroughCasesInSwitch": true,\n    "noUncheckedSideEffectImports": true,\n    "baseUrl": ".",\n    "paths": {\n      "@/*": ["./src/*"]\n    }\n  },\n  "include": ["src"]\n}';

const authStore = "import { create } from \"zustand\";\nimport { persist } from \"zustand/middleware\";\n\nconst API_BASE = import.meta.env.VITE_API_URL || \"http://192.168.29.243:3000\";\n\nexport interface SessionUser {\n  id: string;\n  email: string;\n  name: string;\n  phone: string;\n  role: \"CUSTOMER\" | \"CLEANER\" | \"ADMIN\";\n  avatar?: string | null;\n  address?: string | null;\n}\n\ninterface AuthState {\n  user: SessionUser | null;\n  token: string | null;\n  login: (user: SessionUser, token: string) => void;\n  logout: () => void;\n}\n\nexport const useAuth = create<AuthState>()(\n  persist(\n    (set) => ({\n      user: null,\n      token: null,\n      login: (user, token) => set({ user, token }),\n      logout: () => set({ user: null, token: null }),\n    }),\n    { name: \"washly-auth\" }\n  )\n);\n\nexport function authFetch(url: string, init: RequestInit = {}) {\n  const token = useAuth.getState().token;\n  const headers = new Headers(init?.headers);\n  if (token) headers.set(\"Authorization\", `Bearer ${'${token}'}`);\n  if (init?.body && !headers.has(\"Content-Type\")) {\n    headers.set(\"Content-Type\", \"application/json\");\n  }\n  const fullUrl = url.startsWith(\"http\") ? url : `${'${API_BASE}'}${'${url}'}`;\n  return fetch(fullUrl, { ...init, headers });\n}";

const mainTsx = "import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)";

const envFile = "VITE_API_URL=http://192.168.29.243:3000";

function setupApp(appDir, role) {
  fs.writeFileSync(path.join(appDir, 'vite.config.ts'), viteConfig);
  fs.writeFileSync(path.join(appDir, 'tsconfig.json'), tsConfig);
  if (fs.existsSync(path.join(appDir, 'tsconfig.app.json'))) fs.unlinkSync(path.join(appDir, 'tsconfig.app.json'));
  if (fs.existsSync(path.join(appDir, 'tsconfig.node.json'))) fs.unlinkSync(path.join(appDir, 'tsconfig.node.json'));
  
  const capConfig = "import type { CapacitorConfig } from '@capacitor/cli';\n\nconst config: CapacitorConfig = {\n  appId: 'com.washly." + role.toLowerCase() + "',\n  appName: 'Washly " + role + "',\n  webDir: 'dist',\n  server: {\n    androidScheme: 'https',\n    cleartext: true\n  }\n};\n\nexport default config;";
  fs.writeFileSync(path.join(appDir, 'capacitor.config.ts'), capConfig);
  
  fs.writeFileSync(path.join(appDir, '.env'), envFile);

  const css = fs.readFileSync(path.join(srcDir, 'app/globals.css'), 'utf-8');
  fs.writeFileSync(path.join(appDir, 'src/index.css'), '@import "tailwindcss";\n' + css);

  copyFile('lib/utils.ts', appDir);
  copyFile('lib/format.ts', appDir);
  copyFile('hooks/use-toast.ts', appDir);
  copyFile('hooks/use-mobile.ts', appDir);
  
  fs.mkdirSync(path.join(appDir, 'src/lib'), { recursive: true });
  fs.writeFileSync(path.join(appDir, 'src/lib/auth-store.ts'), authStore);

  let ui = ['button.tsx', 'card.tsx', 'badge.tsx', 'avatar.tsx', 'progress.tsx', 'dialog.tsx', 'scroll-area.tsx', 'label.tsx', 'input.tsx', 'toast.tsx', 'toaster.tsx', 'sonner.tsx'];
  if (role === 'Customer') ui.push('tabs.tsx', 'separator.tsx', 'calendar.tsx');
  if (role === 'Cleaner') ui.push('alert-dialog.tsx');
  ui.forEach(f => copyFile('components/ui/' + f, appDir));

  copyFile('components/shared/washly-logo.tsx', appDir);
  copyFile('components/shared/status-badge.tsx', appDir);
  copyFile('components/notifications/notification-bell.tsx', appDir);

  let loginContent = fs.readFileSync(path.join(srcDir, 'components/shared/login-screen.tsx'), 'utf-8');
  if (role === 'Customer') {
    loginContent = loginContent.replace(/const DEMO_ACCOUNTS[\s\S]*?\];/, "const DEMO_ACCOUNTS = [\n  { role: \"Customer\", email: \"priya@gmail.com\", password: \"customer123\", name: \"Priya Sharma\", icon: Users, desc: \"Premium plan subscriber\" },\n];");
  } else {
    loginContent = loginContent.replace(/const DEMO_ACCOUNTS[\s\S]*?\];/, "const DEMO_ACCOUNTS = [\n  { role: \"Cleaner\", email: \"rajesh@washly.com\", password: \"cleaner123\", name: \"Rajesh Kumar\", icon: Car, desc: \"Active field cleaner\" },\n];");
  }
  fs.writeFileSync(path.join(appDir, 'src/components/shared/login-screen.tsx'), loginContent);

  const appTsx = "import { useAuth } from \"@/lib/auth-store\";\nimport { LoginScreen } from \"@/components/shared/login-screen\";\nimport { " + role + "App } from \"@/components/" + role.toLowerCase() + "/" + role.toLowerCase() + "-app\";\nimport { Toaster as SonnerToaster } from \"@/components/ui/sonner\";\nimport { Toaster } from \"@/components/ui/toaster\";\n\nexport default function App() {\n  const { user } = useAuth();\n  return (\n    <>\n      {user && user.role === \"" + role.toUpperCase() + "\" ? <" + role + "App /> : <LoginScreen />}\n      <SonnerToaster position=\"top-right\" richColors closeButton />\n      <Toaster />\n    </>\n  );\n}";
  fs.writeFileSync(path.join(appDir, 'src/App.tsx'), appTsx);

  fs.writeFileSync(path.join(appDir, 'src/main.tsx'), mainTsx);
  
  let html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf-8');
  html = html.replace(/<title>.*?<\/title>/, "<title>Washly " + role + "</title>\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">\n    <meta name=\"theme-color\" content=\"#0d9488\">");
  fs.writeFileSync(path.join(appDir, 'index.html'), html);
}

setupApp(custDir, 'Customer');
copyFile('components/customer/customer-app.tsx', custDir);

setupApp(cleanDir, 'Cleaner');
copyFile('components/cleaner/cleaner-app.tsx', cleanDir);

console.log("Done");
