<template>
  <div class="app" :data-theme="uiStore.theme">
    <template v-if="!authStore.loading">
      <template v-if="authStore.user || guestMode">
        <TitleBar />
        <div class="app-body">
          <Sidebar />
          <main class="main">
            <NoteList />
            <Editor />
          </main>
        </div>
        <StickyContainer />
        <ContextMenu />
        <Toast />
        <Modal name="new-note-modal">
          <NewNoteModal />
        </Modal>
        <Modal name="new-folder-modal">
          <NewFolderModal />
        </Modal>
      </template>

      <LoginModal :show="!authStore.user && !guestMode" @guest="enterGuestMode" />
    </template>

    <div v-else class="app-loading">
      <span class="app-loading-dot" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import NoteList from './components/NoteList.vue'
import Editor from './components/Editor.vue'
import StickyContainer from './components/StickyContainer.vue'
import ContextMenu from './components/ContextMenu.vue'
import Toast from './components/Toast.vue'
import Modal from './components/Modal.vue'
import NewNoteModal from './components/NewNoteModal.vue'
import NewFolderModal from './components/NewFolderModal.vue'
import LoginModal from './components/LoginModal.vue'
import { useNoteStore } from './stores/noteStore'
import { useUIStore } from './stores/uiStore'
import { useAuthStore } from './stores/authStore'

const noteStore = useNoteStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const guestMode = ref(false)

function enterGuestMode() {
  guestMode.value = true
  noteStore.init()
}

// 登录后初始化数据
watch(() => authStore.user, async (user) => {
  if (user) {
    guestMode.value = false
    await noteStore.init()
  }
}, { immediate: false })

// 首次 auth 检查完成后初始化
watch(() => authStore.loading, async (loading) => {
  if (!loading && authStore.user) {
    await noteStore.init()
  }
}, { immediate: true })
</script>

<style scoped>
.app-loading {
  display: flex; align-items: center; justify-content: center;
  height: 100vh;
}
.app-loading-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent); animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.6); }
}
</style>
