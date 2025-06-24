<template>
  <div class="data-processor-demo">
    <Breadcrumb :items="['menu.demo', 'menu.demo.dataProcessor']" />

    <a-card class="general-card" title="第三方接口数据处理工具演示">
      <div class="demo-section">
        <h3>🔧 工具说明</h3>
        <p>
          这个工具专门用于处理第三方IMEI查询接口返回的不规范数据，能够：
        </p>
        <ul>
          <li>清理HTML错误信息和标签</li>
          <li>提取和解析JSON数据</li>
          <li>规范化设备信息字段</li>
          <li>生成标准化的表格列配置</li>
          <li>支持批量处理和CSV导出</li>
        </ul>
      </div>

      <a-divider />

      <!-- 原始数据输入 -->
      <div class="demo-section">
        <h3>📝 原始数据输入</h3>
        <a-textarea v-model="rawData" :rows="8" placeholder="粘贴第三方接口返回的原始数据..."
          style="font-family: 'Courier New', monospace; font-size: 12px;" />
        <div class="demo-actions">
          <a-space>
            <a-button type="primary" @click="processData" :loading="processing">
              <icon-tool />
              处理数据
            </a-button>
            <a-button @click="loadSampleData">
              <icon-code />
              加载示例数据
            </a-button>
            <a-button @click="clearData">
              <icon-delete />
              清空数据
            </a-button>
          </a-space>
        </div>
      </div>

      <a-divider />

      <!-- 处理结果 -->
      <div v-if="processedData" class="demo-section">
        <h3>✅ 处理结果</h3>

        <!-- 设备信息卡片 -->
        <div class="device-info-card">
          <div class="device-header">
            <h4>{{ processedData.modelDescription || '设备型号未知' }}</h4>
            <div class="device-badges">
              <a-tag :color="getStatusColor(processedData.warrantyStatus)">
                {{ processedData.warrantyStatus || '保修状态未知' }}
              </a-tag>
              <a-tag :color="getStatusColor(processedData.icloudStatus)">
                iCloud: {{ processedData.icloudStatus || '未知' }}
              </a-tag>
            </div>
          </div>

          <div class="device-details">
            <div class="detail-row">
              <span class="detail-label">IMEI:</span>
              <span class="detail-value">{{ processedData.imei }}</span>
            </div>
            <div v-if="processedData.imei2" class="detail-row">
              <span class="detail-label">IMEI2:</span>
              <span class="detail-value">{{ processedData.imei2 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">序列号:</span>
              <span class="detail-value">{{ processedData.serialNumber || '未知' }}</span>
            </div>
            <div v-if="processedData.purchaseDate" class="detail-row">
              <span class="detail-label">购买日期:</span>
              <span class="detail-value">{{ processedData.purchaseDate }}</span>
            </div>
            <div v-if="processedData.purchaseCountry" class="detail-row">
              <span class="detail-label">购买国家:</span>
              <span class="detail-value">{{ processedData.purchaseCountry }}</span>
            </div>
          </div>
        </div>

        <!-- JSON数据展示 -->
        <a-collapse>
          <a-collapse-item header="📊 处理后的JSON数据" key="json">
            <pre class="json-display">{{ JSON.stringify(processedData, null, 2) }}</pre>
          </a-collapse-item>
        </a-collapse>
      </div>

      <!-- 表格展示 -->
      <div v-if="processedData" class="demo-section">
        <h3>📋 表格展示</h3>
        <div class="table-actions">
          <a-space>
            <a-button @click="exportSingleRecord">
              <icon-download />
              导出CSV
            </a-button>
            <a-button @click="showTableColumns">
              <icon-settings />
              查看列配置
            </a-button>
          </a-space>
        </div>

        <a-table :columns="tableColumns" :data="[processedData]" :pagination="false" :scroll="{ x: 'max-content' }"
          size="small" style="margin-top: 16px;" />
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="demo-section">
        <h3>❌ 处理错误</h3>
        <a-alert type="error" :message="error" show-icon />
      </div>
    </a-card>

    <!-- 表格列配置模态框 -->
    <a-modal v-model:visible="columnsModalVisible" title="表格列配置" width="800px">
      <a-table :columns="columnConfigColumns" :data="tableColumnsData" :pagination="false" size="small" />
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import {
  processThirdPartyResponse,
  generateTableColumns,
  exportToCSV,
  type DeviceQueryResult
} from '@/utils/data-processor'
import Breadcrumb from '@/components/breadcrumb/index.vue'

// 响应式数据
const rawData = ref('')
const processedData = ref<DeviceQueryResult | null>(null)
const error = ref('')
const processing = ref(false)
const columnsModalVisible = ref(false)

// 示例数据
const sampleData = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"型号描述: IPHONE 16 PRO MAX WHITE 256GB-CHN<br>IMEI: 357507795010217<br>IMEI2: 357507795095523<br>MEID: 35750779501021<br>序列号: JVWQFJXN4K<br>预计 购买日期: 2025-05-15<br>保修状态: <font color=\\"green\\">在保</font><br>iCloud Lock: <font color=\\"red\\">ON</font><br>iCloud Status: <font color=\\"green\\">Clean</font><br>Demo Unit: <font color=\\"green\\">No</font><br>贷款设备 Device: <font color=\\"green\\">No</font><br>更换设备 Device: <font color=\\"green\\">No</font><br>Replacement Device: <font color=\\"green\\">No</font><br>Refurbished Device: <font color=\\"green\\">No</font><br>Purchase Country: China<br>运营商: 10 - Unlock.<br>Sim-Lock Status: <font color=\\"green\\">Unlocked</font><br>","debug":"","exec_time":6.273647,"user_ip":"223.254.128.13"}`

// 表格列配置
const tableColumns = computed(() => {
  return generateTableColumns().map(col => ({
    title: col.title,
    dataIndex: col.dataIndex,
    key: col.key,
    width: col.width,
    align: col.align,
    render: col.render ? ({ record }: { record: any }) => {
      return col.render!(record[col.dataIndex], record)
    } : undefined
  }))
})

// 表格列配置数据
const tableColumnsData = computed(() => {
  return generateTableColumns().map((col, index) => ({
    index: index + 1,
    title: col.title,
    dataIndex: col.dataIndex,
    width: col.width,
    align: col.align,
    hasRender: !!col.render
  }))
})

// 列配置表格的列
const columnConfigColumns = [
  { title: '序号', dataIndex: 'index', width: 60 },
  { title: '列标题', dataIndex: 'title', width: 120 },
  { title: '数据字段', dataIndex: 'dataIndex', width: 150 },
  { title: '宽度', dataIndex: 'width', width: 80 },
  { title: '对齐方式', dataIndex: 'align', width: 80 },
  {
    title: '自定义渲染',
    dataIndex: 'hasRender',
    width: 100,
    render: ({ record }: { record: any }) => record.hasRender ? '✅' : '❌'
  }
]

// 方法
const processData = async () => {
  if (!rawData.value.trim()) {
    Message.warning('请输入原始数据')
    return
  }

  processing.value = true
  error.value = ''
  processedData.value = null

  try {
    const result = processThirdPartyResponse(rawData.value)
    processedData.value = result
    Message.success('数据处理成功')
  } catch (err: any) {
    error.value = err?.message || '处理失败'
    Message.error('数据处理失败')
  } finally {
    processing.value = false
  }
}

const loadSampleData = () => {
  rawData.value = sampleData
  Message.info('示例数据已加载')
}

const clearData = () => {
  rawData.value = ''
  processedData.value = null
  error.value = ''
  Message.info('数据已清空')
}

const exportSingleRecord = () => {
  if (!processedData.value) return

  try {
    exportToCSV([processedData.value], `device_${processedData.value.imei}.csv`)
    Message.success('导出成功')
  } catch (err: any) {
    Message.error(`导出失败: ${err?.message || '未知错误'}`)
  }
}

const showTableColumns = () => {
  columnsModalVisible.value = true
}

const getStatusColor = (status: string): string => {
  if (!status) return 'gray'

  const lowerStatus = status.toLowerCase()
  if (lowerStatus.includes('在保') || lowerStatus.includes('clean') || lowerStatus.includes('unlocked')) {
    return 'green'
  } else if (lowerStatus.includes('过保') || lowerStatus.includes('locked') || lowerStatus.includes('on')) {
    return 'red'
  }
  return 'blue'
}
</script>

<style scoped lang="less">
.data-processor-demo {
  padding: 20px;
}

.demo-section {
  margin-bottom: 24px;

  h3 {
    margin-bottom: 16px;
    color: #1d2129;
    font-weight: 600;
  }

  ul {
    margin: 12px 0;
    padding-left: 24px;

    li {
      margin-bottom: 8px;
      color: #4e5969;
    }
  }
}

.demo-actions {
  margin-top: 12px;
}

.device-info-card {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h4 {
      margin: 0;
      color: #1d2129;
      font-size: 16px;
      font-weight: 600;
    }

    .device-badges {
      display: flex;
      gap: 8px;
    }
  }

  .device-details {
    .detail-row {
      display: flex;
      margin-bottom: 8px;

      .detail-label {
        width: 100px;
        color: #86909c;
        font-weight: 500;
      }

      .detail-value {
        color: #1d2129;
        font-family: 'Courier New', monospace;
      }
    }
  }
}

.json-display {
  background: #f2f3f5;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.table-actions {
  margin-bottom: 16px;
}

:deep(.arco-table) {
  font-size: 12px;

  .arco-table-cell {
    padding: 8px 12px;
  }
}
</style>