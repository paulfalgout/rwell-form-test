import { createApp } from 'vue';
import { plugin as FormKitPlugin, defaultConfig } from '@formkit/vue';
import Form from './Form.vue';
import '../assets/main.css';
import '@formkit/themes/genesis';

// Create the Vue application
const app = createApp(Form);

// Register FormKit plugin
app.use(FormKitPlugin, defaultConfig);

/**
 * Global render / watcher / lifecycle error handler
 */
app.config.errorHandler = (err, instance, info) => {
  // TODO add datadog
  console.error('💥 Vue render error:', info, err);

  setTimeout(() => { throw err; });
};

// Mount the application
app.mount('#app');
