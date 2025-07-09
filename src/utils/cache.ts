// 缓存工具类
interface CacheItem<T> {
  data: T
  timestamp: number
  key: string
}

interface CacheConfig {
  maxAge?: number // 缓存最大年龄（毫秒），默认5分钟
  maxSize?: number // 最大缓存数量，默认100
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>()
  private config: CacheConfig

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxAge: 5 * 60 * 1000, // 默认5分钟
      maxSize: 100, // 默认100个缓存项
      ...config
    }
  }

  // 生成缓存键
  private generateKey(key: string | undefined | null): string {
    return `api_cache_${key || 'default'}`
  }

  // 检查缓存是否有效
  private isCacheValid(item: CacheItem<any>): boolean {
    const now = Date.now()
    return (now - item.timestamp) < (this.config.maxAge || 5 * 60 * 1000)
  }

  // 清理过期缓存
  private cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (!this.isCacheValid(item)) {
        this.cache.delete(key)
      }
    }
  }

  // 清理超出大小限制的缓存
  private cleanOverflowCache(): void {
    if (this.cache.size > (this.config.maxSize || 100)) {
      // 按时间戳排序，删除最旧的缓存
      const sortedEntries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)

      const deleteCount = this.cache.size - (this.config.maxSize || 100)
      for (let i = 0; i < deleteCount; i++) {
        this.cache.delete(sortedEntries[i][0])
      }
    }
  }

  // 获取缓存
  get<T>(key: string | undefined | null): T | null {
    const cacheKey = this.generateKey(key)
    const item = this.cache.get(cacheKey)

    if (!item) {
      return null
    }

    if (!this.isCacheValid(item)) {
      this.cache.delete(cacheKey)
      return null
    }

    console.log(`📦 缓存命中: ${cacheKey}`)
    return item.data
  }

  // 设置缓存
  set<T>(key: string | undefined | null, data: T): void {
    const cacheKey = this.generateKey(key)

    // 清理过期和超出的缓存
    this.cleanExpiredCache()
    this.cleanOverflowCache()

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      key: cacheKey
    })

    console.log(`💾 缓存已保存: ${cacheKey}`)
  }

  // 清除特定缓存
  clear(key: string | undefined | null): void {
    const cacheKey = this.generateKey(key)
    this.cache.delete(cacheKey)
    console.log(`🗑️ 缓存已清除: ${cacheKey}`)
  }

  // 清除所有缓存
  clearAll(): void {
    this.cache.clear()
    console.log('🗑️ 所有缓存已清除')
  }

  // 获取缓存统计信息
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // 检查缓存是否存在且有效
  has(key: string | undefined | null): boolean {
    const cacheKey = this.generateKey(key)
    const item = this.cache.get(cacheKey)
    return item ? this.isCacheValid(item) : false
  }
}

// 创建全局缓存实例
export const apiCache = new CacheManager({
  maxAge: 5 * 60 * 1000, // 5分钟
  maxSize: 50 // 最多50个缓存项
})

// 缓存装饰器函数
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator?: (...args: T) => string | undefined | null
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator ? keyGenerator(...args) : args[0]

    // 尝试从缓存获取
    const cached = apiCache.get<R>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // 缓存未命中，执行原函数
    console.log(`🔄 缓存未命中，执行API请求: ${cacheKey}`)
    const result = await fn(...args)

    // 保存到缓存
    apiCache.set(cacheKey, result)

    return result
  }
}

// 导出缓存管理器类（用于测试或自定义配置）
export { CacheManager }
