import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import vi from 'element-plus/es/locale/lang/vi';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import App from './App.vue';
import router from './router';
import './style.css';

const app = createApp(App);
const pinia = createPinia();

// Register all Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus, { locale: vi });

// Global formatting utility
app.config.globalProperties.$formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
};

// Global error handler to catch browser extension/Edge errors
app.config.errorHandler = (err, instance, info) => {
  if (err.message && (err.message.includes('translationService') || err.message.includes('academia'))) {
    return; // Ignore Edge Editor errors
  }
  console.error('Vue Error:', err, info);
};

app.mount('#app');
