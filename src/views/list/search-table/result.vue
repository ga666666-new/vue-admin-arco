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

            <a-button v-if="isBatchProcessing" type="outline" status="danger" @click="stopBatchProcessing">
              ⏹️ {{ t('searchTable.batch.stop') }}
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
        :size="size" :scroll="{ x: 'max-content' }">
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
import { queryService, submitOrder, ServiceRecord } from "@/api/list";
import type { LoginData } from "@/api/user";
import useLocale from "@/hooks/locale";
import { useUserStore } from "@/store";
import { getToken } from "@/utils/auth";
import { TableColumnData } from "@arco-design/web-vue";
import dayjs from "dayjs";
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import * as XLSX from "xlsx";
import { Message } from '@arco-design/web-vue'
import { IconCheckCircle } from '@arco-design/web-vue/es/icon'

// 导入数据处理工具
import {
  processThirdPartyResponse,
  generateTableColumns,
  exportToCSV,
  type DeviceQueryResult,
  type TableColumn,
  // 导入新的通用处理器
  GenericDataProcessor,
  createDeviceInfoProcessor,
  createGenericTextProcessor,
  type GenericDataProcessorConfig,
  type GenericParseResult,
  // 导入简单的键值对提取器
  extractKeyValuePairs,
  extractBatchKeyValuePairs,
  generateSimpleTableColumns
} from '@/utils/data-processor'

const { t } = useI18n();

// 创建通用数据处理器实例
const deviceProcessor = createDeviceInfoProcessor()
const genericProcessor = createGenericTextProcessor()

const columns = computed<TableColumnData[]>(() => {
  // 如果有动态列，使用动态列配置
  if (dynamicColumns.value.length > 0) {
    return [
      {
        title: "ID",
        dataIndex: "id",
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

const resList = ref([]);
const dataList = ref([]);
const tableFileds = ref([]);
// 新增：存储处理后的键值对数据
const processedData = ref<Array<{ id: string;[key: string]: any }>>([]);
// 新增：动态表格列
const dynamicColumns = ref<TableColumnData[]>([]);
// 批量处理配置
const batchConfig = ref({
  threadCount: 3, // 默认3个线程
  batchSize: 10,  // 每批处理数量
});
// 批量处理状态
const batchStatus = ref<Record<string, 'pending' | 'loading' | 'completed' | 'error'>>({});
// 正在进行批量处理
const isBatchProcessing = ref(false);
// 批量处理进度
const batchProgress = ref({
  total: 0,
  completed: 0,
  failed: 0
});

const list = computed(() => {
  const sn = route.query.id;
  return JSON.parse(localStorage.getItem(sn) || "[]");
});

const submitSingleOrder = async (line) => {
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

    return await submitOrder(line, getToken(), route.query.serviceId, lang);
  } catch (error) {
    return null;
  }
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
      id: line
      // 其他字段将在处理过程中动态添加
    });
  });

  // 重置进度
  batchProgress.value = {
    total: lines.length,
    completed: 0,
    failed: 0
  };
};

// 并发池管理类
class ConcurrencyPool {
  private running = 0;
  private queue: Array<() => Promise<void>> = [];

  constructor(private maxConcurrency: number) { }

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
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
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

      // 更新状态为loading
      batchStatus.value[line] = 'loading';
      console.log(`🔄 开始处理第${index + 1}项: ${line}`);

      // 调用API
      const response = await submitSingleOrder(line);

      if (response) {
        // 使用键值对提取器处理响应
        const keyValuePairs = extractKeyValuePairs(response);

        // 找到对应的表格项并更新
        const existingIndex = processedData.value.findIndex(item => item.id === line);
        if (existingIndex !== -1) {
          // 更新现有项目
          processedData.value[existingIndex] = {
            id: line,
            ...keyValuePairs
          };
        }

        // 更新原始数据（向后兼容）
        dataList.value.push({ sn: line, result: response });

        // 更新状态
        batchStatus.value[line] = 'completed';
        batchProgress.value.completed++;

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

      // 更新表格显示错误信息
      const existingIndex = processedData.value.findIndex(item => item.id === line);
      if (existingIndex !== -1) {
        processedData.value[existingIndex] = {
          id: line,
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

    // 创建并发池
    const pool = new ConcurrencyPool(batchConfig.value.threadCount);

    // 开始处理所有项目
    const promises = lines.map((line, index) =>
      processSingleItem(line, index, pool)
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

  } catch (error: any) {
    console.error('❌ 批量处理失败:', error);
    Message.error(`${t('searchTable.batch.failed')}: ${error?.message || '未知错误'}`);
  } finally {
    isBatchProcessing.value = false;
    batchController = null;
  }
};

// 停止批量处理
const stopBatchProcessing = () => {
  if (batchController) {
    batchController.abort();
    console.log('⏹️ 批量处理已停止');
    Message.info(t('searchTable.batch.stopped'));
  }

  isBatchProcessing.value = false;
  batchController = null;
};

// 获取记录的批量处理状态
const getBatchStatus = (record: any) => {
  const id = record.id || record.sn;
  return batchStatus.value[id] || 'completed';
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
    const headers = ["ID", ...dynamicColumns.value.map(col => col.title)];
    const csvContent = [
      headers.join(","),
      ...processedData.value.map(item => {
        const row = [
          `"${item.id}"`, // ID作为第一列
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
    const headers = ["ID", ...dynamicColumns.value.map(col => col.title)];
    const data = processedData.value.map(item => [
      item.id, // ID作为第一列
      ...dynamicColumns.value.map(col => {
        const value = item[col.dataIndex];
        return value || '';
      })
    ]);

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);

    // 设置列宽
    const colWidths = [
      { wch: 20 }, // ID列
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

// 处理任意格式的数据
const processGenericData = (responseText: string, customConfig?: Partial<GenericDataProcessorConfig>) => {
  try {
    // 如果提供了自定义配置，创建新的处理器实例
    const processor = customConfig ? createGenericTextProcessor(customConfig) : genericProcessor

    const parsedData = processor.processResponse(responseText)
    console.log('通用数据处理结果:', parsedData)
    return parsedData
  } catch (error: any) {
    console.error('通用数据处理失败:', error)
    Message.error(`数据处理失败: ${error?.message || '未知错误'}`)
    throw error
  }
}

// 添加处理第三方响应的示例方法（向后兼容）
const processApiResponse = (responseText: string) => {
  try {
    // 使用数据处理工具处理响应
    const deviceData = processThirdPartyResponse(responseText)
    console.log('处理后的设备数据:', deviceData)
    return deviceData
  } catch (error: any) {
    console.error('处理API响应失败:', error)
    Message.error(`数据处理失败: ${error?.message || '未知错误'}`)
    throw error
  }
}

// 生成表格列配置
const getTableColumns = (): TableColumnData[] => {
  const columns = generateTableColumns()

  // 转换为ArcoDesign表格列格式
  return columns.map((col: TableColumn) => ({
    title: col.title,
    dataIndex: col.dataIndex,
    key: col.key,
    width: col.width,
    align: col.align || 'left',
    render: col.render ? ({ record }: { record: any }) => {
      return col.render!(record[col.dataIndex], record)
    } : undefined
  })) as TableColumnData[]
}

// 动态生成表格列
const generateDynamicTableColumns = (data: GenericParseResult[]) => {
  try {
    // 使用通用处理器生成动态列
    const dynamicColumns = deviceProcessor.generateDynamicColumns(data)

    // 转换为ArcoDesign表格列格式
    return dynamicColumns.map((col: TableColumn) => ({
      title: col.title,
      dataIndex: col.dataIndex,
      key: col.key,
      width: col.width,
      align: col.align || 'left',
      render: col.render ? ({ record }: { record: any }) => {
        return col.render!(record[col.dataIndex], record)
      } : undefined
    })) as TableColumnData[]
  } catch (error: any) {
    console.error('生成动态表格列失败:', error)
    return []
  }
}

// 批量处理数据
const processBatchData = (responses: string[]) => {
  try {
    console.log('🔄 开始批量处理数据...')
    const results = deviceProcessor.processBatchResponses(responses)
    console.log('✅ 批量处理完成:', results)

    // 生成动态表格列
    if (results.length > 0) {
      const dynamicColumns = generateDynamicTableColumns(results)
      console.log('📊 动态表格列:', dynamicColumns)
    }

    return results
  } catch (error: any) {
    console.error('批量处理失败:', error)
    Message.error(`批量处理失败: ${error?.message || '未知错误'}`)
    return []
  }
}

// 示例：处理示例数据
const processSampleData = () => {
  const sampleResponse = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"型号描述: IPHONE 16 PRO MAX WHITE 256GB-CHN<br>IMEI: 357507795010217<br>IMEI2: 357507795095523<br>MEID: 35750779501021<br>序列号: JVWQFJXN4K<br>预计 购买日期: 2025-05-15<br>保修状态: <font color=\\"green\\">在保</font><br>iCloud Lock: <font color=\\"red\\">ON</font><br>iCloud Status: <font color=\\"green\\">Clean</font><br>Demo Unit: <font color=\\"green\\">No</font><br>贷款设备 Device: <font color=\\"green\\">No</font><br>更换设备 Device: <font color=\\"green\\">No</font><br>Replacement Device: <font color=\\"green\\">No</font><br>Refurbished Device: <font color=\\"green\\">No</font><br>Purchase Country: China<br>运营商: 10 - Unlock.<br>Sim-Lock Status: <font color=\\"green\\">Unlocked</font><br>","debug":"","exec_time":6.273647,"user_ip":"223.254.128.13"}`

  try {
    // 使用传统方式处理
    const processedData = processApiResponse(sampleResponse)
    console.log('示例数据处理结果:', processedData)

    // 使用通用处理器处理
    const genericProcessedData = processApiResponseGeneric(sampleResponse)
    console.log('通用处理器处理结果:', genericProcessedData)

    return processedData
  } catch (error) {
    console.error('示例数据处理失败:', error)
    return null
  }
}

// 演示不同数据格式的处理
const demonstrateGenericProcessing = () => {
  // 演示数据1: 标准JSON格式
  const jsonData = `{"name": "iPhone 16", "price": 999, "available": true}`

  // 演示数据2: 简单键值对格式
  const kvData = `
    设备名称: iPhone 16 Pro Max
    价格: 9999
    库存: 有货
    颜色: 白色
    容量: 256GB
  `

  // 演示数据3: HTML格式
  const htmlData = `
    设备名称: <b>iPhone 16 Pro Max</b><br>
    价格: <span style="color:red">9999</span><br>
    库存: <font color="green">有货</font><br>
    颜色: 白色<br>
    容量: 256GB
  `

  console.log('🎯 开始演示通用数据处理...')

  try {
    // 处理JSON数据
    const jsonResult = processGenericData(jsonData)
    console.log('JSON数据处理结果:', jsonResult)

    // 处理键值对数据
    const kvResult = processGenericData(kvData)
    console.log('键值对数据处理结果:', kvResult)

    // 处理HTML数据
    const htmlResult = processGenericData(htmlData)
    console.log('HTML数据处理结果:', htmlResult)

    // 使用自定义配置处理数据
    const customConfig: Partial<GenericDataProcessorConfig> = {
      fieldMapping: {
        '设备名称': 'deviceName',
        '价格': 'price',
        '库存': 'stock',
        '颜色': 'color',
        '容量': 'capacity'
      },
      fieldTypes: {
        deviceName: 'string',
        price: 'number',
        stock: 'string',
        color: 'string',
        capacity: 'string'
      }
    }

    const customResult = processGenericData(htmlData, customConfig)
    console.log('自定义配置处理结果:', customResult)

  } catch (error) {
    console.error('演示处理失败:', error)
  }
}

// 演示简单键值对提取器
const demonstrateSimpleExtractor = () => {
  console.log('🚀 开始演示简单键值对提取器...')

  // 测试数据1: 用户提供的真实数据
  const realData1 = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"Wrong_Imei","debug":"","exec_time":0.336041,"user_ip":"223.254.128.13"}`

  // 测试数据2: 用户提供的真实数据
  const realData2 = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"序列号: JVWQFJXN4K<br>设备型号: iPhone 16 Pro Max<br>激活状态: 已激活<br>空中激活: 否<br>保修状态: 有限保修<br>剩余保修: 324天<br>购买日期: 2025-05<br>激活日期: 2025-05-15<br>保修到期: 2026-05-14<br>注销设备: 否<br>AC+保障: 否<br>是否资源机: 否<br>AC+购买资格: 可直营店购买<br>购买日期验证: 已验证<br>设备图片: https://cdsassets.apple.com/content/services/pub/image?productid=301048&size=240x240","debug":"","exec_time":4.59001,"user_ip":"223.254.128.13"}`

  try {
    console.log('\n📋 测试数据1 (Wrong_Imei):')
    const result1 = extractKeyValuePairs(realData1)
    console.log('提取结果1:', result1)

    console.log('\n📋 测试数据2 (设备信息):')
    const result2 = extractKeyValuePairs(realData2)
    console.log('提取结果2:', result2)

    // 批量处理测试
    console.log('\n📋 批量处理测试:')
    const batchResults = extractBatchKeyValuePairs([realData1, realData2])
    console.log('批量处理结果:', batchResults)

    // 生成表格列
    if (batchResults.length > 0) {
      console.log('\n📊 生成简单表格列:')
      const simpleColumns = generateSimpleTableColumns(batchResults)
      console.log('表格列配置:', simpleColumns)
    }

    return { result1, result2, batchResults }

  } catch (error) {
    console.error('简单提取器演示失败:', error)
    return null
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
  await initTable();

  // 不自动执行fetchData，改为手动批量处理
  // fetchData();

  // 初始化批量处理的数据状态
  if (list.value && list.value.length > 0) {
    initializeBatchData();
  }

  // 开发环境下的演示功能（可选）
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 开发模式：可在控制台使用 extractKeyValuePairs(data) 测试数据处理');
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
