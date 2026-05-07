<template>
  <Teleport to="body">
    <div class="auth-backdrop" v-if="show">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="auth-logo-icon">📝</span>
          <span class="auth-logo-text">Jotto</span>
        </div>

        <div class="auth-tabs">
          <button :class="['auth-tab', { active: tab === 'login' }]" @click="tab = 'login'">登录</button>
          <button :class="['auth-tab', { active: tab === 'register' }]" @click="tab = 'register'">注册</button>
        </div>

        <form @submit.prevent="submit" class="auth-form">
          <div class="auth-field">
            <label>邮箱</label>
            <input v-model="email" type="email" placeholder="your@email.com" autocomplete="email" required />
          </div>
          <div class="auth-field">
            <label>密码</label>
            <input v-model="password" type="password" placeholder="至少 6 位" autocomplete="current-password" required minlength="6" />
          </div>

          <p v-if="error" class="auth-error">{{ error }}</p>
          <p v-if="successMsg" class="auth-success">{{ successMsg }}</p>

          <button type="submit" class="auth-submit" :disabled="loading">
            <span v-if="loading">处理中…</span>
            <span v-else>{{ tab === 'login' ? '登录' : '创建账号' }}</span>
          </button>
        </form>

        <p class="auth-hint">
          {{ tab === 'login' ? '还没有账号？' : '已有账号？' }}
          <button class="auth-link" @click="tab = tab === 'login' ? 'register' : 'login'">
            {{ tab === 'login' ? '立即注册' : '去登录' }}
          </button>
        </p>

        <button class="auth-guest" @click="$emit('guest')">暂不登录，本地使用</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'

defineProps({ show: { type: Boolean, default: false } })
const emit = defineEmits(['guest'])

const authStore = useAuthStore()
const tab = ref('login')
const email = ref('')
const password = ref('')
const error = ref('')
const successMsg = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  successMsg.value = ''
  loading.value = true
  try {
    if (tab.value === 'login') {
      await authStore.login(email.value, password.value)
    } else {
      await authStore.register(email.value, password.value)
      successMsg.value = '注册成功！请查收验证邮件后登录。'
      tab.value = 'login'
    }
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-backdrop {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.auth-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  width: 360px;
  padding: 32px 28px 24px;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.2s ease;
}
@keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

.auth-logo {
  display: flex; align-items: center; gap: 8px;
  justify-content: center; margin-bottom: 24px;
}
.auth-logo-icon { font-size: 24px; }
.auth-logo-text { font-size: 20px; font-weight: 700; color: var(--text-primary); }

.auth-tabs {
  display: flex; gap: 4px;
  background: var(--bg-hover); border-radius: var(--radius);
  padding: 3px; margin-bottom: 20px;
}
.auth-tab {
  flex: 1; padding: 6px; border: none; border-radius: 6px;
  font-size: 13px; font-weight: 500; cursor: pointer;
  background: transparent; color: var(--text-secondary);
  transition: var(--transition);
}
.auth-tab.active {
  background: var(--bg-card); color: var(--text-primary);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}

.auth-form { display: flex; flex-direction: column; gap: 14px; }

.auth-field { display: flex; flex-direction: column; gap: 5px; }
.auth-field label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
.auth-field input {
  padding: 9px 12px; border-radius: var(--radius);
  border: 1px solid var(--border); background: var(--bg-hover);
  color: var(--text-primary); font-size: 13px; outline: none;
  transition: var(--transition);
}
.auth-field input:focus { border-color: var(--accent); }

.auth-error {
  font-size: 12px; color: var(--danger);
  background: rgba(229, 62, 108, 0.1); border-radius: var(--radius-sm);
  padding: 6px 10px;
}
.auth-success {
  font-size: 12px; color: var(--success);
  background: rgba(72, 187, 120, 0.1); border-radius: var(--radius-sm);
  padding: 6px 10px;
}

.auth-submit {
  width: 100%; padding: 10px; border-radius: var(--radius);
  border: none; background: var(--accent); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: var(--transition); margin-top: 2px;
}
.auth-submit:hover:not(:disabled) { background: var(--accent-hover); }
.auth-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.auth-hint {
  text-align: center; font-size: 12px; color: var(--text-muted);
  margin-top: 16px;
}
.auth-link {
  background: none; border: none; color: var(--accent);
  cursor: pointer; font-size: 12px; padding: 0;
}
.auth-link:hover { text-decoration: underline; }

.auth-guest {
  display: block; width: 100%; margin-top: 10px;
  padding: 7px; border-radius: var(--radius);
  border: 1px solid var(--border); background: transparent;
  color: var(--text-muted); font-size: 12px; cursor: pointer;
  transition: var(--transition);
}
.auth-guest:hover { color: var(--text-secondary); border-color: var(--text-muted); }
</style>
