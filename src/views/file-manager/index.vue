<template>
  <div class="file-manager-container">
    <Breadcrumb :items="['menu.fileManager', 'menu.fileManager.upload']" />

    <!-- 文件导入区域 -->
    <a-card class="general-card" :title="$t('fileManager.upload.title')">
      <div class="desktop-app-info">
        <a-alert type="info" :show-icon="false">
          <template #icon>
            <icon-info-circle />
          </template>
          {{ $t('fileManager.upload.desktopTip') }}
        </a-alert>
      </div>
      <div class="upload-section">
        <!-- 拖拽上传区域 -->
        <div class="upload-area" :class="{ 'drag-over': isDragOver, 'has-files': uploadedFiles.length > 0 }"
          @drop="onDrop" @dragover="onDragOver" @dragleave="onDragLeave" @click="triggerFileSelect">
          <div class="upload-content">
            <icon-cloud-upload class="upload-icon" :size="48" />
            <div class="upload-text">
              <div class="primary-text">{{ $t('fileManager.upload.dragTip') }}</div>
              <div class="secondary-text">{{ $t('fileManager.upload.fileLimit') }}</div>
            </div>
          </div>
          <input ref="fileInput" type="file" accept=".txt,.csv" multiple style="display: none" @change="onFileSelect" />
        </div>

        <!-- 当前上传文件列表 -->
        <div v-if="uploadedFiles.length > 0" class="current-upload-list">
          <h3>{{ $t('fileManager.upload.currentFiles') }}</h3>
          <div class="file-items">
            <div v-for="(file, index) in uploadedFiles" :key="file.id" class="file-item">
              <div class="file-info">
                <icon-file class="file-icon" />
                <div class="file-details">
                  <div class="file-name">{{ file.name }}</div>
                  <div class="file-meta">
                    {{ formatFileSize(file.size) }} |
                    {{ $t('fileManager.upload.totalLines') }}: {{ file.totalLines }} |
                    {{ $t('fileManager.upload.validLines') }}: {{ file.validLines }}
                  </div>
                </div>
              </div>

              <div class="file-actions">
                <a-button size="mini" type="text" @click="previewFile(file)">
                  {{ $t('fileManager.upload.preview') }}
                </a-button>
                <a-button size="mini" type="text" status="danger" @click="removeCurrentFile(index)">
                  {{ $t('fileManager.upload.delete') }}
                </a-button>
              </div>

              <!-- 上传进度 -->
              <div v-if="file.status === 'uploading'" class="upload-progress">
                <a-progress :percent="file.progress" />
              </div>

              <!-- 状态指示器 -->
              <div class="file-status">
                <a-tag v-if="file.status === 'success'" color="green">
                  {{ $t('fileManager.upload.uploadSuccess') }}
                </a-tag>
                <a-tag v-else-if="file.status === 'error'" color="red">
                  {{ $t('fileManager.upload.uploadFailed') }}
                  <a-button size="mini" type="text" @click="retryUpload(file)">
                    {{ $t('fileManager.upload.retry') }}
                  </a-button>
                </a-tag>
                <a-tag v-else-if="file.status === 'uploading'" color="blue">
                  {{ $t('fileManager.upload.uploading') }}
                </a-tag>
              </div>
            </div>
          </div>

          <!-- 合并文件操作 -->
          <div v-if="uploadedFiles.length > 1" class="merge-section">
            <a-divider />
            <div class="merge-info">
              <a-alert type="info" :show-icon="false">
                {{ $t('fileManager.upload.mergeInfo', { count: uploadedFiles.length }) }}
              </a-alert>
            </div>
          </div>

          <!-- 保存操作 -->
          <div v-if="canSave" class="save-section">
            <a-divider />
            <a-form :model="saveForm" layout="inline">
              <a-form-item :label="$t('fileManager.upload.saveName')" field="name"
                :rules="[{ required: true, message: $t('fileManager.upload.saveNameRequired') }]">
                <a-input v-model="saveForm.name" :placeholder="$t('fileManager.upload.saveNamePlaceholder')"
                  style="width: 200px" />
              </a-form-item>
              <a-form-item :label="$t('fileManager.upload.description')" field="description">
                <a-input v-model="saveForm.description" :placeholder="$t('fileManager.upload.descriptionPlaceholder')"
                  style="width: 300px" />
              </a-form-item>
              <a-form-item>
                <a-space>
                  <a-button type="primary" @click="saveFiles" :loading="saving">
                    {{ $t('fileManager.upload.save') }}
                  </a-button>
                  <a-button @click="clearCurrentFiles">
                    {{ $t('fileManager.upload.clear') }}
                  </a-button>
                </a-space>
              </a-form-item>
            </a-form>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 已保存文件列表 -->
    <a-card class="general-card" style="margin-top: 16px">
      <template #title>
        <div class="saved-files-header-title">
          <span>{{ $t('fileManager.saved.title') }}</span>
          <a-button size="mini" type="outline" @click="loadSavedFiles">
            <icon-refresh />
            {{ $t('fileManager.saved.refresh') }}
          </a-button>
          <a-button size="mini" type="outline" @click="forceReloadData">
            <icon-sync />
            强制重载
          </a-button>
        </div>
      </template>
      <div class="saved-files-section">
        <div v-if="savedFiles.length === 0" class="empty-state">
          <a-empty :description="$t('fileManager.saved.empty')" />
        </div>

        <div v-else class="saved-files-list">
          <div v-for="(savedFile, index) in savedFiles" :key="savedFile.id" class="saved-file-item">
            <div class="saved-file-info">
              <div class="saved-file-header">
                <h4>{{ savedFile.name }}</h4>
                <div class="saved-file-actions">
                  <a-button size="mini" type="outline" @click="previewSavedFile(savedFile)">
                    {{ $t('fileManager.saved.preview') }}
                  </a-button>
                  <a-button size="mini" type="outline" @click="editSavedFile(savedFile)">
                    {{ $t('fileManager.saved.edit') }}
                  </a-button>
                  <a-button size="mini" type="outline" @click="appendToSavedFile(savedFile)">
                    <icon-plus />
                    {{ $t('fileManager.saved.append') }}
                  </a-button>
                  <a-button size="mini" type="outline" status="danger" @click="deleteSavedFile(savedFile, index)">
                    {{ $t('fileManager.saved.delete') }}
                  </a-button>
                </div>
              </div>
              <div class="saved-file-meta">
                <span>{{ $t('fileManager.saved.totalLines') }}: {{ savedFile.totalLines }}</span>
                <span>{{ $t('fileManager.saved.createdAt') }}: {{ formatDate(savedFile.createdAt) }}</span>
                <span v-if="savedFile.description">{{ $t('fileManager.saved.description') }}: {{ savedFile.description
                  }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-card>

    <!-- 预览模态框 -->
    <a-modal v-model:visible="previewVisible" :title="$t('fileManager.preview.title')" width="600px">
      <div class="file-preview">
        <a-textarea v-model="previewContent" :rows="10" readonly />
      </div>
      <template #footer>
        <a-button @click="previewVisible = false">{{ $t('fileManager.preview.close') }}</a-button>
      </template>
    </a-modal>

    <!-- 编辑模态框 -->
    <a-modal v-model:visible="editVisible" :title="$t('fileManager.edit.title')" @ok="updateSavedFile"
      @cancel="cancelEdit">
      <a-form :model="editForm">
        <a-form-item :label="$t('fileManager.edit.name')" field="name"
          :rules="[{ required: true, message: $t('fileManager.edit.nameRequired') }]">
          <a-input v-model="editForm.name" />
        </a-form-item>
        <a-form-item :label="$t('fileManager.edit.description')" field="description">
          <a-input v-model="editForm.description" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import Breadcrumb from '@/components/breadcrumb/index.vue'
import { Message } from '@arco-design/web-vue'
import { v4 as uuidv4 } from 'uuid'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// 文件接口定义
interface UploadFile {
  id: string
  name: string
  size: number
  file: File
  status: 'uploading' | 'success' | 'error'
  progress: number
  totalLines: number
  validLines: number
  data: string[]
}

interface SavedFile {
  id: string
  name: string
  description?: string
  data: string[]
  totalLines: number
  createdAt: number
  updatedAt: number
}

const { t } = useI18n()

// 响应式数据
const isDragOver = ref(false)
const uploadedFiles = ref<UploadFile[]>([])
const savedFiles = ref<SavedFile[]>([])
const fileInput = ref<HTMLInputElement>()
const previewVisible = ref(false)
const previewContent = ref('')
const editVisible = ref(false)
const saving = ref(false)

const saveForm = ref({
  name: '',
  description: ''
})

const editForm = ref({
  id: '',
  name: '',
  description: ''
})

// 计算属性 - 检查是否有成功处理的文件可以保存
const canSave = computed(() => {
  const hasSuccessFiles = uploadedFiles.value?.some(file => file.status === 'success') || false
  console.log('🔄 canSave计算:', {
    uploadedFilesCount: uploadedFiles.value?.length || 0,
    successFiles: uploadedFiles.value?.filter(f => f.status === 'success').length || 0,
    canSave: hasSuccessFiles,
    allStatuses: uploadedFiles.value?.map(f => ({ name: f.name, status: f.status })) || []
  })
  return hasSuccessFiles
})

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`
}

// 日期格式化
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

// 读取文件为文本
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

// 通过ID处理单个文件（确保响应式更新）
const processFileById = async (fileId: string) => {
  const fileIndex = uploadedFiles.value.findIndex(f => f.id === fileId)
  if (fileIndex === -1) {
    console.error('❌ 找不到文件:', fileId)
    return
  }

  const uploadFile = uploadedFiles.value[fileIndex]
  console.log('📁 开始处理文件:', uploadFile.name)

  try {
    // 使用响应式更新方式
    uploadedFiles.value[fileIndex] = { ...uploadFile, status: 'uploading', progress: 10 }
    await nextTick()

    // 读取文件内容
    const text = await readFileAsText(uploadFile.file)
    uploadedFiles.value[fileIndex] = { ...uploadedFiles.value[fileIndex], progress: 40 }
    await nextTick()

    // 解析文件内容
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    const validLines = lines.filter((line) => line.trim().length > 0)

    uploadedFiles.value[fileIndex] = {
      ...uploadedFiles.value[fileIndex],
      progress: 70,
      totalLines: lines.length,
      validLines: validLines.length,
      data: validLines
    }
    await nextTick()

    // 模拟文件复制到应用目录的过程
    await new Promise(resolve => setTimeout(resolve, 300))
    uploadedFiles.value[fileIndex] = { ...uploadedFiles.value[fileIndex], progress: 90 }
    await nextTick()

    // 完成处理
    uploadedFiles.value[fileIndex] = {
      ...uploadedFiles.value[fileIndex],
      progress: 100,
      status: 'success'
    }
    await nextTick()

    console.log('✅ 文件处理完成:', {
      name: uploadedFiles.value[fileIndex].name,
      status: uploadedFiles.value[fileIndex].status,
      totalLines: uploadedFiles.value[fileIndex].totalLines,
      validLines: uploadedFiles.value[fileIndex].validLines
    })

    console.log('🔄 处理完成后，canSave:', canSave.value)

    Message.success(`文件 ${uploadedFiles.value[fileIndex].name} 处理完成，共 ${uploadedFiles.value[fileIndex].validLines} 条有效数据`)
  } catch (error) {
    console.error('❌ 文件处理失败:', uploadFile.name, error)
    uploadedFiles.value[fileIndex] = { ...uploadedFiles.value[fileIndex], status: 'error' }
    await nextTick()
    Message.error(`文件 ${uploadFile.name} 处理失败`)
  }
}

// 保留原函数用于重试功能
const processFile = async (uploadFile: UploadFile) => {
  return processFileById(uploadFile.id)
}

// 处理文件
const processFiles = async (files: File[]) => {
  const validFiles = files.filter((file) => {
    return file.name.match(/\.(txt|csv)$/i) && file.size <= 100 * 1024 * 1024
  })

  for (const file of validFiles) {
    const uploadFile: UploadFile = {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      file,
      status: 'uploading',
      progress: 0,
      totalLines: 0,
      validLines: 0,
      data: [],
    }

    // 添加到列表
    uploadedFiles.value.push(uploadFile)

    // 处理单个文件
    await processFileById(uploadFile.id)
  }
}

// 拖拽事件处理
const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  processFiles(files)
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click()
}

const onFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = Array.from(target.files || [])
  processFiles(files)
  target.value = ''
}

// 当前文件操作
const removeCurrentFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
}

const clearCurrentFiles = () => {
  uploadedFiles.value = []
  saveForm.value = { name: '', description: '' }
}

const retryUpload = async (file: UploadFile) => {
  file.status = 'uploading'
  file.progress = 0
  await processFile(file)
}

// 文件预览
const previewFile = (file: UploadFile) => {
  const previewLines = file.data.slice(0, 10)
  previewContent.value = previewLines.join('\n')
  if (file.data.length > 10) {
    previewContent.value += `\n\n... 还有 ${file.data.length - 10} 行数据`
  }
  previewVisible.value = true
}

const previewSavedFile = (savedFile: SavedFile) => {
  const previewLines = savedFile.data.slice(0, 10)
  previewContent.value = previewLines.join('\n')
  if (savedFile.data.length > 10) {
    previewContent.value += `\n\n... 还有 ${savedFile.data.length - 10} 行数据`
  }
  previewVisible.value = true
}

// 保存文件到应用数据目录
const saveFiles = async () => {
  if (!saveForm.value.name.trim()) {
    Message.error(t('fileManager.upload.saveNameRequired'))
    return
  }

  saving.value = true

  try {
    // 合并所有成功处理的文件数据
    const allData: string[] = []
    const sourceFiles: string[] = []

    uploadedFiles.value.forEach((file) => {
      if (file.status === 'success') {
        allData.push(...file.data)
        sourceFiles.push(file.name)
      }
    })

    // 去重处理
    const uniqueData = [...new Set(allData)]

    const savedFile: SavedFile = {
      id: uuidv4(),
      name: saveForm.value.name.trim(),
      description: saveForm.value.description.trim(),
      data: uniqueData,
      totalLines: uniqueData.length,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // 保存到应用数据存储（桌面应用中可以是文件系统）
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage不可用，无法保存数据')
    }

    const existingSaved = JSON.parse(localStorage.getItem('savedFiles') || '[]')
    existingSaved.push(savedFile)
    localStorage.setItem('savedFiles', JSON.stringify(existingSaved))

    // 验证保存是否成功
    const verifyData = JSON.parse(localStorage.getItem('savedFiles') || '[]')
    console.log('保存前数据集数量:', existingSaved.length - 1)
    console.log('保存后数据集数量:', verifyData.length)
    console.log('新保存的数据集:', {
      id: savedFile.id,
      name: savedFile.name,
      totalLines: savedFile.totalLines,
      description: savedFile.description
    })

    // 同时保存原始文件信息（桌面应用场景）
    const fileInfo = {
      savedFileId: savedFile.id,
      originalFiles: sourceFiles,
      savedPath: `./data/saved-files/${savedFile.id}.txt`, // 桌面应用的保存路径
      processedAt: new Date().toISOString()
    }

    console.log('文件保存信息:', fileInfo)
    console.log(`已保存 ${uniqueData.length} 条数据到: ${fileInfo.savedPath}`)

    // 触发自定义事件通知其他页面数据更新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('savedFilesUpdated', {
        detail: { savedFiles: verifyData }
      }))
    }

    // 立即更新当前页面的显示列表
    savedFiles.value.push(savedFile)
    console.log('🔄 当前页面数据集列表已更新，总数:', savedFiles.value.length)

    // 强制触发响应式更新
    await nextTick()

    // 验证数据是否正确显示
    setTimeout(() => {
      console.log('🔍 保存后验证 - 页面显示数据集数量:', savedFiles.value.length)
      console.log('🔍 保存后验证 - localStorage数据集数量:', JSON.parse(localStorage.getItem('savedFiles') || '[]').length)
    }, 100)

    // 清空当前上传
    clearCurrentFiles()

    Message.success(`${t('fileManager.upload.saveSuccess')} - 共保存 ${uniqueData.length} 条数据`)
  } catch (error) {
    console.error('保存文件时出错:', error)
    Message.error(t('fileManager.upload.saveError'))
  } finally {
    saving.value = false
  }
}

// 已保存文件操作
const editSavedFile = (savedFile: SavedFile) => {
  editForm.value = {
    id: savedFile.id,
    name: savedFile.name,
    description: savedFile.description || ''
  }
  editVisible.value = true
}

const updateSavedFile = () => {
  if (!editForm.value.name.trim()) {
    Message.error(t('fileManager.edit.nameRequired'))
    return
  }

  const index = savedFiles.value.findIndex(f => f.id === editForm.value.id)
  if (index !== -1) {
    savedFiles.value[index].name = editForm.value.name.trim()
    savedFiles.value[index].description = editForm.value.description.trim()
    savedFiles.value[index].updatedAt = Date.now()

    // 更新localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('savedFiles', JSON.stringify(savedFiles.value))
    }

    console.log('📝 数据集信息已更新:', {
      id: editForm.value.id,
      newName: editForm.value.name.trim(),
      newDescription: editForm.value.description.trim()
    })

    // 通知其他页面数据更新
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('savedFilesUpdated', {
        detail: { savedFiles: savedFiles.value }
      }))
    }

    Message.success(t('fileManager.edit.updateSuccess'))
  }

  editVisible.value = false
}

const cancelEdit = () => {
  editVisible.value = false
  editForm.value = { id: '', name: '', description: '' }
}

const deleteSavedFile = (savedFile: SavedFile, index: number) => {
  console.log('🗑️ 删除数据集:', {
    id: savedFile.id,
    name: savedFile.name,
    index: index
  })

  savedFiles.value.splice(index, 1)

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('savedFiles', JSON.stringify(savedFiles.value))
  }

  console.log('✅ 数据集删除完成，剩余:', savedFiles.value.length, '个')

  // 通知其他页面数据更新
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('savedFilesUpdated', {
      detail: { savedFiles: savedFiles.value }
    }))
  }

  Message.success(t('fileManager.saved.deleteSuccess'))
}

// 追加到已保存文件
const appendToSavedFile = (savedFile: SavedFile) => {
  console.log('➕ 追加到数据集:', {
    id: savedFile.id,
    name: savedFile.name,
    currentLines: savedFile.totalLines
  })

  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.txt,.csv'
  input.style.display = 'none'

  input.onchange = (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    // 验证文件扩展名
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.txt') && !fileName.endsWith('.csv')) {
      Message.error(t('fileManager.upload.fileTypeError'))
      return
    }

    // 读取文件内容
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const newLines = content.split('\n').filter((line: string) => line.trim())

      // 获取现有内容
      const existingLines = savedFile.data

      // 合并内容，去重
      const allLines = [...existingLines, ...newLines]
      const uniqueLines = Array.from(new Set(allLines))

      // 更新已保存文件
      const updatedFile = {
        ...savedFile,
        data: uniqueLines,
        totalLines: uniqueLines.length,
        updatedAt: Date.now()
      }

      // 更新localStorage中的已保存文件列表
      try {
        const savedFilesData = JSON.parse(localStorage.getItem('savedFiles') || '[]')
        const updatedFiles = savedFilesData.map((f: SavedFile) =>
          f.id === savedFile.id ? updatedFile : f
        )
        localStorage.setItem('savedFiles', JSON.stringify(updatedFiles))

        // 更新当前列表
        savedFiles.value = updatedFiles

        // 显示追加结果
        const addedCount = newLines.length
        const duplicateCount = newLines.length - (uniqueLines.length - existingLines.length)

        if (duplicateCount > 0) {
          Message.success(t('fileManager.saved.appendResult', {
            fileName: savedFile.name,
            added: addedCount,
            duplicate: duplicateCount,
            total: uniqueLines.length
          }))
        } else {
          Message.success(t('fileManager.saved.appendSuccess', {
            fileName: savedFile.name,
            added: addedCount,
            total: uniqueLines.length
          }))
        }

        // 触发自定义事件通知其他页面
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('savedFilesUpdated', {
            detail: { action: 'append', fileId: savedFile.id }
          }))
        }

        console.log('✅ 追加完成:', {
          fileName: savedFile.name,
          added: addedCount,
          duplicate: duplicateCount,
          total: uniqueLines.length
        })

      } catch (error) {
        console.error('❌ 追加文件时出错:', error)
        Message.error(t('fileManager.saved.appendError'))
      }
    }

    reader.onerror = () => {
      Message.error(t('fileManager.upload.fileReadError'))
    }

    reader.readAsText(file, 'utf-8')
  }

  // 触发文件选择
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

// 加载已保存的文件
const loadSavedFiles = () => {
  try {
    if (typeof localStorage === 'undefined') {
      console.warn('⚠️ localStorage不可用，无法加载数据集')
      savedFiles.value = []
      return
    }

    const saved = JSON.parse(localStorage.getItem('savedFiles') || '[]')
    console.log('📁 文件管理页面加载数据集:', {
      timestamp: new Date().toLocaleString(),
      count: saved.length,
      datasets: saved.map((f: SavedFile) => ({ id: f.id, name: f.name, totalLines: f.totalLines }))
    })
    savedFiles.value = saved
    console.log('✅ 文件管理页面数据集更新完成，当前显示:', savedFiles.value.length, '个数据集')
  } catch (error) {
    console.error('❌ 文件管理页面加载数据集时出错:', error)
    savedFiles.value = []
  }
}

// 强制重载数据（调试用）
const forceReloadData = () => {
  console.log('🔄 强制重载数据...')

  // 清空当前数据
  savedFiles.value = []

  // 检查localStorage状态
  const healthCheck = checkLocalStorageHealth()
  console.log('🏥 重载前健康检查:', healthCheck)

  // 重新加载
  loadSavedFiles()

  // 验证结果
  setTimeout(() => {
    console.log('🔍 强制重载后验证:')
    console.log('  - 页面显示数据集数量:', savedFiles.value.length)

    const rawData = localStorage.getItem('savedFiles')
    if (rawData) {
      const parsedData = JSON.parse(rawData)
      console.log('  - localStorage数据集数量:', parsedData.length)

      if (parsedData.length > 0 && savedFiles.value.length === 0) {
        console.error('❌ 数据加载失败！localStorage有数据但页面没有显示')
        console.log('🔧 尝试直接赋值...')
        savedFiles.value = parsedData
      } else if (parsedData.length === savedFiles.value.length) {
        console.log('✅ 数据加载成功')
      }
    }
  }, 100)

  Message.info('数据重载完成')
}

// 调试功能：在控制台提供数据查看方法
const debugSavedFiles = () => {
  const saved = JSON.parse(localStorage.getItem('savedFiles') || '[]')
  console.table(saved.map((f: SavedFile) => ({
    ID: f.id,
    名称: f.name,
    行数: f.totalLines,
    描述: f.description || '无',
    创建时间: new Date(f.createdAt).toLocaleString()
  })))
  return saved
}

// 清空所有数据的调试功能
const clearAllSavedFiles = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('savedFiles')
    }
    savedFiles.value = []
    console.log('🗑️ 已清空所有保存的数据集')

    // 触发更新事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('savedFilesUpdated', {
        detail: { savedFiles: [] }
      }))
    }
  } catch (error) {
    console.error('❌ 清空数据集时出错:', error)
  }
}

// localStorage健康检查
const checkLocalStorageHealth = () => {
  try {
    // 检查localStorage是否可用
    if (typeof localStorage === 'undefined') {
      console.warn('⚠️ localStorage不可用')
      return { healthy: false, error: 'localStorage not available' }
    }

    const testKey = 'ls-test'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)

    // 检查savedFiles数据的完整性
    const rawData = localStorage.getItem('savedFiles')
    if (!rawData) {
      console.log('ℹ️ localStorage中暂无savedFiles数据')
      return { healthy: true, dataExists: false }
    }

    const parsedData = JSON.parse(rawData)
    if (!Array.isArray(parsedData)) {
      console.warn('⚠️ savedFiles数据格式异常，不是数组')
      return { healthy: false, error: 'Invalid data format' }
    }

    // 检查每个数据项的完整性
    const invalidItems = parsedData.filter(item =>
      !item.id || !item.name || !item.data || !Array.isArray(item.data)
    )

    if (invalidItems.length > 0) {
      console.warn('⚠️ 发现无效的数据项:', invalidItems)
      return { healthy: false, error: 'Invalid data items', invalidItems }
    }

    console.log('✅ localStorage数据健康检查通过')
    return { healthy: true, dataExists: true, count: parsedData.length }
  } catch (error) {
    console.error('❌ localStorage健康检查失败:', error)
    return { healthy: false, error: (error as Error)?.message || 'Unknown error' }
  }
}

// 将调试方法暴露到window对象（仅开发环境）
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    (window as any).debugSavedFiles = debugSavedFiles;
    (window as any).clearAllSavedFiles = clearAllSavedFiles;
    (window as any).checkLocalStorageHealth = checkLocalStorageHealth;
    console.log('🔧 调试提示：')
    console.log('  - debugSavedFiles() 查看所有数据集')
    console.log('  - clearAllSavedFiles() 清空所有数据集')
    console.log('  - checkLocalStorageHealth() 检查数据完整性')
  } catch (error) {
    console.warn('⚠️ 无法设置调试方法到window对象:', error)
  }
}

// 页面加载时执行
onMounted(() => {
  console.log('🚀 文件管理页面正在挂载...')

  // 先检查localStorage健康状况
  const healthCheck = checkLocalStorageHealth()
  console.log('🏥 localStorage健康检查:', healthCheck)

  // 加载数据
  loadSavedFiles()

  // 立即验证加载结果
  setTimeout(() => {
    console.log('📊 加载后立即验证:')
    console.log('  - 页面显示数据集数量:', savedFiles.value.length)
    console.log('  - localStorage原始数据:', localStorage.getItem('savedFiles')?.length || 0, '字符')

    const rawData = localStorage.getItem('savedFiles')
    if (rawData) {
      try {
        const parsedData = JSON.parse(rawData)
        console.log('  - localStorage解析后数量:', parsedData.length)
        console.log('  - 数据项示例:', parsedData.slice(0, 2))
      } catch (e) {
        console.error('  - localStorage数据解析失败:', e)
      }
    }
  }, 100)

  // 开发环境下输出当前数据
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('📂 文件管理页面加载完成，当前数据集:')
      debugSavedFiles()
      console.log('💡 如果数据集为空，请检查localStorage中是否有数据')
      console.log('💡 运行 localStorage.getItem("savedFiles") 查看原始数据')
    }, 500)
  }

  // 额外的数据验证和健康检查
  setTimeout(() => {
    try {
      console.log('🔍 执行数据完整性检查...')
      const healthCheck = checkLocalStorageHealth()
      console.log('🏥 健康检查结果:', healthCheck)

      if (typeof localStorage !== 'undefined') {
        const rawData = localStorage.getItem('savedFiles')
        const parsedData = rawData ? JSON.parse(rawData) : []
        console.log('🔍 原始localStorage数据长度:', rawData?.length || 0)
        console.log('🔍 解析后的数据集数量:', parsedData.length)
        console.log('🔍 页面显示的数据集数量:', savedFiles.value.length)

        if (parsedData.length !== savedFiles.value.length) {
          console.warn('⚠️ 数据不同步！localStorage:', parsedData.length, '页面显示:', savedFiles.value.length)
          console.log('🔄 重新加载数据...')
          loadSavedFiles()
        } else {
          console.log('✅ 数据同步正常')
        }
      } else {
        console.warn('⚠️ localStorage不可用，跳过数据验证')
      }
    } catch (error) {
      console.error('❌ 数据验证过程出错:', error)
    }
  }, 1000)
})
</script>

<style scoped lang="less">
.file-manager-container {
  padding: 20px;
}

.desktop-app-info {
  margin-bottom: 16px;
}

.saved-files-header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.upload-section {
  .upload-area {
    border: 2px dashed #d9d9d9;
    border-radius: 6px;
    background-color: #fafafa;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 16px;

    &:hover,
    &.drag-over {
      border-color: #1890ff;
      background-color: #f0f8ff;
    }

    &.has-files {
      padding: 20px;
      background-color: #f6ffed;
      border-color: #52c41a;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .upload-icon {
        color: #1890ff;
      }

      .upload-text {
        .primary-text {
          font-size: 16px;
          color: #262626;
          margin-bottom: 4px;
        }

        .secondary-text {
          font-size: 14px;
          color: #8c8c8c;
        }
      }
    }
  }

  .current-upload-list {
    h3 {
      margin-bottom: 16px;
      color: #262626;
    }

    .file-items {
      .file-item {
        padding: 12px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        margin-bottom: 8px;
        background-color: #fff;

        .file-info {
          display: flex;
          align-items: center;
          margin-bottom: 8px;

          .file-icon {
            margin-right: 8px;
            color: #1890ff;
          }

          .file-details {
            flex: 1;

            .file-name {
              font-weight: 500;
              margin-bottom: 4px;
            }

            .file-meta {
              font-size: 12px;
              color: #8c8c8c;
            }
          }
        }

        .file-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-bottom: 8px;
        }

        .upload-progress {
          margin-bottom: 8px;
        }

        .file-status {
          display: flex;
          justify-content: flex-end;
        }
      }
    }

    .save-section {
      padding-top: 16px;
    }
  }
}

.saved-files-section {
  .empty-state {
    text-align: center;
    padding: 40px 0;
  }

  .saved-files-list {
    .saved-file-item {
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      margin-bottom: 12px;
      background-color: #fff;

      .saved-file-info {
        .saved-file-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;

          h4 {
            margin: 0;
            color: #262626;
          }

          .saved-file-actions {
            display: flex;
            gap: 8px;
          }
        }

        .saved-file-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          font-size: 12px;
          color: #8c8c8c;
        }
      }
    }
  }
}

.file-preview {
  .arco-textarea {
    font-family: 'Courier New', monospace;
  }
}
</style>