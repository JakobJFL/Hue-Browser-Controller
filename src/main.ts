import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { initCloudflareAnalytics } from './utils/analytics'

initCloudflareAnalytics()
createApp(App).mount('#app')

