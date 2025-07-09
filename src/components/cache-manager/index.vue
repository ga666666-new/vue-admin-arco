<template>
  <div class="cache-manager">
    <a-card size="small" title="缓存管理" :bordered="false">
      <template #extra>
        <a-space>
          <a-button size="mini" type="outline" @click="refreshStats">
            <icon-refresh />
            刷新
          </a-button>
          <a-button size="mini" type="outline" status="danger" @click="clearAllCache">
            <icon-delete />
            清空缓存
          </a-button>
        </a-space>
      </template>
      
      <div class="cache-stats">
        <a-descriptions :column="2" size="small">
          <a-descriptions-item label="缓存数量">
            <a-tag :color="stats.size > 0 ? 'blue' : 'gray'">
              {{ stats.size }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="缓存状态">
            <a-tag :color="stats.size > 0 ? 'green' : 'gray'">
              {{ stats.size > 0 ? '活跃' : '空' }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <a-divider />

      <div class="cache-keys">
        <div class="cache-keys-header">
          <span>缓存键列表</span>
          <a-tag size="small" color="gray">{{ stats.keys.length }} 个</a-tag>
        </div>
        
        <div v-if="stats.keys.length === 0" class="empty-cache">
          <a-empty size="small" description="暂无缓存数据" />
        </div>
        
        <div v-else class="cache-keys-list">
          <div v-for="key in stats.keys" :key="key" class="cache-key-item">
            <div class="cache-key-info">
              <icon-file class="cache-key-icon" />
              <span class="cache-key-text">{{ key }}</span>
            </div>
            <a-button size="mini" type="text" status="danger" @click="clearCache(key)">
              <icon-delete />
            </a-button>
          </div>
        </div>
      </div>

      <a-divider />

      <div class="cache-actions">
        <a-space>
          <a-button size="small" type="outline" @click="testCache">
            <icon-play-circle />
            测试缓存
          </a-button>
          <a-button size="small" type="outline" @click="showCacheInfo">
            <icon-info-circle />
            缓存信息
          </a-button>
        </a-space>
      </div>
    </a-card>

    <!-- 缓存信息模态框 -->
    <a-modal v-model:visible="cacheInfoVisible" title="缓存信息" width="600px">
      <div class="cache-info">
        <a-descriptions :column="1" size="small">
          <a-descriptions-item label="缓存配置">
            <div>最大缓存数量: 50</div>
            <div>缓存过期时间: 5分钟</div>
            <div>当前缓存数量: {{ stats.size }}</div>
          </a-descriptions-item>
          <a-descriptions-item label="缓存键">
            <div v-for="key in stats.keys" :key="key" class="cache-key-display">
              {{ key }}
            </div>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { apiCache } from '@/utils/cache';
import { Message } from '@arco-design/web-vue';
import { onMounted, ref } from 'vue';

const stats = ref<{ size: number; keys: string[] }>({ size: 0, keys: [] })
const cacheInfoVisible = ref(false)

// 刷新缓存统计
const refreshStats = () => {
  stats.value = apiCache.getStats()
  console.log('📊 缓存统计已刷新:', stats.value)
}

// 清空所有缓存
const clearAllCache = () => {
  apiCache.clearAll()
  refreshStats()
  Message.success('所有缓存已清空')
}

// 清除特定缓存
const clearCache = (key: string) => {
  // 从缓存键中提取原始key
  const originalKey = key.replace('api_cache_', '')
  apiCache.clear(originalKey === 'default' ? null : originalKey)
  refreshStats()
  Message.success(`缓存 "${key}" 已清除`)
}

// 测试缓存功能
const testCache = async () => {
  try {
    // 模拟API调用
    const testData = { test: 'data', timestamp: Date.now() }
    apiCache.set('test_key', testData)
    
    // 立即获取缓存
    const cached = apiCache.get('test_key')
    if (cached) {
      Message.success('缓存测试成功')
    } else {
      Message.error('缓存测试失败')
    }
    
    refreshStats()
  } catch (error) {
    Message.error('缓存测试出错')
  }
}

// 显示缓存信息
const showCacheInfo = () => {
  cacheInfoVisible.value = true
}

onMounted(() => {
  refreshStats()
})
</script>

<style scoped lang="less">
.cache-manager {
  .cache-stats {
    margin-bottom: 16px;
  }

  .cache-keys {
    .cache-keys-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .empty-cache {
      text-align: center;
      padding: 20px 0;
    }

    .cache-keys-list {
      max-height: 200px;
      overflow-y: auto;

      .cache-key-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        border: 1px solid #f0f0f0;
        border-radius: 4px;
        margin-bottom: 8px;
        background-color: #fafafa;

        &:hover {
          background-color: #f5f5f5;
        }

        .cache-key-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .cache-key-icon {
            color: #1890ff;
            font-size: 14px;
          }

          .cache-key-text {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #666;
            word-break: break-all;
          }
        }
      }
    }
  }

  .cache-actions {
    text-align: center;
  }

  .cache-info {
    .cache-key-display {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #666;
      padding: 4px 8px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin-bottom: 4px;
      word-break: break-all;
    }
  }
}
</style> 