<template>
  <div class="note-list-panel">
    <div class="note-list-header">
      <div class="note-list-title">{{ listTitle }}</div>
      <div class="note-list-actions">
        <button class="icon-btn" @click="sortDesc = !sortDesc" title="切换排序">↕</button>
        <button class="icon-btn" @click="openNewNoteModal" title="新建笔记">＋</button>
      </div>
    </div>
    <div class="note-list" ref="noteListRef">
      <div
        class="note-item"
        v-for="note in displayedNotes"
        :key="note.id"
        :class="{active: activeNoteId === note.id}"
        @click="openNote(note.id)"
      >
        <div class="note-item-icon">{{ note.type === 'todo' ? '✅' : '📄' }}</div>
        <div class="note-item-body">
          <div class="note-item-title">{{ note.title || '无标题' }}</div>
          <div class="note-item-meta">
            <span class="note-item-dot" :style="{background: colorMap[note.color] || colorMap.default}"></span>
            <span>{{ formatDate(note.updatedAt) }}</span>
          </div>
        </div>
        <div class="note-item-actions" @click.stop>
          <button class="icon-btn-sm" @click="showCtx($event, note.id)">⋯</button>
        </div>
      </div>
      <div v-if="displayedNotes.length === 0" class="empty-hint">
        暂无笔记，点击 ＋ 新建
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useNoteStore } from '../stores/noteStore'
import { useUIStore } from '../stores/uiStore'

const noteStore = useNoteStore()
const uiStore = useUIStore()
const { notes, activeNoteId, sortDesc, activeFolder } = storeToRefs(noteStore)

const colorMap = {
  blue: '#4f8ef7', yellow: '#f6e05e', pink: '#f687b3',
  green: '#68d391', purple: '#b794f4', teal: '#63b3ed', default: '#9aa3bc'
}

const displayedNotes = computed(() => {
  let list = [...notes.value]
  if (activeFolder.value) {
    list = list.filter(n => n.folderId === activeFolder.value)
  }
  list.sort((a, b) => {
    const fa = sortDesc.value ? 1 : -1
    return (new Date(b.updatedAt) - new Date(a.updatedAt)) * fa
  })
  return list
})

const listTitle = computed(() => {
  if (activeFolder.value) {
    const f = noteStore.folders.find(f => f.id === activeFolder.value)
    return f ? f.name : '笔记'
  }
  return '全部笔记'
})

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}
function openNote(id) { noteStore.openNote(id) }
function openNewNoteModal() { uiStore.openModal('new-note-modal') }
function showCtx(e, id) { uiStore.showContextMenu(e, id) }
</script>

<style scoped>
.note-list-panel {
  width: 280px; border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
}
.note-list-header {
  padding: 12px 16px; display: flex; align-items: center;
  justify-content: space-between; border-bottom: 1px solid var(--border-light);
}
.note-list-title { font-size: 13px; font-weight: 600; }
.note-list-actions { display: flex; gap: 4px; }
.note-list { flex: 1; overflow-y: auto; }
.note-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 16px;
  cursor: pointer; border-bottom: 1px solid var(--border-light);
  transition: var(--transition);
}
.note-item:hover { background: var(--bg-hover); }
.note-item.active { background: var(--bg-active); }
.note-item-icon { font-size: 16px; flex-shrink: 0; }
.note-item-body { flex: 1; min-width: 0; }
.note-item-title {
  font-size: 13px; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.note-item-meta {
  display: flex; align-items: center; gap: 6px;
  margin-top: 4px; font-size: 11px; color: var(--text-muted);
}
.note-item-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.note-item-actions { opacity: 0; transition: var(--transition); }
.note-item:hover .note-item-actions { opacity: 1; }
.icon-btn {
  width: 26px; height: 26px; border-radius: 4px; border: none;
  background: transparent; color: var(--text-muted); cursor: pointer; font-size: 13px;
}
.icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
.icon-btn-sm {
  width: 24px; height: 24px; border-radius: 4px; border: none;
  background: transparent; color: var(--text-muted); cursor: pointer; font-size: 14px;
}
.icon-btn-sm:hover { background: var(--bg-hover); color: var(--text-primary); }
.empty-hint { text-align: center; color: var(--text-muted); font-size: 12px; padding: 20px; }
</style>
