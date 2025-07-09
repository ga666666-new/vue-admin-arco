<template>
  <a-watermark :content="['17604515707@163.com', dayjs().format('YYYY-MM-DD')]"
    :font="{ color: 'rgba(255, 0, 0, 0.3)', fontSize: 16 }">
    <Breadcrumb :items="['menu.list', `menu.list.result`]" />

    <a-card class="general-card" :title="$t(`menu.list.result`)">
      <!-- 数据处理状态信息 -->
      <div v-if="processedData.length > 0" class="data-status-info" style="margin-bottom: 16px;">
        <a-alert type="success" style="margin-bottom: 8px;">
          <template #icon>
            <IconCheckCircle />
          </template>
          <div>
            ✅ {{ t('searchTable.smart.title') }}
            <br>
            📊 {{ t('searchTable.smart.processed', { count: processedData.length, columns: dynamicColumns.length }) }}
            <br>
            💡 {{ t('searchTable.smart.tip') }}
          </div>
        </a-alert>

        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px;">
          <a-tag v-for="col in dynamicColumns.slice(0, 8)" :key="col.dataIndex" color="blue" size="small">
            {{ col.title }}
          </a-tag>
          <a-tag v-if="dynamicColumns.length > 8" color="gray" size="small">
            +{{ dynamicColumns.length - 8 }} {{ t('searchTable.smart.more') }}
          </a-tag>
        </div>
      </div>

      <!-- 批量处理配置 -->
      <div v-if="list.length > 0" class="batch-config" style="margin-bottom: 16px;">
        <a-card size="small" :title="`🚀 ${t('searchTable.batch.title')}`">
          <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
            <div>
              <span style="margin-right: 8px;">{{ t('searchTable.batch.threadCount') }}:</span>
              <a-input-number v-model="batchConfig.threadCount" :min="1" :max="10" :disabled="isBatchProcessing"
                style="width: 80px;" />
            </div>

            <div>
              <span style="margin-right: 8px;">{{ t('searchTable.batch.totalQuery') }}:</span>
              <a-tag color="blue">{{ list.length }}</a-tag>
            </div>

            <a-button type="primary" :loading="isBatchProcessing" :disabled="loading" @click="startBatchProcessing">
              {{ isBatchProcessing ? `🔄 ${t('searchTable.batch.processing')}` : `🚀 ${t('searchTable.batch.start')}` }}
            </a-button>

            <a-button v-if="isBatchProcessing" type="outline" status="warning" @click="pauseBatchProcessing">
              ⏸️ {{ t('searchTable.batch.pause') }}
            </a-button>

            <a-button v-if="!isBatchProcessing && hasUnfinishedTasks && !isBatchPaused" type="outline" @click="continueBatchProcessing">
              🔄 {{ t('searchTable.batch.continue') }}
            </a-button>
            
            <a-button v-if="isBatchPaused" type="outline" @click="resumeBatchProcessing">
              ▶️ {{ t('searchTable.batch.resume') }}
            </a-button>
          </div>

          <!-- 进度条 -->
          <div v-if="isBatchProcessing || batchProgress.total > 0" style="margin-top: 16px;">
            <a-progress
              :percent="batchProgress.total > 0 ? Math.round((batchProgress.completed + batchProgress.failed) / batchProgress.total * 100) : 0"
              :status="isBatchProcessing ? 'normal' : 'success'" show-text />
            <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 12px;">
              <span>📊 {{ t('searchTable.progress.total') }}: {{ batchProgress.total }}</span>
              <span style="color: #52c41a;">✅ {{ t('searchTable.progress.completed') }}: {{ batchProgress.completed
              }}</span>
              <span style="color: #f5222d;">❌ {{ t('searchTable.progress.failed') }}: {{ batchProgress.failed }}</span>
              <span style="color: #1890ff;">⏳ {{ t('searchTable.progress.remaining') }}: {{ batchProgress.total -
                batchProgress.completed - batchProgress.failed }}</span>
            </div>
          </div>
        </a-card>
      </div>

      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px;">
        <a-button type="primary"
          :disabled="loading || isBatchProcessing || (processedData.length === 0 && dataList.length === 0)"
          @click="downloadExcel">
          {{ processedData.length > 0 ? `📊 ${t('searchTable.export.excel')}` : t("searchTable.columns.save") }}
        </a-button>

        <a-button v-if="processedData.length > 0" type="outline" :disabled="loading || isBatchProcessing"
          @click="downloadCSV">
          📄 {{ t('searchTable.export.csv') }}
        </a-button>

        <div v-if="!loading && (processedData.length > 0 || dataList.length > 0)" class="data-summary">
          <a-statistic :value="processedData.length > 0 ? processedData.length : dataList.length"
            :title="t('searchTable.statistics.totalRecords')" :value-style="{ fontSize: '16px', color: '#1890ff' }"
            style="display: inline-block; margin-right: 16px;" />
          <a-statistic v-if="dynamicColumns.length > 0" :value="dynamicColumns.length"
            :title="t('searchTable.statistics.fieldCount')" :value-style="{ fontSize: '16px', color: '#52c41a' }"
            style="display: inline-block;" />
        </div>
      </div>
      <a-table :columns="columns" :loading="loading" :data="processedData.length > 0 ? processedData : dataList"
        :size="size" :scroll="{ x: 'max-content' }" :pagination="false">
        <template #status="{ record }">
          <div style="text-align: center;">
            <a-tag v-if="getBatchStatus(record) === 'pending'" color="gray">
              ⏳ {{ t('searchTable.status.pending') }}
            </a-tag>
            <div v-else-if="getBatchStatus(record) === 'loading'"
              style="display: flex; align-items: center; justify-content: center; gap: 4px;">
              <a-spin size="mini" />
              <span>🔄 {{ t('searchTable.status.loading') }}</span>
            </div>
            <a-tag v-else-if="getBatchStatus(record) === 'completed'" color="green">
              ✅ {{ t('searchTable.status.completed') }}
            </a-tag>
            <a-tag v-else-if="getBatchStatus(record) === 'error'" color="red">
              ❌ {{ t('searchTable.status.error') }}
            </a-tag>
            <a-tag v-else color="gray">
              -
            </a-tag>
          </div>
        </template>
        <template #result="{ rowIndex }">
          <div v-html="dataList[rowIndex]?.result"></div>
        </template>
      </a-table>
    </a-card>
  </a-watermark>
</template>
<script lang="ts" setup>
import { queryService, submitOrder } from "@/api/list";
import type { LoginData } from "@/api/user";
import useLocale from "@/hooks/locale";
import { useUserStore } from "@/store";
import { getToken } from "@/utils/auth";
import { Message, Modal, TableColumnData } from "@arco-design/web-vue";
import { IconCheckCircle } from '@arco-design/web-vue/es/icon';
import dayjs from "dayjs";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import * as XLSX from "xlsx";

// 导入数据处理工具
import {
    exportToCSV,
    // 导入简单的键值对提取器
    extractKeyValuePairs,
    type DeviceQueryResult
} from '@/utils/data-processor';

const { t } = useI18n();



const columns = computed<TableColumnData[]>(() => {
  // 如果有动态列，使用动态列配置
  if (dynamicColumns.value.length > 0) {
    return [
      {
        title: '#',
        dataIndex: "index",
        width: 60,
        align: 'center' as const,
        fixed: 'left' as const,
        render: ({ rowIndex }: { rowIndex: number }) => rowIndex + 1,
      },
      {
        title: t("searchTable.columns.sn"), // 使用SN/IMEI作为标题
        dataIndex: "sn", // 使用sn字段
        width: 200,
        fixed: 'left' as const,
      },
      {
        title: t('searchTable.status.title'),
        dataIndex: "status",
        width: 100,
        align: 'center' as const,
        slotName: 'status'
      },
      ...dynamicColumns.value
    ];
  }

  // 默认列配置（向后兼容）
  return [
    {
      title: '#',
      dataIndex: "index",
      width: 60,
      align: 'center' as const,
      render: ({ rowIndex }: { rowIndex: number }) => rowIndex + 1,
    },
    {
      title: t("searchTable.columns.sn"),
      dataIndex: "sn",
      minWidth: 200,
    },
    {
      title: t('searchTable.status.title'),
      dataIndex: "status",
      width: 100,
      align: 'center' as const,
      slotName: 'status'
    },
    {
      title: t("searchTable.columns.result"),
      dataIndex: "result",
      slotName: "result",
    },
  ];
});

const loading = ref(false);
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const { currentLocale, changeLocale } = useLocale();

type SizeProps = "mini" | "small" | "medium" | "large";

const size = ref<SizeProps>("medium");

const id = computed(() => {
  const sn = route.query.id;
  return sn;
});

const resList = ref<any[]>([]);
const dataList = ref<Array<{ sn: string; result: any }>>([]);
const tableFileds = ref<any[]>([]);
// 新增：存储处理后的键值对数据
const processedData = ref<Array<{ id: string;[key: string]: any }>>([]);
// 新增：动态表格列
const dynamicColumns = ref<TableColumnData[]>([]);
// 批量处理配置
const batchConfig = ref({
  threadCount: 3, // 默认3个线程
  batchSize: 10,  // 每批处理数量
  maxRetries: 3,  // 最大重试次数
  retryDelay: 2000, // 重试延迟（毫秒）
  timeout: 60000, // API超时时间（毫秒）- 60秒
});

// 批量处理状态
const batchStatus = ref<Record<string, 'pending' | 'loading' | 'completed' | 'error' | 'retrying'>>({});
// 正在进行批量处理
const isBatchProcessing = ref(false);
// 批量处理是否已暂停
const isBatchPaused = ref(false);
// 暂停信号
const pauseSignal = ref(false);
// 批量处理进度
const batchProgress = ref({
  total: 0,
  completed: 0,
  failed: 0,
  retrying: 0
});

// 全局并发池引用
let globalPool: ConcurrencyPool | null = null;

// 持久化存储键
const STORAGE_KEYS = {
  BATCH_STATUS: 'batch_status',
  BATCH_PROGRESS: 'batch_progress',
  BATCH_CONFIG: 'batch_config',
  PROCESSED_DATA: 'processed_data',
  DYNAMIC_COLUMNS: 'dynamic_columns'
};

// 保存状态到localStorage
const saveBatchState = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const state = {
        batchStatus: batchStatus.value,
        batchProgress: batchProgress.value,
        batchConfig: batchConfig.value,
        processedData: processedData.value,
        dynamicColumns: dynamicColumns.value,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.BATCH_STATUS, JSON.stringify(state));
    }
  } catch (error) {
    console.error('保存批量处理状态失败:', error);
  }
};

// 从localStorage恢复状态
const restoreBatchState = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const savedState = localStorage.getItem(STORAGE_KEYS.BATCH_STATUS);
      if (savedState) {
        const state = JSON.parse(savedState);
        const now = Date.now();
        const stateAge = now - (state.timestamp || 0);
        
        // 如果状态保存时间超过1小时，则清除
        if (stateAge > 3600000) {
          localStorage.removeItem(STORAGE_KEYS.BATCH_STATUS);
          return false;
        }
        
        batchStatus.value = state.batchStatus || {};
        batchProgress.value = state.batchProgress || { total: 0, completed: 0, failed: 0, retrying: 0 };
        batchConfig.value = { ...batchConfig.value, ...state.batchConfig };
        processedData.value = state.processedData || [];
        dynamicColumns.value = state.dynamicColumns || [];
        
        // 检查是否还有未完成的任务
        const hasUnfinishedTasks = Object.values(batchStatus.value).some(
          status => status === 'pending' || status === 'loading' || status === 'retrying'
        );
        
        if (hasUnfinishedTasks) {
          isBatchProcessing.value = true;
          console.log('🔄 恢复未完成的批量处理任务');
          return true;
        }
      }
    }
  } catch (error) {
    console.error('恢复批量处理状态失败:', error);
  }
  return false;
};

// 清除持久化状态
const clearBatchState = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.BATCH_STATUS);
    }
  } catch (error) {
    console.error('清除批量处理状态失败:', error);
  }
};

const list = computed((): string[] => {
  const sn = route.query.id as string;
  return JSON.parse(localStorage.getItem(sn || '') || "[]");
});

// 带重试机制的API调用
const submitSingleOrderWithRetry = async (line: string, retryCount = 0): Promise<any> => {
  try {
    let lang = "zh";
    switch (currentLocale.value) {
      case "zh-CN":
        break;
      case "en-US":
        lang = "en";
        break;
      default:
        break;
    }

    const serviceId = route.query.serviceId as string;
    if (!serviceId) {
      throw new Error('服务ID不能为空');
    }

    // 创建带超时的Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('请求超时')), batchConfig.value.timeout);
    });

    const apiPromise = submitOrder(line, getToken() || '', serviceId || '', lang);
    
    // 使用Promise.race实现超时控制
    const result = await Promise.race([apiPromise, timeoutPromise]);
    
    // 检查API返回的错误
    if (result && typeof result === 'object') {
      if (result.code !== 200) {
        throw new Error(result.msg || 'API返回错误');
      }
      
      // 检查是否返回拒绝订单
      if (result.data && typeof result.data === 'string') {
        if (result.data.includes('Wrong_Imei') || result.data.includes('拒绝') || result.data.includes('rejected')) {
          throw new Error('订单被拒绝');
        }
      }
    }

    return result;
  } catch (error: any) {
    console.error(`API调用失败 (重试 ${retryCount}/${batchConfig.value.maxRetries}):`, error);
    
    // 如果是网络错误或超时，且未超过最大重试次数，则重试
    if (retryCount < batchConfig.value.maxRetries && 
        (error.message.includes('超时') || error.message.includes('timeout') || error.message.includes('network'))) {
      
      console.log(`🔄 ${line} 将在 ${batchConfig.value.retryDelay}ms 后重试...`);
      
      // 等待重试延迟
      await new Promise(resolve => setTimeout(resolve, batchConfig.value.retryDelay));
      
      // 递归重试
      return submitSingleOrderWithRetry(line, retryCount + 1);
    }
    
    // 超过重试次数或非网络错误，返回null
    return null;
  }
};

// 向后兼容的简单API调用
const submitSingleOrder = async (line: string) => {
  return submitSingleOrderWithRetry(line);
};

const parseDeviceInfo = (input: string) => {
  let lines = [];
  input = input.replace(" ", "");
  if (lines.includes("<br>")) {
    lines = input.split("<br>");
  }

  if (lines.includes("<br/>")) {
    lines = input.split("<br/>");
  }

  const result = {};

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.includes(":")) {
      const [key, value] = trimmedLine.split(":").map((item) => item.trim());
      result[key] = value;
    }
  });
  return result;
};

const fetchData = async () => {
  try {
    const lines = list.value || [];
    const results = await Promise.all(
      lines.map((line) => submitSingleOrder(line))
    );

    // 清空之前的数据
    dataList.value = [];
    processedData.value = [];

    // 存储所有提取的键值对数据
    const allKeyValuePairs: Record<string, string>[] = [];

    results.forEach((res, index) => {
      if (res) {
        // 原始数据（向后兼容）
        dataList.value.push({ sn: lines[index], result: res });

        // 使用简单键值对提取器处理响应
        try {
          const keyValuePairs = extractKeyValuePairs(res);
          console.log(`🔄 处理第${index + 1}条数据:`, keyValuePairs);

          // 添加ID字段
          const processedItem = {
            id: lines[index], // 使用SN作为ID
            ...keyValuePairs
          };

          processedData.value.push(processedItem);
          allKeyValuePairs.push(keyValuePairs);

        } catch (error) {
          console.error(`❌ 处理第${index + 1}条数据失败:`, error);
          // 如果处理失败，添加错误信息
          processedData.value.push({
            id: lines[index],
            [t('searchTable.status.error')]: t('searchTable.processing.failed'),
            '原始数据': res
          });
        }
      }
    });

    // 生成动态表格列
    if (allKeyValuePairs.length > 0) {
      console.log('📊 生成动态表格列...');

      // 收集所有可能的键
      const allKeys = new Set<string>();
      allKeyValuePairs.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
      });

      // 生成表格列配置
      dynamicColumns.value = Array.from(allKeys).map(key => ({
        title: key, // 使用键作为表头
        dataIndex: key,
        key: key,
        width: key === '设备图片' || key.includes('图片') || key.includes('url') ? 200 : 120,
        align: 'left' as const,
        render: ({ record }: { record: any }) => {
          const value = record[key];

          // 处理URL类型的值
          if (value && (value.startsWith('http') || value.startsWith('https'))) {
            return `🔗 链接`;
          }
          // 处理日期类型的值
          if (value && /\d{4}-\d{2}-\d{2}/.test(value)) {
            return `📅 ${value}`;
          }
          // 处理状态类型的值
          if (value) {
            if (value.includes('已激活') || value.includes('有效') || value.includes('是') || value.includes('在保')) {
              return `✅ ${value}`;
            }
            if (value.includes('未激活') || value.includes('无效') || value.includes('否') || value.includes('过保')) {
              return `❌ ${value}`;
            }
            if (value.includes('天')) {
              return `⏰ ${value}`;
            }
          }
          return value || '-';
        }
      }));

      console.log(`✅ 生成了 ${dynamicColumns.value.length} 个动态列:`, dynamicColumns.value.map(col => col.title));
    }

  } catch (error) {
    console.error('❌ 数据获取失败:', error);
    Message.error(t('searchTable.processing.failed'));
  } finally {
    // loading.value = false; // 不再需要，因为fetchData不再使用
    await userStore.login({ key: getToken() } as LoginData);
  }
};

// 批量处理控制器
let batchController: AbortController | null = null;

// 初始化批量处理数据
const initializeBatchData = () => {
  const lines = list.value || [];

  // 清空所有数据
  processedData.value = [];
  dataList.value = [];
  batchStatus.value = {};

  // 初始化状态和数据
  lines.forEach(line => {
    batchStatus.value[line] = 'pending';

    // 添加占位数据到表格
    processedData.value.push({
      id: line,
      sn: line  // 同时设置sn字段用于显示
      // 其他字段将在处理过程中动态添加
    });
  });

  // 重置进度
  batchProgress.value = {
    total: lines.length,
    completed: 0,
    failed: 0,
    retrying: 0
  };
};

// 并发池管理类
class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => Promise<void>> = [];
  private paused = false;

  constructor(private maxConcurrency: number) { }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.next();
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.next();
        }
      });

      this.next();
    });
  }

  private next() {
    if (this.paused || this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      task();
    }
  }
}

// 处理单个查询项目
const processSingleItem = async (line: string, index: number, pool: ConcurrencyPool) => {
  return pool.add(async () => {
    try {
      // 检查是否被取消
      if (batchController?.signal.aborted) {
        throw new Error('批量处理已取消');
      }

      // 检查是否暂停
      if (pauseSignal.value) {
        console.log(`⏸️ 第${index + 1}项等待恢复: ${line}`);
        // 等待恢复信号
        while (pauseSignal.value) {
          await new Promise(resolve => setTimeout(resolve, 100));
          // 再次检查是否被取消
          if (batchController?.signal.aborted) {
            throw new Error('批量处理已取消');
          }
        }
      }

      // 更新状态为loading
      batchStatus.value[line] = 'loading';
      saveBatchState(); // 保存状态
      console.log(`🔄 开始处理第${index + 1}项: ${line}`);

      // 调用API
      const response = await submitSingleOrderWithRetry(line);

      if (response) {
        // 使用键值对提取器处理响应
        const keyValuePairs = extractKeyValuePairs(response);

        // 找到对应的表格项并更新
        const existingIndex = processedData.value.findIndex(item => item.id === line);
        if (existingIndex !== -1) {
          // 更新现有项目
          processedData.value[existingIndex] = {
            id: line,
            sn: line,  // 确保sn字段用于显示
            ...keyValuePairs
          };
        }

        // 更新原始数据（向后兼容）
        dataList.value.push({ sn: line, result: response });

        // 更新状态
        batchStatus.value[line] = 'completed';
        batchProgress.value.completed++;
        saveBatchState(); // 保存状态

        console.log(`✅ 第${index + 1}项处理完成: ${line}`);

        // 实时更新动态列
        updateDynamicColumns(keyValuePairs);

      } else {
        throw new Error('API返回空结果');
      }

    } catch (error: any) {
      console.error(`❌ 第${index + 1}项处理失败: ${line}`, error);

      // 更新失败状态
      batchStatus.value[line] = 'error';
      batchProgress.value.failed++;
      saveBatchState(); // 保存状态

      // 更新表格显示错误信息
      const existingIndex = processedData.value.findIndex(item => item.id === line);
      if (existingIndex !== -1) {
        processedData.value[existingIndex] = {
          id: line,
          sn: line,  // 确保sn字段用于显示
          [t('searchTable.status.error')]: error?.message || t('searchTable.processing.error')
        };
      }
    }
  });
};

// 实时更新动态列
const updateDynamicColumns = (newKeyValuePairs: Record<string, string>) => {
  // 收集所有现有键
  const allKeys = new Set<string>();

  // 从现有数据中收集键
  processedData.value.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'id') { // 排除ID列
        allKeys.add(key);
      }
    });
  });

  // 添加新的键
  Object.keys(newKeyValuePairs).forEach(key => allKeys.add(key));

  // 重新生成列配置（仅在列数量变化时）
  const newColumnCount = allKeys.size;
  const currentColumnCount = dynamicColumns.value.length;

  if (newColumnCount !== currentColumnCount) {
    dynamicColumns.value = Array.from(allKeys).map(key => ({
      title: key,
      dataIndex: key,
      key: key,
      width: key === '设备图片' || key.includes('图片') || key.includes('url') ? 200 : 120,
      align: 'left' as const,
      render: ({ record }: { record: any }) => {
        const value = record[key];

        if (!value || value === '') return '-';

        // 处理URL类型的值
        if (value && (value.startsWith('http') || value.startsWith('https'))) {
          return `🔗 链接`;
        }
        // 处理日期类型的值
        if (value && /\d{4}-\d{2}-\d{2}/.test(value)) {
          return `📅 ${value}`;
        }
        // 处理状态类型的值
        if (value) {
          if (value.includes('已激活') || value.includes('有效') || value.includes('是') || value.includes('在保')) {
            return `✅ ${value}`;
          }
          if (value.includes('未激活') || value.includes('无效') || value.includes('否') || value.includes('过保')) {
            return `❌ ${value}`;
          }
          if (value.includes('天')) {
            return `⏰ ${value}`;
          }
        }
        return value;
      }
    }));

    console.log(`📊 动态列已更新，当前共${newColumnCount}列`);
  }
};

// 开始批量处理
const startBatchProcessing = async () => {
  try {
    const lines = list.value || [];
    if (lines.length === 0) {
      Message.warning(t('searchTable.batch.noData'));
      return;
    }

    console.log(`🚀 开始批量处理 ${lines.length} 条数据，并发数: ${batchConfig.value.threadCount}`);

    // 创建新的取消控制器
    batchController = new AbortController();
    isBatchProcessing.value = true;

    // 初始化数据
    initializeBatchData();
    saveBatchState(); // 保存初始状态

    // 创建并发池并保存全局引用
    globalPool = new ConcurrencyPool(batchConfig.value.threadCount);

    // 开始处理所有项目
    const promises = lines.map((line, index) =>
      processSingleItem(line, index, globalPool!)
    );

    // 等待所有处理完成
    await Promise.allSettled(promises);

    console.log(`🎉 批量处理完成！成功: ${batchProgress.value.completed}, 失败: ${batchProgress.value.failed}`);

    // 显示完成消息
    if (batchProgress.value.failed === 0) {
      Message.success(`🎉 ${t('searchTable.batch.completed', { count: batchProgress.value.completed })}`);
    } else {
      Message.warning(`⚠️ ${t('searchTable.batch.completedWithErrors', { success: batchProgress.value.completed, failed: batchProgress.value.failed })}`);
    }

    // 处理完成后清除持久化状态
    clearBatchState();

  } catch (error: any) {
    console.error('❌ 批量处理失败:', error);
    Message.error(`${t('searchTable.batch.failed')}: ${error?.message || '未知错误'}`);
  } finally {
    isBatchProcessing.value = false;
    batchController = null;
  }
};

// 暂停批量处理
const pauseBatchProcessing = () => {
  console.log('⏸️ 暂停批量处理');
  
  // 暂停并发池
  if (globalPool) {
    globalPool.pause();
  }
  
  // 设置暂停状态
  isBatchPaused.value = true;
  pauseSignal.value = true;
  
  // 保存当前状态
  saveBatchState();
  
  Message.info(t('searchTable.batch.paused'));
};

// 停止批量处理（保留用于导航守卫）
const stopBatchProcessing = () => {
  if (batchController) {
    batchController.abort();
    console.log('⏹️ 批量处理已停止');
    Message.info(t('searchTable.batch.stopped'));
  }

  isBatchProcessing.value = false;
  isBatchPaused.value = false;
  batchController = null;
  
  // 保存当前状态，以便后续恢复
  saveBatchState();
};

// 导航守卫：防止在批量处理时意外离开
onBeforeRouteLeave((to, from, next) => {
  if (isBatchProcessing.value) {
    // 使用 Modal 显示确认对话框
    Modal.warning({
      title: t('searchTable.navigation.confirmLeave'),
      content: t('searchTable.navigation.processingWarning'),
      okText: t('searchTable.navigation.stopAndLeave'),
      cancelText: t('searchTable.navigation.continueProcessing'),
      closable: true, // 显示右上角的 X 关闭按钮
      maskClosable: false, // 禁用点击遮罩关闭，确保用户必须明确选择
      escToClose: false, // 禁用 ESC 键关闭，确保用户必须明确选择
      onOk: () => {
        // 停止批量处理并允许导航
        stopBatchProcessing();
        console.log('🚫 用户选择停止处理并离开页面');
        next();
      },
      onCancel: () => {
        // 取消导航，继续处理
        console.log('✅ 用户选择继续处理');
        next(false);
      },
      onClose: () => {
        // 点击 X 按钮时，等同于取消操作，继续处理
        console.log('❌ 用户点击关闭按钮，继续处理');
        next(false);
      }
    });
  } else {
    // 没有批量处理，允许正常导航
    next();
  }
});

// 浏览器页面卸载保护
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (isBatchProcessing.value) {
    event.preventDefault();
    event.returnValue = t('searchTable.navigation.browserWarning');
    return t('searchTable.navigation.browserWarning');
  }
};

// 页面卸载时移除保护
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// 检查是否有未完成的任务
const hasUnfinishedTasks = computed(() => {
  const unfinishedCount = Object.values(batchStatus.value).filter(
    status => status === 'pending' || status === 'loading' || status === 'retrying'
  ).length;
  console.log(`🔍 检查未完成任务: ${unfinishedCount} 个未完成任务`);
  return unfinishedCount > 0;
});

// 获取记录的批量处理状态
const getBatchStatus = (record: any) => {
  const id = record.id || record.sn;
  return batchStatus.value[id] || 'completed';
};

// 恢复批量处理（从暂停状态）
const resumeBatchProcessing = async () => {
  console.log('▶️ 恢复批量处理');
  
  // 恢复并发池
  if (globalPool) {
    globalPool.resume();
  }
  
  // 重置暂停状态
  isBatchPaused.value = false;
  pauseSignal.value = false;
  
  // 检查是否有正在加载的任务，如果有则重新启动批量处理
  const loadingTasks = Object.values(batchStatus.value).filter(status => status === 'loading');
  if (loadingTasks.length > 0) {
    console.log(`🔄 发现 ${loadingTasks.length} 个正在加载的任务，重新启动批量处理`);
    isBatchProcessing.value = true;
    
    // 重新创建并发池
    globalPool = new ConcurrencyPool(batchConfig.value.threadCount);
    
    // 获取所有未完成的任务
    const lines = list.value || [];
    const unfinishedTasks = lines.filter(line => 
      batchStatus.value[line] === 'pending' || batchStatus.value[line] === 'loading' || batchStatus.value[line] === 'error'
    );
    
    // 重新开始处理未完成的项目
    const promises = unfinishedTasks.map((line, index) =>
      processSingleItem(line, lines.indexOf(line), globalPool!)
    );
    
    // 等待所有处理完成
    await Promise.allSettled(promises);
    
    console.log(`🎉 恢复处理完成！成功: ${batchProgress.value.completed}, 失败: ${batchProgress.value.failed}`);
    
    // 显示完成消息
    if (batchProgress.value.failed === 0) {
      Message.success(`🎉 ${t('searchTable.batch.completed', { count: batchProgress.value.completed })}`);
    } else {
      Message.warning(`⚠️ ${t('searchTable.batch.completedWithErrors', { success: batchProgress.value.completed, failed: batchProgress.value.failed })}`);
    }
    
    // 处理完成后清除持久化状态
    clearBatchState();
    
  } else {
    // 没有正在加载的任务，只恢复暂停状态
    Message.info(t('searchTable.batch.resumed'));
  }
  
  // 确保处理完成后重置状态
  isBatchProcessing.value = false;
  batchController = null;
};

// 继续批量处理
const continueBatchProcessing = async () => {
  try {
    const lines = list.value || [];
    if (lines.length === 0) {
      Message.warning(t('searchTable.batch.noData'));
      return;
    }

    // 获取未完成的任务
    const unfinishedTasks = lines.filter(line => 
      batchStatus.value[line] === 'pending' || batchStatus.value[line] === 'error'
    );

    if (unfinishedTasks.length === 0) {
      Message.info(t('searchTable.batch.noUnfinishedTasks'));
      return;
    }

    console.log(`🔄 继续处理 ${unfinishedTasks.length} 个未完成任务`);

    // 创建新的取消控制器
    batchController = new AbortController();
    isBatchProcessing.value = true;

    // 创建并发池
    const pool = new ConcurrencyPool(batchConfig.value.threadCount);

    // 开始处理未完成的项目
    const promises = unfinishedTasks.map((line, index) =>
      processSingleItem(line, lines.indexOf(line), pool)
    );

    // 等待所有处理完成
    await Promise.allSettled(promises);

    console.log(`🎉 继续处理完成！成功: ${batchProgress.value.completed}, 失败: ${batchProgress.value.failed}`);

    // 显示完成消息
    if (batchProgress.value.failed === 0) {
      Message.success(`🎉 ${t('searchTable.batch.completed', { count: batchProgress.value.completed })}`);
    } else {
      Message.warning(`⚠️ ${t('searchTable.batch.completedWithErrors', { success: batchProgress.value.completed, failed: batchProgress.value.failed })}`);
    }

    // 处理完成后清除持久化状态
    clearBatchState();

  } catch (error: any) {
    console.error('❌ 继续批量处理失败:', error);
    Message.error(`${t('searchTable.batch.failed')}: ${error?.message || '未知错误'}`);
  } finally {
    isBatchProcessing.value = false;
    batchController = null;
  }
};

const formatFiled = (table: string) => {
  if (!table) {
    return [];
  }
  const fileds = table.split("\r\n");

  return fileds
    .map((filed) => {
      if (filed.includes(":")) {
        return {
          title: filed.split(":")[0].trim(),
          dataIndex: filed.split(":")[0].trim(),
        };
      }
      return null;
    })
    .filter((filed) => filed !== null);
};

const initTable = async () => {
  try {
    await userStore.login({ key: getToken() } as LoginData);
    const data = await queryService(userStore.apikey);
    const apiList = data
      .filter(
        (item: { type_id: any }) => item.type_id === route.query.typeId
      )[0]
      .api_list.filter(
        (item: { id: any }) => item.id === route.query.serviceId
      )[0];

    if (apiList) {
      tableFileds.value = formatFiled(apiList.table_field);
    } else {
      tableFileds.value = [];
    }
  } catch (error) {
    // Handle error
  }
};

const downloadCSV = () => {
  // 如果有处理后的数据，使用键值对数据导出
  if (processedData.value.length > 0 && dynamicColumns.value.length > 0) {
    const headers = [t("searchTable.columns.sn"), ...dynamicColumns.value.map(col => col.title)];
    const csvContent = [
      headers.join(","),
      ...processedData.value.map(item => {
        const row = [
          `"${item.sn || item.id}"`, // SN作为第一列
          ...dynamicColumns.value.map(col => {
            const value = item[col.dataIndex] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
        ];
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob(['\uFEFF' + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `device_data_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Message.success(`✅ ${t('searchTable.export.success')}`);
    return;
  }

  // 向后兼容：使用原始数据导出
  const headers = ["SN", "Result"];
  const csvContent = [
    headers.join(","),
    ...dataList.value.map(
      (item) => `"${item.sn}","${item.result.replace(/"/g, '""')}"`
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "device_data.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadExcel = () => {
  // 如果有处理后的数据，使用键值对数据导出
  if (processedData.value.length > 0 && dynamicColumns.value.length > 0) {
    const headers = [t("searchTable.columns.sn"), ...dynamicColumns.value.map(col => col.title)];
    const data = processedData.value.map(item => [
      item.sn || item.id, // SN作为第一列
      ...dynamicColumns.value.map(col => {
        const value = item[col.dataIndex];
        return value || '';
      })
    ]);

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // 设置列宽
    const colWidths = [
      { wch: 20 }, // SN列
      ...dynamicColumns.value.map(col => ({
        wch: col.title === '设备图片' || col.title.includes('图片') ? 30 : 15
      }))
    ];
    ws['!cols'] = colWidths;

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "设备数据");

    // 获取当前日期和时间
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const fileName = `device_data_${dateStr}_${timeStr}.xlsx`;

    // 写入Excel文件并触发下载
    XLSX.writeFile(wb, fileName);

    Message.success(`✅ ${t('searchTable.export.success')}`);
    console.log(`📊 导出了 ${processedData.value.length} 条记录，${headers.length} 个字段`);
    return;
  }

  // 向后兼容：使用原始数据导出
  const headers = ["SN", "Result"];
  const data = dataList.value.map((item) => [
    item.sn,
    item.result
      .replace(/ /g, "") // 替换空格
      .replace(/<br>/g, "\r\n") // 替换 <br> 为换行
      .replace(/<br\/>/g, "\r\n") // 替换 <br/> 为换行
      .replace(/"/g, '""'), // 替换双引号为双引号对
  ]);

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // 获取当前日期和时间
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const fileName = `devicedata${dateStr}${timeStr}.xlsx`;

  // 写入Excel文件并触发下载
  XLSX.writeFile(wb, fileName);
};

// 使用通用处理器处理第三方响应
const processApiResponseGeneric = (responseText: string) => {
  try {
    // 使用设备信息处理器
    const deviceData = deviceProcessor.processResponse(responseText)
    console.log('通用处理器处理后的设备数据:', deviceData)
    return deviceData
  } catch (error: any) {
    console.error('通用处理器处理API响应失败:', error)
    Message.error(`数据处理失败: ${error?.message || '未知错误'}`)
    throw error
  }
}





// 导出数据到CSV
const handleExportCSV = (data: DeviceQueryResult[]) => {
  try {
    const filename = `device_query_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    exportToCSV(data, filename)
    Message.success('导出成功')
  } catch (error: any) {
    console.error('导出失败:', error)
    Message.error(`导出失败: ${error?.message || '未知错误'}`)
  }
}

onMounted(async () => {
  // 添加浏览器关闭保护
  window.addEventListener('beforeunload', handleBeforeUnload);

  await initTable();

  // 立即初始化并显示数据
  if (list.value && list.value.length > 0) {
    console.log(`📊 立即显示 ${list.value.length} 条数据`);
    initializeBatchData();
    
    // 显示数据加载完成的消息
    Message.success(`📋 已加载 ${list.value.length} 条数据，可以开始批量处理`);
  }

  // 尝试恢复批量处理状态
  const hasRestoredState = restoreBatchState();
  
  if (hasRestoredState) {
    console.log('🔄 已恢复批量处理状态，可以继续处理');
    Message.info(t('searchTable.batch.stateRestored'));
  }


});
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

// 数据状态信息样式
.data-status-info {
  :deep(.arco-alert-body) {
    padding: 12px 16px;
  }

  :deep(.arco-alert-content) {
    line-height: 1.6;
  }
}

// 数据摘要样式
.data-summary {
  display: flex;
  align-items: center;
  gap: 16px;

  :deep(.arco-statistic) {
    .arco-statistic-title {
      font-size: 12px;
      color: #86909c;
      margin-bottom: 4px;
    }

    .arco-statistic-content {
      font-weight: 600;
    }
  }
}

// 表格样式优化
:deep(.arco-table) {
  .arco-table-td {
    font-size: 13px;

    // ID列样式
    &:first-child {
      font-weight: 600;
      color: #1890ff;
    }
  }

  // 固定列阴影
  .arco-table-col-fixed-left::after {
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  }
}

// 标签样式
:deep(.arco-tag) {
  font-size: 12px;
  border-radius: 4px;
}

// 按钮组样式
.button-group {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

// 批量处理配置样式
.batch-config {
  :deep(.arco-card-header) {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.arco-card-body) {
    padding: 16px;
  }

  :deep(.arco-progress) {
    .arco-progress-line-text {
      font-size: 12px;
      font-weight: 600;
    }
  }
}

// 状态列样式
:deep(.arco-table-td) {
  .arco-spin {
    color: #1890ff;
  }
}
</style>
