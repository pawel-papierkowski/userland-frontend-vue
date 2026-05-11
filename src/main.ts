/**
 * UserLand Frontend Vue project.
 * Author: Paweł Papierkowski.
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

import i18n from './code/i18n.ts'

import './styles/main.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount('#app');
