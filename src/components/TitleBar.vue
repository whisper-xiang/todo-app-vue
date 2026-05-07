<template>
  <div class="titlebar">
    <div class="titlebar-dot red"></div>
    <div class="titlebar-dot yellow"></div>
    <div class="titlebar-dot green"></div>
    <div class="titlebar-title">Jotto</div>
    <div class="titlebar-actions">
      <div class="theme-switch" v-click-outside="closeThemePanel">
        <button class="titlebar-btn" @click="showThemePanel = !showThemePanel">
          {{ themeIcon }} 主题
        </button>
        <div v-if="showThemePanel" class="theme-panel">
          <div class="theme-option" :class="{ active: uiStore.theme === 'light' }" @click="selectTheme('light')">
            <span class="theme-preview light-preview"></span> 浅色
          </div>
          <div class="theme-option" :class="{ active: uiStore.theme === 'dark' }" @click="selectTheme('dark')">
            <span class="theme-preview dark-preview"></span> 深色
          </div>
          <div class="theme-option" :class="{ active: uiStore.theme === 'diy' }" @click="selectTheme('diy')">
            <span class="theme-preview diy-preview"></span> DIY
          </div>
          <div v-if="uiStore.theme === 'diy'" class="diy-colors">
            <div class="diy-row" v-for="(val, key) in diyFields" :key="key">
              <label>{{ diyLabels[key] || key }}</label>
              <input type="color" :value="uiStore.diyColors[key]" @input="updateDIY(key, $event.target.value)" />
              <span class="diy-hex">{{ uiStore.diyColors[key] }}</span>
            </div>
          </div>
        </div>
      </div>
      <button class="titlebar-btn" @click="createSticker">＋ 便签</button>
      <button class="titlebar-btn primary" @click="openNewNoteModal">＋ 新建笔记</button>

      <!-- 用户信息 -->
      <div v-if="authStore.user" class="user-menu" v-click-outside="closeUserMenu">
        <button class="user-avatar" @click="showUserMenu = !showUserMenu" :title="authStore.user.email">
          {{ userInitial }}
        </button>
        <div v-if="showUserMenu" class="user-panel">
          <div class="user-email">{{ authStore.user.email }}</div>
          <button class="user-logout" @click="logout">退出登录</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useNoteStore } from '../stores/noteStore'
import { useUIStore } from '../stores/uiStore'
import { useAuthStore } from '../stores/authStore'

const noteStore = useNoteStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const showThemePanel = ref(false)
const showUserMenu = ref(false)

const userInitial = computed(() => {
  const email = authStore.user?.email || ''
  return email.charAt(0).toUpperCase()
})

function closeUserMenu() { showUserMenu.value = false }

async function logout() {
  showUserMenu.value = false
  await authStore.logout()
}

const themeIcon = ref('🌞')
watch(() => uiStore.theme, (v) => {
  themeIcon.value = v === 'light' ? '🌞' : v === 'dark' ? '🌙' : '🎨'
}, { immediate: true })

function selectTheme(t) {
  uiStore.setTheme(t)
  if (t !== 'diy') showThemePanel.value = false
}

function updateDIY(key, val) {
  uiStore.setDIYColors({ [key]: val })
}

function closeThemePanel() {
  showThemePanel.value = false
}

const diyFields = {
  bg: '背景',
  bgSidebar: '侧边栏',
  textPrimary: '主文字',
  textSecondary: '次文字',
  border: '边框',
  accent: '强调色',
  bgHover: '悬浮背景',
  bgEditor: '编辑器',
  bgNote: '笔记背景',
}
</script>

<style scoped>
.titlebar {
  height: 40px;
  background: var(--bg-sidebar);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  -webkit-app-region: drag;
  user-select: none;
  position: relative;
}
.titlebar-dot { width: 12px; height: 12px; border-radius: 50%; cursor: pointer; -webkit-app-region: no-drag; }
.titlebar-dot.red { background: #ff5f57; }
.titlebar-dot.yellow { background: #febc2e; }
.titlebar-dot.green { background: #28c840; }
.titlebar-title { margin-left: 8px; font-size: 13px; color: var(--text-secondary); font-weight: 500; }
.titlebar-actions { margin-left: auto; display: flex; gap: 8px; -webkit-app-region: no-drag; }
.titlebar-btn {
  padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border);
  background: transparent; color: var(--text-secondary); font-size: 12px;
  cursor: pointer; transition: var(--transition); font-family: var(--font);
}
.titlebar-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.titlebar-btn.primary { background: var(--accent); border-color: var(--accent); color: white; }
.titlebar-btn.primary:hover { background: var(--accent-hover); }

/* 主题面板 */
.theme-switch { position: relative; }
.theme-panel {
  position: absolute; top: 36px; right: 0; width: 260px;
  background: var(--bg-note); border: 1px solid var(--border); border-radius: 8px;
  box-shadow: var(--shadow-hover); padding: 8px; z-index: 999;
  -webkit-app-region: no-drag;
}
.theme-option {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 6px; cursor: pointer;
  font-size: 13px; color: var(--text-primary);
}
.theme-option:hover { background: var(--bg-hover); }
.theme-option.active { background: var(--accent); color: white; }
.theme-preview { width: 18px; height: 18px; border-radius: 4px; border: 1px solid var(--border); flex-shrink: 0; }
.light-preview { background: #f8f9fa; }
.dark-preview { background: #1e293b; }
.diy-preview { background: linear-gradient(135deg, #6366f1 40%, #f59e0b 60%); }

/* DIY 颜色编辑 */
.diy-colors { margin-top: 8px; border-top: 1px solid var(--border); padding-top: 8px; }
.diy-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; font-size: 11px; color: var(--text-secondary); }
.diy-row label { width: 70px; flex-shrink: 0; text-align: right; }
.diy-row input[type="color"] { width: 28px; height: 22px; border: none; cursor: pointer; background: none; padding: 0; }
.diy-hex { font-family: monospace; font-size: 10px; color: var(--text-muted); }

/* 用户菜单 */
.user-menu { position: relative; -webkit-app-region: no-drag; }
.user-avatar {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--accent); color: #fff;
  border: none; font-size: 12px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: var(--transition);
}
.user-avatar:hover { background: var(--accent-hover); }
.user-panel {
  position: absolute; top: 34px; right: 0; min-width: 180px;
  background: var(--bg-note); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: var(--shadow-hover);
  padding: 8px; z-index: 999;
}
.user-email {
  font-size: 11px; color: var(--text-muted);
  padding: 4px 8px 8px; border-bottom: 1px solid var(--border);
  word-break: break-all;
}
.user-logout {
  width: 100%; margin-top: 6px; padding: 6px 8px;
  border-radius: 6px; border: none;
  background: transparent; color: var(--danger);
  font-size: 13px; cursor: pointer; text-align: left;
  transition: var(--transition);
}
.user-logout:hover { background: rgba(229,62,108,0.1); }
</style>
