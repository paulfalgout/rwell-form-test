import { createApp } from 'vue';
import { plugin as FormKitPlugin, defaultConfig } from '@formkit/vue';
import App from './App.vue';
import './assets/main.css';
import '@formkit/themes/genesis';

// Create the Vue application
const app = createApp(App);

// Register FormKit plugin
app.use(FormKitPlugin, defaultConfig);

// Mount the application
app.mount('#app');
