<template>
  <a-watermark :content="['17604515707@163.com', dayjs().format('YYYY-MM-DD')]"
    :font="{ color: 'rgba(255, 0, 0, 0.3)', fontSize: 16 }">
    <Breadcrumb :items="['menu.list', `menu.list.${route.meta.id}`]" />
    <a-card class="general-card" :title="$t(`menu.list.${route.meta.id}`)">
      <a-table row-key="id" :loading="loading" :pagination="pagination" :columns="columns as TableColumnData[]"
        :data="renderData" :bordered="false" :size="size" @page-change="onPageChange">
        <template #state="{ record }">
          <span :class="['circle', record.state === '1' ? 'pass' : '']"></span>
          {{ $t(`searchTable.form.state.${record.state === '1' ? 'active' : 'inactive'}`) }}
        </template>
        <template #operations="{ record }">
          <a-button type="text" size="small" @click="handleClick(record)">
            {{ $t('searchTable.columns.operations.use') }}
          </a-button>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:visible="visible" @ok="handleOk" @cancel="handleCancel" width="900px">
      <template #title>
        {{ $t('searchTable.query.title') }}
      </template>
      <div>
        <a-scrollbar style="height: 200px; overflow: auto">
          <div v-html="noticeHtml"></div>
        </a-scrollbar>
        <a-divider />

        <!-- 添加标签页 -->
        <a-tabs v-model:active-key="activeTab" @change="onTabChange">
          <!-- 已保存文件标签页 -->
          <a-tab-pane key="savedFiles" :title="$t('searchTable.savedFiles.title')">
            <div class="saved-files-selector">
              <div v-if="savedFilesList.length === 0" class="empty-state">
                <a-empty :description="$t('searchTable.savedFiles.empty')">
                  <template #image>
                    <icon-folder />
                  </template>
                  <template #extra>
                    <a-button type="primary" @click="goToFileManager">
                      {{ $t('searchTable.savedFiles.goUpload') }}
                    </a-button>
                  </template>
                </a-empty>
              </div>

              <div v-else class="saved-files-list">
                <div class="saved-files-header">
                  <span>{{ $t('searchTable.savedFiles.selectTip') }}</span>
                  <a-button size="mini" @click="refreshSavedFiles">
                    <icon-refresh />
                    {{ $t('searchTable.savedFiles.refresh') }}
                  </a-button>
                </div>

                <div class="saved-files-grid">
                  <div v-for="savedFile in savedFilesList" :key="savedFile.id" class="saved-file-card"
                    :class="{ 'selected': selectedSavedFile?.id === savedFile.id }" @click="selectSavedFile(savedFile)">
                    <div class="saved-file-info">
                      <h4>{{ savedFile.name }}</h4>
                      <div class="saved-file-meta">
                        <span>{{ $t('searchTable.savedFiles.totalLines') }}: {{ savedFile.totalLines }}</span>
                        <span>{{ formatSavedFileDate(savedFile.createdAt) }}</span>
                      </div>
                      <div v-if="savedFile.description" class="saved-file-desc">
                        {{ savedFile.description }}
                      </div>
                    </div>
                    <div class="saved-file-actions">
                      <a-button size="mini" type="text" @click.stop="previewSavedFile(savedFile)">
                        {{ $t('searchTable.savedFiles.preview') }}
                      </a-button>
                    </div>
                    <div v-if="selectedSavedFile?.id === savedFile.id" class="selected-indicator">
                      <icon-check-circle-fill />
                    </div>
                  </div>
                </div>

                <div v-if="selectedSavedFile" class="selected-file-actions">
                  <a-divider />
                  <a-space>
                    <a-button type="primary" @click="useSavedFile">
                      {{ $t('searchTable.savedFiles.use') }}
                    </a-button>
                    <a-button @click="clearSelection">
                      {{ $t('searchTable.savedFiles.clearSelection') }}
                    </a-button>
                  </a-space>
                </div>
              </div>
            </div>
          </a-tab-pane>

          <!-- 预上传标签页 -->
          <a-tab-pane key="preUpload" :title="$t('searchTable.preUpload.title')">
            <PreUpload @data-ready="onPreUploadDataReady" />
          </a-tab-pane>

          <!-- 传统上传标签页 -->
          <a-tab-pane key="traditional" :title="$t('searchTable.query.upload')">
            <a-form :model="queryForm">
              <a-form-item :label="t('searchTable.query.uploadFile')">
                <a-upload :limit="1" :custom-request="handleCustomRequest" accept=".txt" :show-file-list="true">
                  <a-button type="primary">选择 .txt 文件</a-button>
                </a-upload>
              </a-form-item>
              <a-form-item :label="t('searchTable.query.input')">
                <a-textarea v-model="queryForm.inputText" :rows="4"
                  :placeholder="t('searchTable.query.inputPlaceholder')" />
              </a-form-item>
              <a-form-item :label="t('searchTable.query.thread')">
                <a-select v-model="queryForm.threads" :options="threadOptions"
                  :placeholder="t('searchTable.query.thread')" />
              </a-form-item>
            </a-form>
          </a-tab-pane>
        </a-tabs>
      </div>
    </a-modal>

    <!-- 已保存文件预览模态框 -->
    <a-modal v-model:visible="savedFilePreviewVisible" :title="$t('searchTable.savedFiles.previewTitle')" width="600px">
      <div class="file-preview">
        <a-textarea v-model="savedFilePreviewContent" :rows="10" readonly />
      </div>
      <template #footer>
        <a-button @click="savedFilePreviewVisible = false">{{ $t('searchTable.savedFiles.closePreview') }}</a-button>
      </template>
    </a-modal>
  </a-watermark>
</template>

<script lang="ts" setup>
import { queryService, ServiceRecord } from '@/api/list'
import useLoading from '@/hooks/loading'
import useLocale from '@/hooks/locale'
import { useUserStore } from '@/store'
import { Pagination } from '@/types/global'
import type { TableColumnData } from '@arco-design/web-vue/es/table/interface'
import dayjs from 'dayjs'
import { v4 as uuidv4 } from 'uuid'
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import PreUpload from './components/PreUpload.vue'

const userStore = useUserStore()

const router = useRouter()

const fileList: any[] = []

const route = useRoute()
const { currentLocale, changeLocale } = useLocale()

type SizeProps = 'mini' | 'small' | 'medium' | 'large'

const generateFormModel = () => ({
  name: '',
  state: '',
})

const { loading, setLoading } = useLoading(true)
const { t } = useI18n()
const renderData = ref<ServiceRecord[]>([])
const formModel = ref(generateFormModel())
const size = ref<SizeProps>('medium')

const queryForm = reactive({
  inputMethod: 'text' as 'upload' | 'text',
  inputText: '',
  threads: 1,
})

// 标签页相关
const activeTab = ref('savedFiles')
const preUploadData = ref<string[]>([])
const isUsingPreUpload = ref(false)

// 已保存文件相关
interface SavedFile {
  id: string
  name: string
  description?: string
  data: string[]
  totalLines: number
  createdAt: number
  updatedAt: number
}

const savedFilesList = ref<SavedFile[]>([])
const selectedSavedFile = ref<SavedFile | null>(null)
const savedFilePreviewVisible = ref(false)
const savedFilePreviewContent = ref('')

const resetInput = () => {
  queryForm.inputText = ''
}

const threadOptions = computed(() => {
  const maxThreads = navigator.hardwareConcurrency || 4 // Fallback to 4 if not supported
  return Array.from({ length: maxThreads }, (_, i) => ({
    label: `${i + 1} Thread${i + 1 > 1 ? 's' : ''}`,
    value: i + 1,
  }))
})

const handleCustomRequest = (option: any) => {
  const { onProgress, onError, onSuccess, fileItem, name } = option

  // 验证文件类型
  if (fileItem.file.type !== 'text/plain') {
    onError(new Error('请选择一个 .txt 文件'))
    return
  }

  // 使用 FileReader 读取文件内容
  const reader = new FileReader()

  reader.onload = (e) => {
    const content = e.target?.result as string
    queryForm.inputText = content
    onSuccess({ content })
  }

  reader.onerror = () => {
    onError(new Error('读取文件时出错'))
  }

  reader.readAsText(fileItem.file) // 按文本格式读取文件
}

const basePagination: Pagination = {
  current: 1,
  pageSize: 20,
}
const pagination = reactive({
  ...basePagination,
})

const columns = computed<TableColumnData[]>(() => [
  {
    title: t('searchTable.columns.id'),
    dataIndex: 'id',
  },
  {
    title: t('searchTable.columns.name'),
    dataIndex: 'name',
  },
  {
    title: t('searchTable.columns.consume'),
    dataIndex: 'consume',
    render: ({ record }) => `${record.consume} (${record.consume_usd} USD)`,
  },
  {
    title: t('searchTable.columns.time_taken'),
    dataIndex: 'time_taken',
  },
  {
    title: t('searchTable.columns.state'),
    dataIndex: 'state',
    slotName: 'state',
  },
  {
    title: t('searchTable.columns.operations'),
    dataIndex: 'operations',
    slotName: 'operations',
  },
])

const fetchData = async () => {
  setLoading(true)
  try {
    const id = (route.params.id as string | undefined) || (route.meta.id as string | number)
    if (!id) {
      renderData.value = []
      return
    }

    const data = await queryService(userStore.apikey)
    let apiList = data.filter((item: { type_id: any }) => item.type_id === id)[0].api_list

    // Apply filters
    if (formModel.value.name) {
      apiList = apiList.filter((item: { name: string }) => item.name.toLowerCase().includes(formModel.value.name.toLowerCase()))
    }
    if (formModel.value.state) {
      apiList = apiList.filter((item: { state: string }) => item.state === formModel.value.state)
    }

    switch (currentLocale.value) {
      case 'zh-CN':
        // No changes needed for Chinese locale
        break
      case 'en-US':
        // For English locale, replace 'name' with 'nameEN' in the apiList
        apiList = apiList.map((item: { name: string; name_en: string }) => ({
          ...item,
          name: item.name_en,
        }))
        break
      default:
        // Handle any other cases
        break
    }
    renderData.value = apiList
    // pagination.current = params.current
    pagination.total = apiList.length
  } catch (err) {
    // Handle error silently in production
  } finally {
    setLoading(false)
  }
}

const search = () => {
  fetchData()
}

const onPageChange = (current: number) => {
  fetchData()
}

fetchData()

watch(
  () => currentLocale,
  (newVersion, oldVersion) => {
    fetchData()
  },
  { deep: true }
) // 启用深度监听

const reset = () => {
  formModel.value = generateFormModel()
  search()
}

const visible = ref(false)

const serviceId = ref('')
const noticeHtml = ref('')

const handleClick = (record: any) => {
  visible.value = true
  serviceId.value = record.id

  // 强制刷新数据集列表
  console.log('📱 打开查询模态框，刷新数据集列表')
  loadSavedFiles() // 每次打开模态框时加载已保存文件

  // 确保在下一个tick重新渲染后再次检查
  setTimeout(() => {
    console.log('📋 模态框数据准备完成，当前数据集数量:', savedFilesList.value.length)
  }, 100)

  switch (currentLocale.value) {
    case 'zh-CN':
      noticeHtml.value = record.the
      break
    case 'en-US':
      noticeHtml.value = record.the_en
      break
    default:
      // Handle any other cases
      break
  }
}
const handleOk = () => {
  // 如果是预上传标签页，不执行传统处理逻辑
  if (activeTab.value === 'preUpload') {
    return
  }

  visible.value = false
  const lines = queryForm.inputText.replaceAll('\r', '').split('\n')

  if (lines.length === 0) {
    return
  }

  try {
    // 生成一个UUID
    const id = uuidv4()

    // 存储数据到localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(id, JSON.stringify(lines))
    }

    const typeId = (route.params.id as string | undefined) || (route.meta.id as string | number)

    // 跳转到结果页面
    router.push({
      name: 'Result',
      query: { id, serviceId: serviceId.value, typeId },
    })
  } catch (error) {
    console.error('❌ 处理查询数据时出错:', error)
  }
}
const handleCancel = () => {
  visible.value = false
  queryForm.inputMethod = 'text'
  queryForm.inputText = ''
  queryForm.threads = 1
  activeTab.value = 'savedFiles'
  isUsingPreUpload.value = false
  preUploadData.value = []
  selectedSavedFile.value = null
}

// 标签页切换处理
const onTabChange = (key: string) => {
  activeTab.value = key
  if (key === 'preUpload') {
    isUsingPreUpload.value = false
  }
}

// 预上传数据准备完成处理
const onPreUploadDataReady = (data: string[]) => {
  preUploadData.value = data
  isUsingPreUpload.value = true

  // 自动关闭模态框并开始处理
  visible.value = false

  try {
    // 生成一个UUID
    const id = uuidv4()

    // 存储数据到localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(id, JSON.stringify(data))
    }

    const typeId = (route.params.id as string | undefined) || (route.meta.id as string | number)

    // 跳转到结果页面
    router.push({
      name: 'Result',
      query: { id, serviceId: serviceId.value, typeId },
    })
  } catch (error) {
    console.error('❌ 处理预上传数据时出错:', error)
  }
}

// 已保存文件相关方法
const loadSavedFiles = () => {
  try {
    if (typeof localStorage === 'undefined') {
      console.warn('⚠️ localStorage不可用，无法加载数据集')
      savedFilesList.value = []
      return
    }

    const saved = JSON.parse(localStorage.getItem('savedFiles') || '[]')
    console.log('查询页面加载数据集:', {
      timestamp: new Date().toLocaleString(),
      count: saved.length,
      datasets: saved.map(f => ({ id: f.id, name: f.name, totalLines: f.totalLines }))
    })
    savedFilesList.value = saved
  } catch (error) {
    console.error('加载已保存数据集时出错:', error)
    savedFilesList.value = []
  }
}

const refreshSavedFiles = () => {
  console.log('手动刷新数据集列表')
  loadSavedFiles()
}

const selectSavedFile = (savedFile: SavedFile) => {
  selectedSavedFile.value = savedFile
}

const clearSelection = () => {
  selectedSavedFile.value = null
}

const formatSavedFileDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const previewSavedFile = (savedFile: SavedFile) => {
  const previewLines = savedFile.data.slice(0, 10)
  savedFilePreviewContent.value = previewLines.join('\n')
  if (savedFile.data.length > 10) {
    savedFilePreviewContent.value += `\n\n... 还有 ${savedFile.data.length - 10} 行数据`
  }
  savedFilePreviewVisible.value = true
}

const useSavedFile = () => {
  if (!selectedSavedFile.value) return

  // 自动关闭模态框并开始处理
  visible.value = false

  try {
    // 生成一个UUID
    const id = uuidv4()

    // 存储数据到localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(id, JSON.stringify(selectedSavedFile.value.data))
    }

    const typeId = (route.params.id as string | undefined) || (route.meta.id as string | number)

    // 跳转到结果页面
    router.push({
      name: 'Result',
      query: { id, serviceId: serviceId.value, typeId },
    })
  } catch (error) {
    console.error('❌ 使用已保存数据集时出错:', error)
  }
}

const goToFileManager = () => {
  visible.value = false
  router.push('/file-manager/import')
}

// 监听其他页面的数据更新事件
const handleSavedFilesUpdate = (event: CustomEvent) => {
  console.log('收到数据集更新事件:', event.detail)
  loadSavedFiles()
}

// 监听页面可见性变化
const handleVisibilityChange = () => {
  if (typeof document !== 'undefined' && !document.hidden) {
    console.log('页面重新可见，刷新数据集')
    loadSavedFiles()
  }
}

// 页面挂载时设置事件监听
onMounted(() => {
  try {
    // 监听自定义事件
    if (typeof window !== 'undefined') {
      window.addEventListener('savedFilesUpdated', handleSavedFilesUpdate as EventListener)
    }

    // 监听页面可见性变化
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    // 初始加载
    loadSavedFiles()

    // 开发环境下的调试信息
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 查询页面已挂载，数据集监听已启动')
      setTimeout(() => {
        if (typeof localStorage !== 'undefined') {
          const currentData = JSON.parse(localStorage.getItem('savedFiles') || '[]')
          console.log('📊 查询页面当前可用数据集数量:', currentData.length)
        }
      }, 200)
    }
  } catch (error) {
    console.error('❌ 查询页面挂载时出错:', error)
  }
})

// 页面卸载时移除事件监听
onUnmounted(() => {
  try {
    if (typeof window !== 'undefined') {
      window.removeEventListener('savedFilesUpdated', handleSavedFilesUpdate as EventListener)
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  } catch (error) {
    console.error('❌ 查询页面卸载时出错:', error)
  }
})

// 更新handleClick以加载已保存文件
</script>

<script lang="ts">
export default {
  name: 'SearchTable',
}
</script>

<style scoped lang="less">
.container {
  padding: 0 20px 20px 20px;
}

:deep(.arco-table-th) {
  &:last-child {
    .arco-table-th-item-title {
      margin-left: 16px;
    }
  }
}

.circle {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  background-color: #f5222d;

  &.pass {
    background-color: #52c41a;
  }
}

.saved-files-selector {
  .empty-state {
    text-align: center;
    padding: 40px 0;
  }

  .saved-files-list {
    .saved-files-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .saved-files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 16px;

      .saved-file-card {
        position: relative;
        padding: 16px;
        border: 1px solid #f0f0f0;
        border-radius: 6px;
        background-color: #fff;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #1890ff;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
        }

        &.selected {
          border-color: #1890ff;
          background-color: #f0f8ff;
          box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
        }

        .saved-file-info {
          h4 {
            margin: 0 0 8px 0;
            color: #262626;
            font-size: 14px;
            font-weight: 600;
          }

          .saved-file-meta {
            display: flex;
            flex-direction: column;
            gap: 4px;
            font-size: 12px;
            color: #8c8c8c;
            margin-bottom: 8px;
          }

          .saved-file-desc {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
            word-break: break-word;
          }
        }

        .saved-file-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }

        .selected-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          color: #1890ff;
          font-size: 16px;
        }
      }
    }

    .selected-file-actions {
      text-align: center;
      padding-top: 16px;
    }
  }
}

.file-preview {
  :deep(.arco-textarea) {
    font-family: 'Courier New', monospace;
  }
}
</style>
