<template>
  <a-watermark :content="['17604515707@163.com', dayjs().format('YYYY-MM-DD')]"
    :font="{ color: 'rgba(255, 0, 0, 0.3)', fontSize: 16 }">
    <Breadcrumb :items="['menu.list', `menu.list.result`]" />

    <div class="result-container">
      <!-- 页面标题和概览 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <icon-list />
            {{ $t('menu.list.result') }}
          </h1>
          <div class="header-stats">
            <div class="stat-item">
              <div class="stat-value">{{ list.length }}</div>
              <div class="stat-label">{{ t('searchTable.statistics.totalItems') }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item success">
              <div class="stat-value">{{ batchProgress.completed }}</div>
              <div class="stat-label">{{ t('searchTable.statistics.completed') }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item error">
              <div class="stat-value">{{ batchProgress.failed }}</div>
              <div class="stat-label">{{ t('searchTable.statistics.failed') }}</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item warning">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">{{ t('searchTable.statistics.pending') }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 主控制面板 -->
      <div class="control-panel">
        <div class="control-header">
          <h2>
            <icon-play-circle />
            {{ t('searchTable.control.title') }}
          </h2>
          <div class="control-status">
            <a-tag v-if="!isBatchProcessing && !isBatchPaused" color="gray" size="large">
              <icon-pause-circle />
              {{ t('searchTable.status.ready') }}
            </a-tag>
            <a-tag v-else-if="isBatchProcessing" color="blue" size="large">
              <icon-loading />
              {{ t('searchTable.status.processing') }}
            </a-tag>
            <a-tag v-else-if="isBatchPaused" color="orange" size="large">
              <icon-pause-circle />
              {{ t('searchTable.status.paused') }}
            </a-tag>
          </div>

          <!-- 状态说明 -->
          <div class="status-description">
            <p v-if="!isBatchProcessing && !isBatchPaused" class="status-text">
              {{ t('searchTable.status.readyDesc') }}
            </p>
            <p v-else-if="isBatchProcessing" class="status-text processing">
              {{ t('searchTable.status.processingDesc') }}
            </p>
            <p v-else-if="isBatchPaused" class="status-text paused">
              {{ t('searchTable.status.pausedDesc') }}
            </p>
          </div>
        </div>

        <div class="control-body">
          <div class="control-actions">
            <!-- 主要操作按钮 -->
            <div class="primary-actions">
              <!-- 开始按钮：只在空闲状态显示 -->
              <a-button v-if="buttonStates.showStart" type="primary" size="large"
                :disabled="loading || list.length === 0" @click="startBatchProcessing" class="action-btn start-btn">
                <template #icon>
                  <icon-play-arrow />
                </template>
                {{ t('searchTable.control.start') }}
              </a-button>

              <!-- 暂停按钮：只在处理中显示 -->
              <a-button v-if="buttonStates.showPause" type="primary" status="warning" size="large"
                @click="pauseBatchProcessing" class="action-btn pause-btn">
                <template #icon>
                  <icon-pause />
                </template>
                {{ t('searchTable.control.pause') }}
              </a-button>

              <!-- 继续按钮：只在暂停状态显示 -->
              <a-button v-if="buttonStates.showResume" type="primary" size="large" @click="resumeBatchProcessing"
                class="action-btn resume-btn">
                <template #icon>
                  <icon-play-arrow />
                </template>
                {{ t('searchTable.control.resume') }}
              </a-button>

              <!-- 结束按钮：在处理中或暂停状态显示 -->
              <a-button v-if="buttonStates.showStop" type="outline" status="danger" size="large"
                @click="stopBatchProcessing" class="action-btn stop-btn">
                <template #icon>
                  <icon-stop />
                </template>
                {{ t('searchTable.control.stop') }}
              </a-button>
            </div>

            <!-- 设置和导出 -->
            <div class="secondary-actions">
              <div class="setting-group">
                <label>{{ t('searchTable.batch.threadCount') }}:</label>
                <a-input-number v-model="batchConfig.threadCount" :min="1" :max="10" :disabled="isBatchProcessing"
                  size="large" class="thread-input" />
              </div>

              <a-button type="outline" size="large" :disabled="batchProgress.completed === 0" @click="exportPartialData"
                class="export-btn">
                <template #icon>
                  <icon-download />
                </template>
                {{ t('searchTable.control.exportPartial') }} ({{ batchProgress.completed }})
              </a-button>
            </div>
          </div>

          <!-- 进度显示 -->
          <div v-if="list.length > 0" class="progress-section">
            <div class="progress-header">
              <span class="progress-title">{{ t('searchTable.progress.title') }}</span>
              <span class="progress-percentage">
                {{ Math.round((batchProgress.completed + batchProgress.failed) / list.length * 100) }}%
              </span>
            </div>
            <a-progress :percent="Math.round((batchProgress.completed + batchProgress.failed) / list.length * 100)"
              :status="getProgressStatus()" :stroke-width="12" :show-text="false" class="main-progress" />
            <div class="progress-details">
              <div class="detail-item">
                <div class="detail-dot total"></div>
                <span>{{ t('searchTable.progress.total') }}: {{ list.length }}</span>
              </div>
              <div class="detail-item">
                <div class="detail-dot completed"></div>
                <span>{{ t('searchTable.progress.completed') }}: {{ batchProgress.completed }}</span>
              </div>
              <div class="detail-item">
                <div class="detail-dot failed"></div>
                <span>{{ t('searchTable.progress.failed') }}: {{ batchProgress.failed }}</span>
              </div>
              <div class="detail-item">
                <div class="detail-dot pending"></div>
                <span>{{ t('searchTable.progress.remaining') }}: {{ pendingCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="table-container">
        <div class="table-header">
          <h3>
            <icon-table />
            {{ t('searchTable.table.title') }}
          </h3>
          <div class="table-actions">
            <a-button type="text" @click="refreshTable">
              <template #icon>
                <icon-refresh />
              </template>
              {{ t('searchTable.actions.refresh') }}
            </a-button>
            <a-button type="text" @click="exportAllData" :disabled="batchProgress.completed === 0">
              <template #icon>
                <icon-download />
              </template>
              {{ t('searchTable.export.all') }}
            </a-button>
          </div>
        </div>

        <a-table :columns="enhancedColumns" :loading="loading" :data="tableData" :size="size"
          :scroll="{ x: 'max-content' }" :pagination="{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: true
          }" row-key="id" class="result-table">
          <template #status="{ record }">
            <div class="status-cell">
              <div v-if="getBatchStatus(record) === 'pending'" class="status-badge pending">
                <icon-clock-circle />
                <span>{{ t('searchTable.status.pending') }}</span>
              </div>
              <div v-else-if="getBatchStatus(record) === 'loading'" class="status-badge loading">
                <a-spin size="mini" />
                <span>{{ t('searchTable.status.loading') }}</span>
              </div>
              <div v-else-if="getBatchStatus(record) === 'completed'" class="status-badge completed">
                <icon-check-circle />
                <span>{{ t('searchTable.status.completed') }}</span>
              </div>
              <div v-else-if="getBatchStatus(record) === 'error'" class="status-badge error">
                <icon-close-circle />
                <span>{{ t('searchTable.status.error') }}</span>
              </div>
              <div v-else class="status-badge unknown">
                <icon-question-circle />
                <span>-</span>
              </div>
            </div>
          </template>

          <template #result="{ record }">
            <div class="result-cell">
              <div v-if="record.result" class="result-content" v-html="record.result"></div>
              <div v-else class="result-empty">
                <icon-empty />
                <span>{{ t('searchTable.status.noData') }}</span>
              </div>
            </div>
          </template>

          <template #actions="{ record }">
            <div class="action-cell">
              <a-button v-if="getBatchStatus(record) === 'error'" type="text" size="small" @click="retryItem(record)"
                class="retry-btn">
                <template #icon>
                  <icon-refresh />
                </template>
                {{ t('searchTable.actions.retry') }}
              </a-button>
              <a-button v-if="record.result" type="text" size="small" @click="viewDetails(record)" class="detail-btn">
                <template #icon>
                  <icon-eye />
                </template>
                {{ t('searchTable.actions.view') }}
              </a-button>
            </div>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 错误处理弹窗 -->
    <a-modal v-model:visible="errorModalVisible" :title="t('searchTable.error.title')" :width="600" :closable="false"
      :mask-closable="true" :esc-to-close="true" class="error-modal">
      <div class="error-content">
        <div class="error-header">
          <icon-exclamation-circle-fill class="error-icon" />
          <div class="error-info">
            <h4>{{ t('searchTable.error.item') }}: {{ currentErrorItem }}</h4>
            <p class="error-message">{{ currentErrorMessage }}</p>
          </div>
        </div>
        <div class="error-suggestion">
          <p>{{ t('searchTable.error.suggestion') }}</p>
        </div>
      </div>

      <template #footer>
        <div class="error-actions">
          <a-button @click="skipCurrentError" class="skip-btn">
            {{ t('searchTable.error.skipOnce') }}
          </a-button>
          <a-button type="outline" @click="retryCurrentError" class="retry-btn">
            {{ t('searchTable.error.retry') }}
          </a-button>
          <a-button type="primary" status="warning" @click="skipAllErrors" class="skip-all-btn">
            {{ t('searchTable.error.skipAll') }}
          </a-button>
        </div>
      </template>
    </a-modal>

    <!-- 详情查看弹窗 -->
    <a-modal v-model:visible="detailModalVisible" :title="t('searchTable.detail.title')" :width="800"
      :mask-closable="true" :esc-to-close="true" class="detail-modal">
      <div class="detail-content">
        <div class="detail-item">
          <label>{{ t('searchTable.columns.sn') }}:</label>
          <span>{{ currentDetailItem?.sn }}</span>
        </div>
        <div class="detail-item">
          <label>{{ t('searchTable.status.title') }}:</label>
          <span>{{ getBatchStatus(currentDetailItem) }}</span>
        </div>
        <div class="detail-item full-width">
          <label>{{ t('searchTable.columns.result') }}:</label>
          <div class="result-detail" v-html="currentDetailItem?.result"></div>
        </div>
      </div>
    </a-modal>
  </a-watermark>
</template>
<script lang="ts" setup>
import { queryService, submitOrder } from "@/api/list";
import type { LoginData } from "@/api/user";
import useLocale from "@/hooks/locale";
import { useUserStore } from "@/store";
import { getToken } from "@/utils/auth";
import { Message, Modal, TableColumnData } from "@arco-design/web-vue";
import { IconCheckCircle, IconClockCircle, IconDownload, IconEmpty, IconExclamationCircleFill, IconEye, IconList, IconLoading, IconPause, IconPauseCircle, IconPlayArrow, IconPlayCircle, IconQuestionCircle, IconRefresh, IconStop } from '@arco-design/web-vue/es/icon';
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

// 错误处理相关
const errorModalVisible = ref(false);
const currentErrorItem = ref('');
const currentErrorMessage = ref('');
const skipAllErrorsFlag = ref(false);

// 计算属性：表格数据
const tableData = computed(() => {
  const lines = list.value || [];
  const result = lines.map((line: string) => {
    // 确保 line 不为空
    if (!line) {
      console.warn('发现空的 line，跳过');
      return null;
    }

    // 查找处理后的数据
    const processedItem = processedData.value.find(item => item.id === line);

    // 如果有处理后的数据，使用处理后的数据
    if (processedItem) {
      return {
        ...processedItem, // 包含所有处理后的字段（包括id）
        sn: line, // 确保sn字段正确
        status: batchStatus.value[line] || 'pending'
      };
    }

    // 否则使用原始数据
    return {
      id: line,
      sn: line,
      status: batchStatus.value[line] || 'pending',
      result: dataList.value.find(item => item.sn === line)?.result || null
    };
  }).filter(item => item !== null); // 过滤掉空值

  // 调试信息：检查是否有处理后的数据
  const processedCount = result.filter(item => item && Object.keys(item).length > 4).length;
  if (processedCount > 0) {
    console.log(`📊 表格数据统计: 总计${result.length}条，已处理${processedCount}条`);
  }

  return result;
});

// 增强的表格列配置
const enhancedColumns = computed<TableColumnData[]>(() => {
  const baseColumns = [
    {
      title: '#',
      dataIndex: "index",
      width: 60,
      align: 'center' as const,
      fixed: 'left' as const,
      render: ({ rowIndex }: { rowIndex: number }) => rowIndex + 1,
    },
    {
      title: t("searchTable.columns.sn"),
      dataIndex: "sn",
      width: 200,
      fixed: 'left' as const,
    },
    {
      title: t('searchTable.status.title'),
      dataIndex: "status",
      width: 120,
      align: 'center' as const,
      slotName: 'status'
    }
  ];

  // 如果有动态列，添加动态列
  if (dynamicColumns.value.length > 0) {
    baseColumns.push(...dynamicColumns.value);
  } else {
    // 如果没有动态列，显示原始结果列
    baseColumns.push({
      title: t("searchTable.columns.result"),
      dataIndex: "result",
      width: 300,
      slotName: "result",
    } as TableColumnData);
  }

  // 添加操作列
  baseColumns.push({
    title: t('searchTable.columns.actions'),
    dataIndex: "actions",
    width: 150,
    align: 'center' as const,
    slotName: 'actions',
    fixed: 'right' as const,
  } as TableColumnData);

  return baseColumns;
});

// 新增响应式变量
const detailModalVisible = ref(false);
const currentDetailItem = ref<any>(null);

// 计算属性：待处理数量
const pendingCount = computed(() => {
  return list.value.length - batchProgress.value.completed - batchProgress.value.failed;
});

// 按钮状态计算属性 - 定义四个按钮的显示逻辑
const buttonStates = computed(() => {
  // 空闲状态：只显示开始按钮
  if (!isBatchProcessing.value && !isBatchPaused.value) {
    return {
      showStart: true,      // 开始按钮
      showPause: false,     // 暂停按钮
      showResume: false,    // 继续按钮
      showStop: false       // 结束按钮
    };
  }

  // 处理中状态：显示暂停和结束按钮
  if (isBatchProcessing.value && !isBatchPaused.value) {
    return {
      showStart: false,     // 开始按钮
      showPause: true,      // 暂停按钮
      showResume: false,    // 继续按钮
      showStop: true        // 结束按钮
    };
  }

  // 暂停状态：显示继续和结束按钮
  if (isBatchPaused.value) {
    return {
      showStart: false,     // 开始按钮
      showPause: false,     // 暂停按钮
      showResume: true,     // 继续按钮
      showStop: true        // 结束按钮
    };
  }

  // 默认状态：只显示开始按钮
  return {
    showStart: true,
    showPause: false,
    showResume: false,
    showStop: false
  };
});

// 修复进度条状态
const getProgressStatus = () => {
  if (isBatchProcessing.value) return 'normal';
  if (batchProgress.value.failed > 0) return 'danger';
  if (batchProgress.value.completed === list.value.length) return 'success';
  return 'normal';
};

// 导出部分数据
const exportPartialData = () => {
  // 只导出真正已完成的数据，确保有处理后的数据
  const completedData = tableData.value.filter(item => {
    const status = item.status === 'completed';
    const hasProcessedData = processedData.value.some(processed => processed.id === item.id);
    return status && hasProcessedData;
  });

  console.log('🔍 导出数据检查:', {
    totalData: tableData.value.length,
    completedData: completedData.length,
    completedStatuses: tableData.value.map(item => ({
      sn: item.sn,
      status: item.status,
      hasProcessedData: processedData.value.some(processed => processed.id === item.id)
    })),
    hasProcessedData: processedData.value.length > 0,
    hasDynamicColumns: dynamicColumns.value.length > 0,
    batchProgress: batchProgress.value
  });

  if (completedData.length === 0) {
    Message.warning(t('searchTable.export.noData'));
    return;
  }

  // 调用专门的导出函数，传入筛选后的数据
  downloadExcelWithData(completedData, '已完成数据');
};

// 错误处理方法
const skipCurrentError = () => {
  errorModalVisible.value = false;
  console.log('跳过当前错误，继续处理');

  // 直接恢复处理状态，不调用resumeBatchProcessing
  isBatchPaused.value = false;
  isBatchProcessing.value = true;
  pauseSignal.value = false;

  // 恢复并发池
  if (globalPool) {
    globalPool.resume();
  }
};

const skipAllErrors = () => {
  skipAllErrorsFlag.value = true;
  errorModalVisible.value = false;
  console.log('跳过所有错误');

  // 直接恢复处理状态，不调用resumeBatchProcessing
  isBatchPaused.value = false;
  isBatchProcessing.value = true;
  pauseSignal.value = false;

  // 恢复并发池
  if (globalPool) {
    globalPool.resume();
  }
};

const retryCurrentError = () => {
  errorModalVisible.value = false;
  console.log('🔄 弹窗重试当前错误项目:', currentErrorItem.value);

  // 立即重试当前错误项目
  const errorItem = currentErrorItem.value;
  if (errorItem) {
    retryItemImmediately(errorItem);
  }

  // 恢复处理状态
  isBatchPaused.value = false;
  isBatchProcessing.value = true;
  pauseSignal.value = false;

  // 恢复并发池
  if (globalPool) {
    globalPool.resume();
  }
};

// 立即重试指定项目的统一方法
const retryItemImmediately = async (item: string) => {
  console.log(`🔄 立即重试项目: ${item}`);

  // 记录当前状态用于回滚
  const currentStatus = batchStatus.value[item];
  const wasError = currentStatus === 'error';

  console.log(`📊 重试前状态: ${item} = ${currentStatus}, 失败计数: ${batchProgress.value.failed}`);

  // 从处理后的数据中移除该项（如果存在）
  const processedIndex = processedData.value.findIndex(data => data.id === item);
  if (processedIndex !== -1) {
    processedData.value.splice(processedIndex, 1);
    console.log(`🗑️ 已清理项目 ${item} 的旧数据`);
  }

  // 确保有全局并发池
  if (!globalPool) {
    globalPool = new ConcurrencyPool(batchConfig.value.threadCount);
    console.log('🔧 重新创建并发池');
  } else if (globalPool.getStatus().stopped) {
    // 如果并发池已停止，重新创建
    globalPool = new ConcurrencyPool(batchConfig.value.threadCount);
    console.log('🔧 重新创建已停止的并发池');
  }

  // 获取项目索引
  const lines = list.value || [];
  const index = lines.indexOf(item);

  if (index !== -1) {
    console.log(`🚀 开始立即重试项目 ${item} (索引: ${index})`);

    try {
      // 重置状态为pending，准备重试
      batchStatus.value[item] = 'pending';

      // 如果之前是错误状态，减少失败计数
      if (wasError) {
        batchProgress.value.failed--;
        console.log(`📉 减少失败计数: ${batchProgress.value.failed + 1} -> ${batchProgress.value.failed}`);
      }

      // 立即执行重试，不等待其他任务，跳过暂停检查
      await processSingleItem(item, index, globalPool, true);
      console.log(`✅ 项目 ${item} 重试完成`);

      // 保存状态
      saveBatchState();

    } catch (error: any) {
      console.error(`❌ 项目 ${item} 重试失败:`, error);

      // 如果重试失败，需要恢复状态
      if (wasError && batchStatus.value[item] !== 'error') {
        // 如果重试失败但状态还没有被processSingleItem设置为error，需要手动恢复
        batchProgress.value.failed++;
        batchStatus.value[item] = 'error';
        console.log(`📈 恢复失败计数: ${batchProgress.value.failed - 1} -> ${batchProgress.value.failed}`);
      }

      // 如果是取消错误，不显示错误信息
      if (!error.message.includes('取消') && !error.message.includes('cancelled')) {
        Message.error(`项目 ${item} 重试失败: ${error.message}`);
      }

      // 保存状态
      saveBatchState();
    }
  } else {
    console.error(`❌ 未找到项目 ${item} 的索引`);
  }

  console.log(`📊 重试后状态: ${item} = ${batchStatus.value[item]}, 失败计数: ${batchProgress.value.failed}`);
};

// 显示错误弹窗
const showErrorModal = (item: string, message: string) => {
  if (skipAllErrorsFlag.value) {
    console.log('跳过所有错误模式，自动跳过:', item);
    return;
  }

  currentErrorItem.value = item;
  currentErrorMessage.value = message;
  errorModalVisible.value = true;

  // 暂停批量处理
  pauseBatchProcessing();
};

// 全局并发池引用
let globalPool: ConcurrencyPool | null = null;

// 获取当前查询的唯一标识
const getCurrentQueryKey = () => {
  const typeId = route.query.typeId as string;
  const serviceId = route.query.serviceId as string;
  return `${typeId}_${serviceId}`;
};

// 持久化存储键 - 根据typeId和serviceId区分
const getStorageKeys = () => {
  const queryKey = getCurrentQueryKey();
  return {
    BATCH_STATUS: `batch_status_${queryKey}`,
    BATCH_PROGRESS: `batch_progress_${queryKey}`,
    BATCH_CONFIG: `batch_config_${queryKey}`,
    PROCESSED_DATA: `processed_data_${queryKey}`,
    DYNAMIC_COLUMNS: `dynamic_columns_${queryKey}`
  };
};

// 保存状态到localStorage
const saveBatchState = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const storageKeys = getStorageKeys();
      const state = {
        batchStatus: batchStatus.value,
        batchProgress: batchProgress.value,
        batchConfig: batchConfig.value,
        processedData: processedData.value,
        dynamicColumns: dynamicColumns.value,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKeys.BATCH_STATUS, JSON.stringify(state));
    }
  } catch (error) {
    console.error('保存批量处理状态失败:', error);
  }
};

// 从localStorage恢复状态
const restoreBatchState = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const storageKeys = getStorageKeys();
      const savedState = localStorage.getItem(storageKeys.BATCH_STATUS);
      if (savedState) {
        const state = JSON.parse(savedState);
        const now = Date.now();
        const stateAge = now - (state.timestamp || 0);

        // 如果状态保存时间超过1小时，则清除
        if (stateAge > 3600000) {
          localStorage.removeItem(storageKeys.BATCH_STATUS);
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
      const storageKeys = getStorageKeys();
      localStorage.removeItem(storageKeys.BATCH_STATUS);
    }
  } catch (error) {
    console.error('清除批量处理状态失败:', error);
  }
};

// 检查查询类型是否发生变化
const checkQueryTypeChange = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      const currentQueryKey = getCurrentQueryKey();
      const lastQueryKey = localStorage.getItem('last_query_key');

      // 如果查询类型发生变化，清除旧的状态
      if (lastQueryKey && lastQueryKey !== currentQueryKey) {
        console.log(`🔄 查询类型发生变化: ${lastQueryKey} -> ${currentQueryKey}`);

        // 清除旧的状态
        const oldStorageKeys = {
          BATCH_STATUS: `batch_status_${lastQueryKey}`,
          BATCH_PROGRESS: `batch_progress_${lastQueryKey}`,
          BATCH_CONFIG: `batch_config_${lastQueryKey}`,
          PROCESSED_DATA: `processed_data_${lastQueryKey}`,
          DYNAMIC_COLUMNS: `dynamic_columns_${lastQueryKey}`
        };

        Object.values(oldStorageKeys).forEach(key => {
          localStorage.removeItem(key);
        });

        // 重置当前状态
        batchStatus.value = {};
        batchProgress.value = { total: 0, completed: 0, failed: 0, retrying: 0 };
        processedData.value = [];
        dynamicColumns.value = [];
        isBatchProcessing.value = false;
        isBatchPaused.value = false;

        console.log('✅ 已清除旧查询类型的状态');
      }

      // 保存当前查询类型
      localStorage.setItem('last_query_key', currentQueryKey);
    }
  } catch (error) {
    console.error('检查查询类型变化失败:', error);
  }
};

const list = computed((): string[] => {
  const sn = route.query.id as string;
  const typeId = route.query.typeId as string;
  const serviceId = route.query.serviceId as string;

  // 使用 UUID 作为存储键（与 index.vue 中的存储方式一致）
  const storageKey = sn;

  try {
    const storedData = localStorage.getItem(storageKey || '');
    if (!storedData) {
      return [];
    }

    const parsedData = JSON.parse(storedData);
    // 确保返回的是数组，并且过滤掉空值
    if (Array.isArray(parsedData)) {
      return parsedData.filter(item => item && typeof item === 'string' && item.trim() !== '');
    }

    return [];
  } catch (error) {
    console.error('解析存储数据失败:', error);
    return [];
  }
});

// 带重试机制的API调用 - 支持取消
const submitSingleOrderWithRetry = async (line: string, retryCount = 0, abortSignal?: AbortSignal): Promise<any> => {
  try {
    // 检查是否已被取消
    if (abortSignal?.aborted) {
      throw new Error('请求已被取消');
    }

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

    // 创建带超时和取消的Promise
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => reject(new Error('请求超时')), batchConfig.value.timeout);

      // 监听取消信号
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('请求已被取消'));
        });
      }
    });

    const apiPromise = submitOrder(line, getToken() || '', serviceId || '', lang);

    // 使用Promise.race实现超时和取消控制
    const result = await Promise.race([apiPromise, timeoutPromise]);

    // 再次检查是否已被取消
    if (abortSignal?.aborted) {
      throw new Error('请求已被取消');
    }

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
    // 如果是取消错误，直接抛出
    if (error.message.includes('取消') || error.message.includes('cancelled') || abortSignal?.aborted) {
      throw error;
    }

    console.error(`API调用失败 (重试 ${retryCount}/${batchConfig.value.maxRetries}):`, error);

    // 如果是网络错误或超时，且未超过最大重试次数，则重试
    if (retryCount < batchConfig.value.maxRetries &&
      (error.message.includes('超时') || error.message.includes('timeout') || error.message.includes('network'))) {

      console.log(`🔄 ${line} 将在 ${batchConfig.value.retryDelay}ms 后重试...`);

      // 等待重试延迟，同时监听取消信号
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, batchConfig.value.retryDelay);

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            clearTimeout(timeoutId);
            reject(new Error('请求已被取消'));
          });
        }
      });

      // 递归重试
      return submitSingleOrderWithRetry(line, retryCount + 1, abortSignal);
    }

    // 超过重试次数或非网络错误，返回null
    return null;
  }
};

// 向后兼容的简单API调用
const submitSingleOrder = async (line: string) => {
  return submitSingleOrderWithRetry(line, 0);
};

const parseDeviceInfo = (input: string) => {
  let lines: string[] = [];
  input = input.replace(" ", "");
  if (lines.includes("<br>")) {
    lines = input.split("<br>");
  }

  if (lines.includes("<br/>")) {
    lines = input.split("<br/>");
  }

  const result: Record<string, string> = {};

  lines.forEach((line: string) => {
    const trimmedLine = line.trim();
    if (trimmedLine.includes(":")) {
      const [key, value] = trimmedLine.split(":").map((item: string) => item.trim());
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

      console.log(`✅ 生成了 ${dynamicColumns.value.length} 个动态列:`, dynamicColumns.value.map((col: any) => col.title));
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
  lines.forEach((line: string) => {
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

// 并发池管理类 - 支持立即停止
class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => Promise<void>> = [];
  private paused = false;
  private stopped = false;
  private runningTasks = new Set<AbortController>();

  constructor(private maxConcurrency: number) { }

  pause() {
    this.paused = true;
    console.log(`⏸️ 并发池已暂停，当前运行任务: ${this.running}，队列任务: ${this.queue.length}`);
  }

  resume() {
    this.paused = false;
    this.stopped = false;
    console.log(`▶️ 并发池已恢复，当前运行任务: ${this.running}，队列任务: ${this.queue.length}`);
    this.next();
  }

  stop() {
    this.stopped = true;
    this.paused = true;

    // 取消所有正在运行的任务
    console.log(`⏹️ 正在停止 ${this.runningTasks.size} 个运行中的任务`);
    this.runningTasks.forEach(controller => {
      controller.abort();
    });
    this.runningTasks.clear();

    // 清空队列
    this.queue = [];
    console.log(`⏹️ 并发池已停止，已清空队列`);
  }

  async add<T>(task: (abortSignal: AbortSignal) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.stopped) {
        reject(new Error('并发池已停止'));
        return;
      }

      this.queue.push(async () => {
        if (this.stopped) {
          reject(new Error('并发池已停止'));
          return;
        }

        const controller = new AbortController();
        this.runningTasks.add(controller);

        try {
          this.running++;
          const result = await task(controller.signal);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.runningTasks.delete(controller);
          this.next();
        }
      });

      this.next();
    });
  }

  private next() {
    if (this.stopped || this.paused || this.running >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (task) {
      task();
    }
  }

  getStatus() {
    return {
      running: this.running,
      queued: this.queue.length,
      paused: this.paused,
      stopped: this.stopped
    };
  }
}

// 处理单个查询项目
const processSingleItem = async (line: string, index: number, pool: ConcurrencyPool, isImmediateRetry = false) => {
  return pool.add(async (abortSignal: AbortSignal) => {
    try {
      // 检查是否被取消
      if (abortSignal.aborted || batchController?.signal.aborted) {
        throw new Error('批量处理已取消');
      }

      // 检查是否暂停（立即重试时跳过暂停检查）
      if (!isImmediateRetry && pauseSignal.value) {
        console.log(`⏸️ 第${index + 1}项等待恢复: ${line}`);
        // 等待恢复信号
        while (pauseSignal.value) {
          await new Promise(resolve => setTimeout(resolve, 100));
          // 再次检查是否被取消
          if (abortSignal.aborted || batchController?.signal.aborted) {
            throw new Error('批量处理已取消');
          }
        }
      }

      // 更新状态为loading
      batchStatus.value[line] = 'loading';
      saveBatchState(); // 保存状态
      console.log(`🔄 开始处理第${index + 1}项: ${line}`);

      // 调用API，传入取消信号
      const response = await submitSingleOrderWithRetry(line, 0, abortSignal);

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
          console.log(`📊 更新表格数据: ${line}`, processedData.value[existingIndex]);
        } else {
          console.warn(`⚠️ 未找到对应的表格项: ${line}`);
        }

        // 更新原始数据（向后兼容）
        // 检查是否已存在，避免重复添加
        const existingDataIndex = dataList.value.findIndex(item => item.sn === line);
        if (existingDataIndex !== -1) {
          // 更新现有数据
          dataList.value[existingDataIndex] = { sn: line, result: response };
        } else {
          // 添加新数据
          dataList.value.push({ sn: line, result: response });
        }

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
      // 如果是取消错误，不作为失败处理
      if (error.message.includes('取消') || error.message.includes('cancelled') || abortSignal.aborted) {
        console.log(`🚫 第${index + 1}项已被取消: ${line}`);
        // 将状态重置为pending，以便后续可以重新处理
        batchStatus.value[line] = 'pending';
        saveBatchState();
        return;
      }

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

      // 处理错误：检查是否跳过所有错误
      if (skipAllErrorsFlag.value) {
        console.log('跳过所有错误模式，自动跳过:', line);
        // 即使跳过所有错误，也要检查暂停/终止信号
        if (pauseSignal.value || batchController?.signal.aborted || abortSignal.aborted) {
          console.log('检测到暂停/终止信号，停止处理');
          return;
        }
      } else {
        // 显示错误处理弹窗
        showErrorModal(line, error?.message || t('searchTable.processing.error'));
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
    isBatchPaused.value = false; // 确保开始新处理时重置暂停状态

    // 初始化数据
    initializeBatchData();
    saveBatchState(); // 保存初始状态

    // 创建并发池并保存全局引用
    globalPool = new ConcurrencyPool(batchConfig.value.threadCount);

    // 获取需要处理的项目（包括待重试的项目）
    const itemsToProcess = getItemsToProcess(lines);
    console.log(`📋 需要处理的项目: ${itemsToProcess.length} 个`, itemsToProcess);

    // 开始处理需要处理的项目
    const promises = itemsToProcess.map(({ line, index }) =>
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
    isBatchPaused.value = false; // 确保处理完成后重置暂停状态
    batchController = null;
  }
};

// 暂停批量处理
const pauseBatchProcessing = () => {
  console.log('⏸️ 暂停批量处理');

  // 暂停并发池
  if (globalPool) {
    globalPool.pause();

    // 显示并发池状态
    const status = globalPool.getStatus();
    console.log('📊 并发池状态:', status);

    if (status.running > 0) {
      console.log(`⏳ 等待 ${status.running} 个正在运行的任务完成或被取消`);
    }
  }

  // 设置暂停状态
  isBatchPaused.value = true;
  pauseSignal.value = true;

  // 立即更新正在加载的项目状态为pending
  Object.keys(batchStatus.value).forEach(line => {
    if (batchStatus.value[line] === 'loading') {
      console.log(`⏸️ 暂停正在加载的项目: ${line}`);
      batchStatus.value[line] = 'pending';
    }
  });

  // 保存当前状态
  saveBatchState();

  Message.info(t('searchTable.batch.paused'));
};

// 修复停止处理方法
const stopBatchProcessing = () => {
  console.log('⏹️ 停止批量处理');

  // 停止并发池（这会取消所有正在运行的任务）
  if (globalPool) {
    globalPool.stop();

    // 显示并发池状态
    const status = globalPool.getStatus();
    console.log('📊 停止时并发池状态:', status);
  }

  // 取消批量处理控制器
  if (batchController) {
    batchController.abort();
  }

  // 立即更新所有正在加载的项目状态为pending
  Object.keys(batchStatus.value).forEach(line => {
    if (batchStatus.value[line] === 'loading') {
      console.log(`⏹️ 停止正在加载的项目: ${line}`);
      batchStatus.value[line] = 'pending';
    }
  });

  // 重置所有状态
  isBatchProcessing.value = false;
  isBatchPaused.value = false;
  pauseSignal.value = false;
  skipAllErrorsFlag.value = false; // 重置跳过所有错误标志
  batchController = null;
  globalPool = null;

  // 保存当前状态
  saveBatchState();

  Message.info(t('searchTable.batch.stopped'));
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

// 获取需要处理的项目（包括待重试的项目）
const getItemsToProcess = (lines: string[]) => {
  const itemsToProcess: Array<{ line: string; index: number }> = [];

  lines.forEach((line, index) => {
    const status = batchStatus.value[line];

    // 如果状态为 pending、loading、retrying 或者没有状态记录，则需要处理
    if (!status || status === 'pending' || status === 'loading' || status === 'retrying') {
      itemsToProcess.push({ line, index });
      console.log(`📋 添加待处理项目: ${line} (状态: ${status || 'pending'})`);
    } else {
      console.log(`⏭️ 跳过已处理项目: ${line} (状态: ${status})`);
    }
  });

  return itemsToProcess;
};

// 获取记录的批量处理状态
const getBatchStatus = (record: any) => {
  // 添加空值检查
  if (!record) {
    return 'pending';
  }
  const id = record.id || record.sn;
  const status = batchStatus.value[id];

  // 如果没有状态记录，检查是否有处理后的数据
  if (!status) {
    const hasProcessedData = processedData.value.some(item => item.id === id);
    return hasProcessedData ? 'completed' : 'pending';
  }

  return status;
};

// 修复暂停/继续逻辑
const resumeBatchProcessing = async () => {
  console.log('▶️ 恢复批量处理');

  try {
    // 重置暂停状态
    isBatchPaused.value = false;
    pauseSignal.value = false;
    isBatchProcessing.value = true;

    // 恢复并发池
    if (globalPool) {
      globalPool.resume();
    } else {
      // 如果没有并发池，重新创建
      globalPool = new ConcurrencyPool(batchConfig.value.threadCount);
    }

    // 获取需要处理的项目（包括待重试的项目）
    const lines = list.value || [];
    const itemsToProcess = getItemsToProcess(lines);

    if (itemsToProcess.length > 0) {
      console.log(`🔄 继续处理 ${itemsToProcess.length} 个未完成任务`);

      // 重新开始处理未完成的项目
      const promises = itemsToProcess.map(({ line, index }) =>
        processSingleItem(line, index, globalPool!)
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

      // 处理完成后重置状态
      isBatchProcessing.value = false;
      isBatchPaused.value = false; // 确保暂停状态也被重置
      batchController = null;
    } else {
      Message.info(t('searchTable.batch.resumed'));
      // 如果没有未完成任务，重置状态
      isBatchProcessing.value = false;
      isBatchPaused.value = false; // 确保暂停状态也被重置
      batchController = null;
    }
  } catch (error: any) {
    console.error('❌ 恢复批量处理失败:', error);
    Message.error(`${t('searchTable.batch.failed')}: ${error?.message || '未知错误'}`);
    // 发生错误时重置状态
    isBatchProcessing.value = false;
    isBatchPaused.value = false; // 确保暂停状态也被重置
    batchController = null;
  }
};

// 继续批量处理
const continueBatchProcessing = async () => {
  try {
    const lines = list.value || [];
    if (lines.length === 0) {
      Message.warning(t('searchTable.batch.noData'));
      return;
    }

    // 获取需要处理的项目（包括待重试的项目）
    const itemsToProcess = getItemsToProcess(lines);

    if (itemsToProcess.length === 0) {
      Message.info(t('searchTable.batch.noUnfinishedTasks'));
      return;
    }

    console.log(`🔄 继续处理 ${itemsToProcess.length} 个未完成任务`);

    // 创建新的取消控制器
    batchController = new AbortController();
    isBatchProcessing.value = true;

    // 创建并发池
    const pool = new ConcurrencyPool(batchConfig.value.threadCount);

    // 开始处理未完成的项目
    const promises = itemsToProcess.map(({ line, index }) =>
      processSingleItem(line, index, pool)
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
    const headers = [t("searchTable.columns.sn"), ...dynamicColumns.value.map((col: any) => col.title)];
    const csvContent = [
      headers.join(","),
      ...processedData.value.map(item => {
        const row = [
          `"${item.sn || item.id}"`, // SN作为第一列
          ...dynamicColumns.value.map((col: any) => {
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

// 通用的Excel导出函数，支持指定数据
const downloadExcelWithData = (dataToExport: any[], sheetName: string = '设备数据') => {
  console.log('🔍 downloadExcelWithData 开始执行:', {
    dataToExportLength: dataToExport.length,
    dynamicColumnsLength: dynamicColumns.value.length,
    sheetName
  });

  // 如果有处理后的数据，使用键值对数据导出
  if (dataToExport.length > 0 && dynamicColumns.value.length > 0) {
    console.log('📊 使用处理后的数据导出');

    const headers = [t("searchTable.columns.sn"), ...dynamicColumns.value.map((col: any) => col.title)];
    const data = dataToExport.map(item => [
      item.sn || item.id, // SN作为第一列
      ...dynamicColumns.value.map((col: any) => {
        const value = item[col.dataIndex];
        return value || '';
      })
    ]);

    console.log('📊 导出数据:', { headers, dataLength: data.length });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // 设置列宽
    const colWidths = [
      { wch: 20 }, // SN列
      ...dynamicColumns.value.map((col: any) => ({
        wch: col.title === '设备图片' || col.title.includes('图片') ? 30 : 15
      }))
    ];
    ws['!cols'] = colWidths;

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // 获取当前日期和时间
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const fileName = `device_data_${dateStr}_${timeStr}.xlsx`;

    // 写入Excel文件并触发下载
    XLSX.writeFile(wb, fileName);

    Message.success(`✅ ${t('searchTable.export.success')}`);
    console.log(`📊 导出了 ${dataToExport.length} 条记录，${headers.length} 个字段`);
    return;
  }

  // 如果没有处理后的数据，使用原始数据导出
  console.log('📊 使用原始数据导出');

  const headers = ["SN", "Result"];
  const data = dataList.value
    .filter(item => item.result && dataToExport.some(d => d.sn === item.sn)) // 只导出指定的数据
    .map((item) => [
      item.sn,
      item.result
        .replace(/ /g, "") // 替换空格
        .replace(/<br>/g, "\r\n") // 替换 <br> 为换行
        .replace(/<br\/>/g, "\r\n") // 替换 <br/> 为换行
        .replace(/"/g, '""'), // 替换双引号为双引号对
    ]);

  console.log('📊 原始导出数据:', { headers, dataLength: data.length });

  if (data.length === 0) {
    Message.warning(t('searchTable.export.noData'));
    return;
  }

  // 创建工作表
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // 获取当前日期和时间
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const fileName = `devicedata${dateStr}${timeStr}.xlsx`;

  // 写入Excel文件并触发下载
  XLSX.writeFile(wb, fileName);

  Message.success(`✅ ${t('searchTable.export.success')}`);
  console.log(`📊 导出了 ${data.length} 条记录`);
};

const downloadExcel = () => {
  console.log('🔍 downloadExcel 开始执行:', {
    processedDataLength: processedData.value.length,
    dynamicColumnsLength: dynamicColumns.value.length,
    dataListLength: dataList.value.length
  });

  // 导出所有处理后的数据
  downloadExcelWithData(processedData.value, '设备数据');
};







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

// 新增方法
const refreshTable = () => {
  // 刷新表格数据
  console.log('刷新表格数据');
};

const exportAllData = () => {
  downloadExcel();
};

const retryItem = async (record: any) => {
  // 添加空值检查
  if (!record) {
    console.warn('重试项目失败: record 为空');
    return;
  }

  console.log('🔄 表格重试项目:', record.sn);

  // 使用统一的立即重试方法
  await retryItemImmediately(record.sn || record.id);

  // 显示提示信息
  Message.success(`✅ 已重试项目 ${record.sn}`);
};

const viewDetails = (record: any) => {
  // 添加空值检查
  if (!record) {
    console.warn('查看详情失败: record 为空');
    return;
  }

  currentDetailItem.value = record;
  detailModalVisible.value = true;
};

onMounted(async () => {
  // 添加浏览器关闭保护
  window.addEventListener('beforeunload', handleBeforeUnload);

  // 检查查询类型是否发生变化
  checkQueryTypeChange();

  await initTable();

  // 立即初始化并显示数据
  if (list.value && list.value.length > 0) {
    console.log(`📊 立即显示 ${list.value.length} 条数据`);
    initializeBatchData();

    // 显示数据加载完成的消息
    Message.success(`📋 已加载 ${list.value.length} 条数据，点击开始按钮开始批量处理`);
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
// 结果页面容器
.result-container {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

// 页面标题区域
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .header-stats {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .stat-item {
        text-align: center;
        color: white;

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        &.success .stat-value {
          color: #52c41a;
        }

        &.error .stat-value {
          color: #ff7875;
        }

        &.warning .stat-value {
          color: #faad14;
        }
      }

      .stat-divider {
        width: 1px;
        height: 40px;
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

// 控制面板
.control-panel {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);

  .control-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f2f5;

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .control-status {
      display: flex;
      gap: 8px;
    }

    .status-description {
      margin-top: 8px;

      .status-text {
        margin: 0;
        font-size: 14px;
        color: #666;
        font-style: italic;

        &.processing {
          color: #1890ff;
        }

        &.paused {
          color: #faad14;
        }
      }
    }
  }

  .control-body {
    .control-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 20px;

      .primary-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;

        .action-btn {
          height: 48px;
          padding: 0 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.3s ease;
          min-width: 120px;

          &.start-btn {
            background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
            border: none;
            box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(82, 196, 26, 0.4);
            }
          }

          &.pause-btn {
            background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
            border: none;
            box-shadow: 0 4px 12px rgba(250, 173, 20, 0.3);

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(250, 173, 20, 0.4);
            }
          }

          &.resume-btn {
            background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
            border: none;
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
            }
          }

          &.stop-btn {
            background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(255, 77, 79, 0.4);
            }
          }
        }
      }

      .secondary-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;

        .setting-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;

          label {
            font-size: 14px;
            color: #495057;
            font-weight: 500;
          }

          .thread-input {
            width: 80px;
          }
        }

        .export-btn {
          height: 40px;
          border-radius: 8px;
          border: 2px solid #667eea;
          color: #667eea;
          font-weight: 500;

          &:hover {
            background: #667eea;
            color: white;
            transform: translateY(-1px);
          }
        }
      }
    }

    .progress-section {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      border: 1px solid #e9ecef;

      .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .progress-title {
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .progress-percentage {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
        }
      }

      .main-progress {
        margin-bottom: 16px;

        :deep(.arco-progress-line-outer) {
          background: #e9ecef;
          border-radius: 6px;
        }

        :deep(.arco-progress-line-inner) {
          border-radius: 6px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
        }
      }

      .progress-details {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #495057;

          .detail-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;

            &.total {
              background: #adb5bd;
            }

            &.completed {
              background: #52c41a;
            }

            &.failed {
              background: #ff4d4f;
            }

            &.pending {
              background: #faad14;
            }
          }
        }
      }
    }
  }
}

// 表格容器
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  overflow: hidden;

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;

    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      margin: 0;
    }

    .table-actions {
      display: flex;
      gap: 8px;

      .arco-btn {
        height: 36px;
        border-radius: 8px;
        font-weight: 500;
      }
    }
  }

  .result-table {
    :deep(.arco-table-thead) {
      background: #f8f9fa;

      th {
        background: #f8f9fa;
        color: #495057;
        font-weight: 600;
        border-bottom: 2px solid #dee2e6;
      }
    }

    :deep(.arco-table-tbody) {
      tr {
        transition: all 0.2s ease;

        &:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        td {
          border-bottom: 1px solid #f0f2f5;
          padding: 12px 16px;
        }
      }
    }

    .status-cell {
      display: flex;
      justify-content: center;

      .status-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;

        &.pending {
          background: #fff7e6;
          color: #d48806;
          border: 1px solid #ffd591;
        }

        &.loading {
          background: #e6f7ff;
          color: #1890ff;
          border: 1px solid #91d5ff;
        }

        &.completed {
          background: #f6ffed;
          color: #389e0d;
          border: 1px solid #b7eb8f;
        }

        &.error {
          background: #fff2f0;
          color: #cf1322;
          border: 1px solid #ffccc7;
        }

        &.unknown {
          background: #f5f5f5;
          color: #8c8c8c;
          border: 1px solid #d9d9d9;
        }
      }
    }

    .result-cell {
      .result-content {
        max-width: 400px;
        max-height: 100px;
        overflow: auto;
        font-size: 13px;
        line-height: 1.4;
      }

      .result-empty {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #8c8c8c;
        font-style: italic;
      }
    }

    .action-cell {
      display: flex;
      gap: 8px;
      justify-content: center;

      .arco-btn {
        height: 28px;
        padding: 0 12px;
        border-radius: 6px;
        font-size: 12px;
      }
    }
  }
}

// 错误弹窗样式
.error-modal {
  :deep(.arco-modal-header) {
    background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }

  :deep(.arco-modal-body) {
    padding: 24px;
  }

  .error-content {
    .error-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;

      .error-icon {
        color: #ff4d4f;
        font-size: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .error-info {
        flex: 1;

        h4 {
          margin: 0 0 8px 0;
          color: #1a1a1a;
          font-size: 16px;
          font-weight: 600;
        }

        .error-message {
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }
      }
    }

    .error-suggestion {
      padding: 16px;
      background: #fff7e6;
      border-radius: 8px;
      border-left: 4px solid #faad14;

      p {
        margin: 0;
        color: #d48806;
        font-size: 14px;
      }
    }
  }

  .error-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    .arco-btn {
      height: 36px;
      padding: 0 16px;
      border-radius: 8px;
      font-weight: 500;
    }
  }
}

// 详情弹窗样式
.detail-modal {
  :deep(.arco-modal-header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }

  :deep(.arco-modal-body) {
    padding: 24px;
  }

  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      &.full-width {
        flex-direction: column;
        gap: 8px;
      }

      label {
        font-weight: 600;
        color: #1a1a1a;
        min-width: 80px;
        flex-shrink: 0;
      }

      span {
        color: #495057;
      }

      .result-detail {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 16px;
        border: 1px solid #e9ecef;
        font-size: 13px;
        line-height: 1.4;
        max-height: 300px;
        overflow: auto;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .result-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px;

    .header-content {
      flex-direction: column;
      text-align: center;

      .page-title {
        font-size: 24px;
      }

      .header-stats {
        justify-content: center;
        gap: 12px;

        .stat-item .stat-value {
          font-size: 24px;
        }
      }
    }
  }

  .control-panel {
    padding: 16px;

    .control-body .control-actions {
      flex-direction: column;
      align-items: stretch;

      .primary-actions {
        justify-content: center;
        margin-bottom: 16px;
      }

      .secondary-actions {
        justify-content: center;
      }
    }
  }

  .table-container {
    .table-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }
  }
}
</style>
