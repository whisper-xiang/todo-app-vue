import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'workbuddy-notes-data'

export const useNoteStore = defineStore('notes', () => {
  // State
  const notes = ref([])
  const folders = ref([])
  const stickers = ref([])
  const activeNoteId = ref(null)
  const activeFolder = ref(null)
  const sidebarTab = ref('notes')
  const editorMode = ref('edit')
  const selectedNoteType = ref('note')
  const selectedColor = ref('blue')
  const sortDesc = ref(true)
  const filterType = ref('')

  // true = logged-in Supabase mode; false = guest localStorage mode
  const isOnline = ref(false)

  // Computed
  const activeNote = computed(() => notes.value.find(n => n.id === activeNoteId.value))
  const filteredNotes = computed(() => {
    let result = notes.value
    if (activeFolder.value) {
      result = result.filter(n => n.folderId === activeFolder.value)
    }
    return sortDesc.value
      ? [...result].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      : [...result].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
  })

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }

  function now() {
    return new Date().toISOString()
  }

  // ─── LocalStorage (guest mode) ────────────────────────────────────────────

  function loadLocal() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.warn('加载本地数据失败')
    }
    return getDefaultData()
  }

  function saveLocal() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        notes: notes.value,
        folders: folders.value,
        stickers: stickers.value
      }))
    } catch (e) {
      console.warn('保存本地数据失败')
    }
  }

  function getDefaultData() {
    return {
      folders: [
        { id: 'f1', name: '工作' },
        { id: 'f2', name: '学习' },
        { id: 'f3', name: '生活' },
      ],
      notes: [
        {
          id: 'n1', title: '项目周报', type: 'note', color: 'blue', folderId: 'f1',
          content: '# 本周进度\n\n## 完成的工作\n- 完成了前端框架搭建\n- 接入了用户认证模块\n- 代码 Review 已完成\n\n## 下周计划\n- 开发数据可视化模块\n- 编写单元测试\n\n> 注意：周五需要提交给产品确认',
          tags: ['工作', '周报'], createdAt: now(), updatedAt: now(), hasStickyNote: false, todos: []
        },
        {
          id: 'n2', title: '学习笔记 - TypeScript', type: 'note', color: 'purple', folderId: 'f2',
          content: '# TypeScript 核心概念\n\n## 类型系统\n\nTypeScript 在 JavaScript 基础上添加了静态类型系统。',
          tags: ['学习', '前端'], createdAt: now(), updatedAt: now(), hasStickyNote: false, todos: []
        },
        {
          id: 'n3', title: '今日待办', type: 'todo', color: 'yellow', folderId: null,
          content: '', tags: [], createdAt: now(), updatedAt: now(), hasStickyNote: false,
          todos: [
            { id: 't1', text: '完成 UI 设计稿', done: true, priority: 'high' },
            { id: 't2', text: '和产品对齐需求', done: true, priority: 'medium' },
            { id: 't3', text: '提交代码到 main 分支', done: false, priority: 'high' },
          ]
        },
      ],
      stickers: []
    }
  }

  // ─── Supabase helpers ─────────────────────────────────────────────────────

  // 将 Supabase snake_case 行转为前端 camelCase note 对象
  function rowToNote(row) {
    return {
      id: row.id,
      title: row.title,
      type: row.type,
      color: row.color,
      folderId: row.folder_id,
      content: row.content || '',
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      hasStickyNote: row.has_sticky_note || false,
      todos: (row.todos || []).map(t => ({
        id: t.id,
        text: t.text,
        done: t.done,
        priority: t.priority,
      })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    }
  }

  function rowToFolder(row) {
    return { id: row.id, name: row.name }
  }

  function rowToSticker(row) {
    return {
      id: row.id, title: row.title, content: row.content,
      theme: row.theme, color: row.color,
      pinned: row.pinned, hidden: row.hidden,
      x: row.x, y: row.y, w: row.w, z: row.z,
      dockY: row.dock_y, sourceId: row.source_id
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Guest mode
      isOnline.value = false
      const saved = loadLocal()
      folders.value = saved.folders
      notes.value = saved.notes
      stickers.value = saved.stickers
      return
    }

    isOnline.value = true

    const [notesRes, foldersRes, stickersRes] = await Promise.all([
      supabase.from('notes').select('*, todos(*)').order('updated_at', { ascending: false }),
      supabase.from('folders').select('*'),
      supabase.from('stickers').select('*'),
    ])

    if (notesRes.error) console.error('加载笔记失败', notesRes.error)
    if (foldersRes.error) console.error('加载文件夹失败', foldersRes.error)
    if (stickersRes.error) console.error('加载便签失败', stickersRes.error)

    notes.value = (notesRes.data || []).map(rowToNote)
    folders.value = (foldersRes.data || []).map(rowToFolder)
    stickers.value = (stickersRes.data || []).map(rowToSticker)
  }

  // ─── Note Actions ─────────────────────────────────────────────────────────

  async function createNote(name, type = 'note', color = 'blue', folderId = null) {
    const newNote = {
      id: genId(), title: name || '新建笔记', type,
      color, folderId,
      content: '',
      tags: [], createdAt: now(), updatedAt: now(),
      hasStickyNote: false,
      todos: type === 'todo' ? [{ id: genId(), text: '第一项待办', done: false, priority: 'medium' }] : [],
    }

    notes.value.unshift(newNote)
    activeNoteId.value = newNote.id

    if (!isOnline.value) { saveLocal(); return newNote }

    const { data, error } = await supabase.from('notes').insert({
      title: newNote.title, type: newNote.type, color: newNote.color,
      folder_id: newNote.folderId || null, content: newNote.content,
      tags: newNote.tags, has_sticky_note: false,
    }).select().single()

    if (error) { console.error('创建笔记失败', error); return newNote }

    // 替换临时 id
    const idx = notes.value.findIndex(n => n.id === newNote.id)
    if (idx !== -1) notes.value[idx].id = data.id
    activeNoteId.value = data.id

    // 若是 todo 类型，插入默认 todo 项
    if (type === 'todo' && newNote.todos.length) {
      const { data: todoData } = await supabase.from('todos').insert({
        note_id: data.id, text: newNote.todos[0].text,
        done: false, priority: 'medium', sort_order: 0
      }).select().single()
      if (todoData) {
        const note = notes.value.find(n => n.id === data.id)
        if (note) note.todos[0].id = todoData.id
      }
    }

    return notes.value.find(n => n.id === data.id)
  }

  async function updateNote(id, updates) {
    const note = notes.value.find(n => n.id === id)
    if (!note) return
    Object.assign(note, updates, { updatedAt: now() })

    if (!isOnline.value) { saveLocal(); return }

    const { error } = await supabase.from('notes').update({
      title: note.title,
      content: note.content,
      color: note.color,
      folder_id: note.folderId || null,
      tags: note.tags,
      has_sticky_note: note.hasStickyNote,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (error) console.error('更新笔记失败', error)
  }

  async function deleteNote(id) {
    notes.value = notes.value.filter(n => n.id !== id)
    if (activeNoteId.value === id) activeNoteId.value = null

    if (!isOnline.value) { saveLocal(); return }

    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) console.error('删除笔记失败', error)
  }

  function openNote(id) {
    activeNoteId.value = id
    editorMode.value = notes.value.find(n => n.id === id)?.type === 'todo' ? 'todo' : 'edit'
  }

  // ─── Todo Actions ─────────────────────────────────────────────────────────

  async function addTodo(noteId, text) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return
    const newTodo = { id: genId(), text, done: false, priority: 'medium' }
    note.todos.push(newTodo)
    note.updatedAt = now()

    if (!isOnline.value) { saveLocal(); return }

    const { data, error } = await supabase.from('todos').insert({
      note_id: noteId, text, done: false, priority: 'medium',
      sort_order: note.todos.length - 1,
    }).select().single()

    if (error) { console.error('添加待办失败', error); return }
    newTodo.id = data.id
  }

  async function toggleTodo(noteId, todoId) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return
    const todo = note.todos.find(t => t.id === todoId)
    if (!todo) return
    todo.done = !todo.done
    note.updatedAt = now()

    if (!isOnline.value) { saveLocal(); return }

    const { error } = await supabase.from('todos').update({ done: todo.done }).eq('id', todoId)
    if (error) console.error('切换待办失败', error)
  }

  async function deleteTodo(noteId, todoId) {
    const note = notes.value.find(n => n.id === noteId)
    if (!note) return
    note.todos = note.todos.filter(t => t.id !== todoId)
    note.updatedAt = now()

    if (!isOnline.value) { saveLocal(); return }

    const { error } = await supabase.from('todos').delete().eq('id', todoId)
    if (error) console.error('删除待办失败', error)
  }

  // ─── Folder Actions ───────────────────────────────────────────────────────

  async function createFolder(name) {
    const newFolder = { id: genId(), name }
    folders.value.push(newFolder)

    if (!isOnline.value) { saveLocal(); return }

    const { data, error } = await supabase.from('folders').insert({ name }).select().single()
    if (error) { console.error('创建文件夹失败', error); return }
    newFolder.id = data.id
  }

  async function deleteFolder(id) {
    folders.value = folders.value.filter(f => f.id !== id)
    notes.value.forEach(n => { if (n.folderId === id) n.folderId = null })

    if (!isOnline.value) { saveLocal(); return }

    const { error } = await supabase.from('folders').delete().eq('id', id)
    if (error) console.error('删除文件夹失败', error)
  }

  // ─── Sticker Actions ──────────────────────────────────────────────────────

  async function createSticker(note = null) {
    const sticker = {
      id: genId(),
      title: note?.title || '新便签',
      content: note?.type === 'todo'
        ? note.todos.map(t => (t.done ? '✅' : '⬜') + ' ' + t.text).join('\n')
        : note?.content?.replace(/#+\s/g, '').slice(0, 200) || '在这里输入内容...',
      color: note?.color || ['yellow', 'pink', 'green', 'blue', 'purple', 'teal'][Math.floor(Math.random() * 6)],
      pinned: false, hidden: false,
      x: 80 + Math.random() * 200, y: 80 + Math.random() * 150, w: 220, z: 10,
      sourceId: note?.id || null,
    }
    stickers.value.push(sticker)
    if (note) note.hasStickyNote = true

    if (!isOnline.value) { saveLocal(); return sticker }

    const { data, error } = await supabase.from('stickers').insert({
      title: sticker.title, content: sticker.content, color: sticker.color,
      pinned: false, hidden: false,
      x: sticker.x, y: sticker.y, w: sticker.w, z: sticker.z,
      source_id: sticker.sourceId || null,
    }).select().single()

    if (error) { console.error('创建便签失败', error); return sticker }
    sticker.id = data.id

    if (note) await updateNote(note.id, { hasStickyNote: true })

    return sticker
  }

  async function updateSticker(id, updates) {
    const sticker = stickers.value.find(s => s.id === id)
    if (!sticker) return
    Object.assign(sticker, updates)

    if (!isOnline.value) { saveLocal(); return }

    const dbUpdates = {}
    if ('title' in updates) dbUpdates.title = updates.title
    if ('content' in updates) dbUpdates.content = updates.content
    if ('theme' in updates) dbUpdates.theme = updates.theme
    if ('pinned' in updates) dbUpdates.pinned = updates.pinned
    if ('hidden' in updates) dbUpdates.hidden = updates.hidden
    if ('x' in updates) dbUpdates.x = updates.x
    if ('y' in updates) dbUpdates.y = updates.y
    if ('w' in updates) dbUpdates.w = updates.w
    if ('z' in updates) dbUpdates.z = updates.z
    if ('dockY' in updates) dbUpdates.dock_y = updates.dockY

    if (Object.keys(dbUpdates).length) {
      const { error } = await supabase.from('stickers').update(dbUpdates).eq('id', id)
      if (error) console.error('更新便签失败', error)
    }
  }

  async function removeSticker(id) {
    stickers.value = stickers.value.filter(s => s.id !== id)

    if (!isOnline.value) { saveLocal(); return }

    const { error } = await supabase.from('stickers').delete().eq('id', id)
    if (error) console.error('删除便签失败', error)
  }

  async function hideSticker(id, dockY) {
    await updateSticker(id, { hidden: true, dockY })
  }

  async function restoreSticker(id) {
    const sticker = stickers.value.find(s => s.id === id)
    if (!sticker) return
    const x = window.innerWidth - (sticker.w || 220) - 10
    const y = sticker.dockY || sticker.y
    await updateSticker(id, { hidden: false, x, y })
  }

  function moveSticker(id, x, y) {
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) { sticker.x = x; sticker.y = y }
    // No save during drag for performance
  }

  async function saveStickerPosition(id) {
    const sticker = stickers.value.find(s => s.id === id)
    if (!sticker) return
    await updateSticker(id, { x: sticker.x, y: sticker.y })
  }

  function updateStickerZ(id) {
    const maxZ = Math.max(10, ...stickers.value.map(s => s.z || 10))
    const sticker = stickers.value.find(s => s.id === id)
    if (sticker) sticker.z = maxZ + 1
  }

  function setFilter(type) {
    filterType.value = type
  }

  // ─── AI Summary (local) ───────────────────────────────────────────────────

  function generateSummary(content) {
    const lines = content.split('\n').filter(l => l.trim())
    const keyPoints = []

    lines.forEach(line => {
      if (line.startsWith('#') || line.startsWith('```')) return
      if (line.length > 15 && line.length < 200) {
        keyPoints.push(line.replace(/^[-*•]\s*/, '').trim())
      }
    })

    let summary = ''
    if (keyPoints.length > 0) {
      summary = '**核心要点：**\n'
      keyPoints.slice(0, 5).forEach((point, i) => {
        summary += `${i + 1}. ${point}\n`
      })
    }

    const hasTodo = content.includes('- [ ]') || content.includes('- [x]')
    if (hasTodo) {
      const todos = content.match(/- \[ \]/g)
      if (todos) summary += `\n📋 **待完成事项：** ${todos.length} 项\n`
    }

    return summary || '该笔记内容暂无明确要点可提取。'
  }

  async function appendSummary(noteId) {
    const note = notes.value.find(n => n.id === noteId)
    if (note && note.content.length > 20) {
      const summary = generateSummary(note.content)
      await updateNote(noteId, {
        content: note.content + `\n\n---\n## 🤖 AI 总结\n\n${summary}`
      })
    }
  }

  // Backwards-compat alias (used by some components that still call saveState)
  function saveState() {
    if (!isOnline.value) saveLocal()
  }

  return {
    // State
    notes, folders, stickers, activeNoteId, activeFolder, sidebarTab, editorMode,
    selectedNoteType, selectedColor, sortDesc, filterType, isOnline,
    // Computed
    activeNote, filteredNotes,
    // Methods
    init, saveState, genId, now,
    createNote, updateNote, deleteNote, openNote,
    addTodo, toggleTodo, deleteTodo,
    createFolder, deleteFolder,
    createSticker, updateSticker, removeSticker, moveSticker, saveStickerPosition, updateStickerZ,
    hideSticker, restoreSticker,
    generateSummary, appendSummary, setFilter
  }
})
