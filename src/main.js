import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './styles/main.css'

const app = createApp(App)

app.directive('click-outside', {
  mounted(el, binding) {
    el.__clickOutside = (event) => {
      if (!el.contains(event.target) && typeof binding.value === 'function') {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.__clickOutside, true)
  },
  unmounted(el) {
    document.removeEventListener('click', el.__clickOutside, true)
  }
})

const pinia = createPinia()
app.use(pinia)

// 初始化 auth（在 app mount 之前检查 session）
import { useAuthStore } from './stores/authStore'
const authStore = useAuthStore(pinia)
authStore.init()

app.mount('#app')
