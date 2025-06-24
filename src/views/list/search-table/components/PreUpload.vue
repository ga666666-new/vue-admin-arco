<template>
  <div class="pre-upload-container">
    <!-- 预上传说明 -->
    <div class="upload-description">
      <a-alert type="info" :message="$t('searchTable.preUpload.title')"
        :description="$t('searchTable.preUpload.description')" show-icon />
    </div>

    <!-- 拖拽上传区域 -->
    <div class="upload-area" :class="{ 'drag-over': isDragOver, 'has-files': uploadedFiles.length > 0 }" @drop="onDrop"
      @dragover="onDragOver" @dragleave="onDragLeave" @click="triggerFileSelect">
      <div class="upload-content">
        <icon-cloud-upload class="upload-icon" :size="48" />
        <div class="upload-text">
          <div class="primary-text">{{ $t('searchTable.preUpload.dragTip') }}</div>
          <div class="secondary-text">{{ $t('searchTable.preUpload.fileLimit') }}</div>
        </div>
      </div>
      <input ref="fileInput" type="file" accept=".txt,.csv" multiple style="display: none" @change="onFileSelect" />
    </div>

    <!-- 文件列表 -->
    <div v-if="uploadedFiles.length > 0" class="file-list">
      <div class="file-list-header">
        <a-space>
          <span>{{ $t('searchTable.preUpload.uploadedFiles') }} ({{ uploadedFiles.length }})</span>
          <a-button size="mini" type="outline" @click="clearAllFiles">
            {{ $t('searchTable.preUpload.clearData') }}
          </a-button>
        </a-space>
      </div>

      <div class="file-items">
        <div v-for="(file, index) in uploadedFiles" :key="file.id" class="file-item">
          <div class="file-info">
            <icon-file class="file-icon" />
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                {{ formatFileSize(file.size) }} |
                {{ $t('searchTable.preUpload.totalLines') }}: {{ file.totalLines }} |
                {{ $t('searchTable.preUpload.validLines') }}: {{ file.validLines }}
              </div>
            </div>
          </div>

          <div class="file-actions">
            <a-button size="mini" type="text" @click="previewFile(file)">
              {{ $t('searchTable.preUpload.preview') }}
            </a-button>
            <a-button size="mini" type="text" status="danger" @click="removeFile(index)">
              {{ $t('searchTable.preUpload.delete') }}
            </a-button>
          </div>

          <!-- 上传进度 -->
          <div v-if="file.status === 'uploading'" class="upload-progress">
            <a-progress :percent="file.progress" :status="file.status === 'error' ? 'danger' : undefined" />
            <div class="progress-actions">
              <a-button size="mini" type="text" @click="pauseUpload(file)" v-if="!file.paused">
                {{ $t('searchTable.preUpload.pause') }}
              </a-button>
              <a-button size="mini" type="text" @click="resumeUpload(file)" v-else>
                {{ $t('searchTable.preUpload.resume') }}
              </a-button>
              <a-button size="mini" type="text" status="danger" @click="cancelUpload(file)">
                {{ $t('searchTable.preUpload.cancel') }}
              </a-button>
            </div>
          </div>

          <!-- 状态指示器 -->
          <div class="file-status">
            <a-tag v-if="file.status === 'success'" color="green">
              {{ $t('searchTable.preUpload.uploadSuccess') }}
            </a-tag>
            <a-tag v-else-if="file.status === 'error'" color="red">
              {{ $t('searchTable.preUpload.uploadFailed') }}
              <a-button size="mini" type="text" @click="retryUpload(file)">
                {{ $t('searchTable.preUpload.retry') }}
              </a-button>
            </a-tag>
            <a-tag v-else-if="file.status === 'uploading'" color="blue">
              {{ $t('searchTable.preUpload.uploading') }}
            </a-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 合并操作 -->
    <div v-if="uploadedFiles.length > 1" class="merge-section">
      <a-divider />
      <div class="merge-actions">
        <a-space>
          <a-button type="primary" @click="mergeFiles" :loading="merging">
            {{ $t('searchTable.preUpload.merge') }}
          </a-button>
          <span class="merge-info">总数据量: {{ totalValidLines }} 行</span>
        </a-space>
      </div>
    </div>

    <!-- 最终操作 -->
    <div v-if="mergedData.length > 0 || (uploadedFiles.length === 1 && uploadedFiles[0].status === 'success')"
      class="final-actions">
      <a-divider />
      <a-space>
        <a-button type="primary" @click="usePreUploadData">
          {{ $t('searchTable.preUpload.usePreUpload') }}
        </a-button>
        <a-button @click="previewMergedData">
          {{ $t('searchTable.preUpload.preview') }}
        </a-button>
      </a-space>
    </div>

    <!-- 文件预览模态框 -->
    <a-modal v-model:visible="previewVisible" :title="$t('searchTable.preUpload.filePreview')" width="600px">
      <div class="file-preview">
        <a-textarea v-model="previewContent" :rows="10" readonly />
      </div>
      <template #footer>
        <a-button @click="previewVisible = false">{{ $t('searchTable.preUpload.close') }}</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'
// 图标直接在模板中使用，无需导入

// 文件接口定义
interface UploadFile {
  id: string
  name: string
  size: number
  file: File
  status: 'uploading' | 'success' | 'error' | 'paused'
  progress: number
  totalLines: number
  validLines: number
  data: string[]
  paused: boolean
  chunks?: Blob[]
  currentChunk?: number
}

const { t } = useI18n()
const emit = defineEmits<{
  dataReady: [data: string[]]
}>()

// 响应式数据
const isDragOver = ref(false)
const uploadedFiles = ref<UploadFile[]>([])
const fileInput = ref<HTMLInputElement>()
const previewVisible = ref(false)
const previewContent = ref('')
const merging = ref(false)
const mergedData = ref<string[]>([])

// 计算属性
const totalValidLines = computed(() => {
  return uploadedFiles.value.reduce((total, file) => total + file.validLines, 0)
})

// 文件大小格式化
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / (k ** i)).toFixed(2))} ${sizes[i]}`
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
  // 清空 input 值，允许重复选择同一文件
  target.value = ''
}

// 处理文件
const processFiles = async (files: File[]) => {
  const validFiles = files.filter((file) => {
    // 验证文件类型和大小
    return file.name.match(/\.(txt|csv)$/i) && file.size <= 100 * 1024 * 1024
  })

  const filePromises = validFiles.map(async (file) => {
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
      paused: false,
    }

    uploadedFiles.value.push(uploadFile)
    await processFile(uploadFile)
    return uploadFile
  })

  await Promise.all(filePromises)
}

// 处理单个文件
const processFile = async (uploadFile: UploadFile) => {
  try {
    const text = await readFileAsText(uploadFile.file)
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

    // 过滤空行和无效行
    const validLines = lines.filter((line) => line.trim().length > 0)

    uploadFile.totalLines = lines.length
    uploadFile.validLines = validLines.length
    uploadFile.data = validLines
    uploadFile.status = 'success'
    uploadFile.progress = 100

    // 模拟上传进度
    let progress = 0
    const progressInterval = setInterval(() => {
      if (uploadFile.paused) return

      progress += Math.random() * 10
      if (progress >= 95) {
        clearInterval(progressInterval)
        uploadFile.progress = 100
        uploadFile.status = 'success'
      } else {
        uploadFile.progress = progress
      }
    }, 100)

  } catch (error) {
    uploadFile.status = 'error'
  }
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

// 文件操作
const removeFile = (index: number) => {
  uploadedFiles.value.splice(index, 1)
  // 如果删除后只剩一个文件，清空合并数据
  if (uploadedFiles.value.length <= 1) {
    mergedData.value = []
  }
}

const clearAllFiles = () => {
  uploadedFiles.value = []
  mergedData.value = []
}

const pauseUpload = (file: UploadFile) => {
  file.paused = true
}

const resumeUpload = (file: UploadFile) => {
  file.paused = false
}

const cancelUpload = (file: UploadFile) => {
  const index = uploadedFiles.value.findIndex((f) => f.id === file.id)
  if (index !== -1) {
    uploadedFiles.value.splice(index, 1)
  }
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

// 合并文件
const mergeFiles = async () => {
  merging.value = true

  try {
    const allData: string[] = []
    uploadedFiles.value.forEach((file) => {
      if (file.status === 'success') {
        allData.push(...file.data)
      }
    })

    // 去重处理
    mergedData.value = [...new Set(allData)]

    await nextTick()
    // 合并完成
  } catch (error) {
    // 处理错误
  } finally {
    merging.value = false
  }
}

// 预览合并数据
const previewMergedData = () => {
  const data = mergedData.value.length > 0 ? mergedData.value : uploadedFiles.value[0]?.data || []
  const previewLines = data.slice(0, 10)
  previewContent.value = previewLines.join('\n')
  if (data.length > 10) {
    previewContent.value += `\n\n... 还有 ${data.length - 10} 行数据`
  }
  previewVisible.value = true
}

// 使用预上传数据
const usePreUploadData = () => {
  let finalData: string[] = []

  if (mergedData.value.length > 0) {
    finalData = mergedData.value
  } else if (uploadedFiles.value.length === 1 && uploadedFiles.value[0].status === 'success') {
    finalData = uploadedFiles.value[0].data
  }

  if (finalData.length > 0) {
    emit('dataReady', finalData)
  }
}
</script>

<style scoped lang="less">
.pre-upload-container {
  padding: 16px;
}

.upload-description {
  margin-bottom: 16px;
}

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

.file-list {
  .file-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
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

        .progress-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }
      }

      .file-status {
        display: flex;
        justify-content: flex-end;
      }
    }
  }
}

.merge-section {
  .merge-actions {
    display: flex;
    justify-content: center;
    align-items: center;

    .merge-info {
      color: #8c8c8c;
      font-size: 14px;
    }
  }
}

.final-actions {
  display: flex;
  justify-content: center;
}

.file-preview {
  .arco-textarea {
    font-family: 'Courier New', monospace;
  }
}
</style>