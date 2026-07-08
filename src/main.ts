/**
 * UserLand Frontend Vue project.
 * Author: Paweł Papierkowski.
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import { logger } from '@/code/utils/logger.ts';
import i18n from '@/code/lang/i18n.ts';

import './styles/main.css';

//

const app = createApp(App);

app.use(logger);
app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount('#app');
