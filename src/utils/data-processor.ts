// 数据处理工具 - 处理第三方接口的不规范数据

/**
 * 通用数据处理器配置接口
 */
export interface GenericDataProcessorConfig {
  // 字段映射配置：原始字段名 -> 目标字段名
  fieldMapping: Record<string, string>
  // 字段类型转换配置
  fieldTypes: Record<string, 'string' | 'number' | 'boolean' | 'date'>
  // 字段值转换器
  fieldTransformers?: Record<string, (value: string) => any>
  // 数据行分隔符
  lineSeparators?: string[]
  // 键值对分隔符
  kvSeparator?: string
  // 是否需要清理HTML标签
  cleanHtml?: boolean
}

/**
 * 通用解析结果接口
 */
export interface GenericParseResult {
  [key: string]: any
}

/**
 * 通用数据处理器类
 */
export class GenericDataProcessor {
  private config: GenericDataProcessorConfig

  constructor(config: GenericDataProcessorConfig) {
    this.config = {
      lineSeparators: ['<br>', '<br/>', '\n', '\r\n'],
      kvSeparator: ':',
      cleanHtml: true,
      ...config
    }
  }

  /**
   * 清理HTML标签和特殊字符
   */
  private cleanHtmlText(text: string): string {
    if (!text) return ''

    return text
      // 移除HTML标签
      .replace(/<[^>]*>/g, '')
      // 移除换行符
      .replace(/\r?\n/g, '')
      // 移除多余空格
      .replace(/\s+/g, ' ')
      // 去除首尾空格
      .trim()
  }

  /**
   * 从响应数据中提取JSON（支持多种格式）
   */
  private extractJsonFromResponse(responseText: string): any {
    try {
      // 方式1: 直接尝试解析整个响应
      try {
        return JSON.parse(responseText)
      } catch (e) {
        // 继续尝试其他方式
      }

      // 方式2: 处理转义的JSON字符串
      try {
        // 如果是转义的JSON字符串，先反转义
        const unescaped = responseText.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        return JSON.parse(unescaped)
      } catch (e) {
        // 继续尝试其他方式
      }

      // 方式3: 查找JSON开始位置 (寻找第一个 '{')
      const jsonStart = responseText.indexOf('{')
      if (jsonStart !== -1) {
        let jsonString = responseText.substring(jsonStart)

        // 尝试直接解析
        try {
          return JSON.parse(jsonString)
        } catch (e) {
          // 尝试处理转义字符
          try {
            jsonString = jsonString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            return JSON.parse(jsonString)
          } catch (e2) {
            // 继续尝试其他方式
          }
        }
      }

      // 方式4: 使用正则表达式查找JSON（更宽泛的匹配）
      const jsonMatch = responseText.match(/\{[^}]*\}/)
      if (jsonMatch) {
        let jsonString = jsonMatch[0]
        try {
          return JSON.parse(jsonString)
        } catch (e) {
          // 尝试处理转义字符
          try {
            jsonString = jsonString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            return JSON.parse(jsonString)
          } catch (e2) {
            // 继续下一个方法
          }
        }
      }

      // 方式5: 更复杂的正则匹配，包括嵌套结构
      const complexJsonMatch = responseText.match(/\{.*\}/s)
      if (complexJsonMatch) {
        let jsonString = complexJsonMatch[0]
        try {
          return JSON.parse(jsonString)
        } catch (e) {
          // 尝试处理转义字符
          try {
            jsonString = jsonString.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            return JSON.parse(jsonString)
          } catch (e2) {
            // 继续下一个方法
          }
        }
      }

      throw new Error('在响应中未找到有效的JSON数据')
    } catch (error: any) {
      console.error('解析JSON时出错:', error)
      console.log('原始数据:', responseText)
      throw new Error(`JSON解析失败: ${error?.message || '未知错误'}`)
    }
  }

  /**
   * 将数据分割为行
   */
  private splitIntoLines(data: string): string[] {
    let result = [data]

    // 使用配置的分隔符逐个分割
    for (const separator of this.config.lineSeparators!) {
      const newResult: string[] = []
      for (const line of result) {
        newResult.push(...line.split(separator))
      }
      result = newResult
    }

    // 过滤空行并清理
    return result
      .map(line => this.config.cleanHtml ? this.cleanHtmlText(line) : line.trim())
      .filter(line => line.length > 0)
  }

  /**
   * 解析键值对
   */
  private parseKeyValuePair(line: string): { key: string; value: string } | null {
    if (!line.includes(this.config.kvSeparator!)) {
      return null
    }

    const separatorIndex = line.indexOf(this.config.kvSeparator!)
    const key = line.substring(0, separatorIndex).trim()
    const value = line.substring(separatorIndex + 1).trim()

    return { key, value }
  }

  /**
   * 转换字段值类型
   */
  private transformFieldValue(fieldName: string, value: string): any {
    // 首先检查是否有自定义转换器
    if (this.config.fieldTransformers && this.config.fieldTransformers[fieldName]) {
      return this.config.fieldTransformers[fieldName](value)
    }

    // 使用类型配置进行转换
    const fieldType = this.config.fieldTypes[fieldName]
    if (!fieldType) {
      return value // 默认返回字符串
    }

    switch (fieldType) {
      case 'boolean':
        const lowerValue = value.toLowerCase()
        return lowerValue.includes('yes') ||
          lowerValue.includes('true') ||
          lowerValue.includes('是') ||
          lowerValue.includes('on') ||
          lowerValue === '1'

      case 'number':
        const num = parseFloat(value)
        return isNaN(num) ? 0 : num

      case 'date':
        const date = new Date(value)
        return isNaN(date.getTime()) ? null : date

      case 'string':
      default:
        return value
    }
  }

  /**
   * 查找映射的字段名
   */
  private findMappedFieldName(originalKey: string): string | null {
    const lowerKey = originalKey.toLowerCase().trim()

    // 精确匹配
    if (this.config.fieldMapping[lowerKey]) {
      return this.config.fieldMapping[lowerKey]
    }

    // 模糊匹配
    for (const [pattern, mappedName] of Object.entries(this.config.fieldMapping)) {
      if (lowerKey.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(lowerKey)) {
        return mappedName
      }
    }

    return null
  }

  /**
   * 解析原始数据为键值对对象
   */
  public parseRawData(rawData: string): GenericParseResult {
    const lines = this.splitIntoLines(rawData)
    const result: GenericParseResult = {}

    for (const line of lines) {
      const kvPair = this.parseKeyValuePair(line)
      if (!kvPair) continue

      const mappedFieldName = this.findMappedFieldName(kvPair.key)
      if (!mappedFieldName) {
        // 如果没有映射，使用原始键名
        result[kvPair.key] = kvPair.value
        continue
      }

      // 转换字段值
      const transformedValue = this.transformFieldValue(mappedFieldName, kvPair.value)
      result[mappedFieldName] = transformedValue
    }

    return result
  }

  /**
   * 处理第三方接口响应（通用版本）
   */
  public processResponse(responseText: string): GenericParseResult {
    try {
      console.log('🔄 开始处理响应数据...')

      // 1. 尝试提取JSON数据
      let dataToProcess = responseText
      try {
        const jsonData = this.extractJsonFromResponse(responseText)
        console.log('✅ JSON提取成功:', jsonData)

        // 检查不同的数据结构
        if (jsonData.data) {
          dataToProcess = jsonData.data
        } else if (jsonData.result) {
          dataToProcess = jsonData.result
        } else if (typeof jsonData === 'string') {
          dataToProcess = jsonData
        } else {
          // 如果JSON数据本身就是键值对结构，直接返回
          return jsonData
        }
      } catch (error) {
        console.log('⚠️ JSON提取失败，直接处理原始数据')
        // 如果不是JSON格式，直接处理原始数据
      }

      // 2. 解析数据
      const parsedData = this.parseRawData(dataToProcess)
      console.log('✅ 数据解析完成:', parsedData)

      return parsedData

    } catch (error: any) {
      console.error('❌ 处理响应数据时出错:', error)
      throw error
    }
  }

  /**
   * 批量处理多个响应
   */
  public processBatchResponses(responses: string[]): GenericParseResult[] {
    const results: GenericParseResult[] = []
    const errors: Array<{ index: number, error: string }> = []

    responses.forEach((response, index) => {
      try {
        const parsedData = this.processResponse(response)
        results.push(parsedData)
      } catch (error: any) {
        console.error(`处理第${index + 1}条数据时出错:`, error)
        errors.push({
          index: index + 1,
          error: error?.message || '未知错误'
        })
      }
    })

    console.log(`批量处理完成: 成功 ${results.length} 条，失败 ${errors.length} 条`)
    if (errors.length > 0) {
      console.warn('处理失败的数据:', errors)
    }

    return results
  }

  /**
   * 生成动态表格列配置
   */
  public generateDynamicColumns(sampleData: GenericParseResult[]): TableColumn[] {
    if (!sampleData.length) return []

    const allFields = new Set<string>()
    sampleData.forEach(item => {
      Object.keys(item).forEach(key => allFields.add(key))
    })

    return Array.from(allFields).map(field => ({
      title: field,
      dataIndex: field,
      key: field,
      width: 120,
      align: 'left' as const,
      render: (value: any) => {
        // 根据值类型进行不同的渲染
        if (typeof value === 'boolean') {
          return value ? '✅ 是' : '❌ 否'
        }
        if (value === null || value === undefined) {
          return '-'
        }
        return String(value)
      }
    }))
  }

  /**
   * 更新配置
   */
  public updateConfig(newConfig: Partial<GenericDataProcessorConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): GenericDataProcessorConfig {
    return { ...this.config }
  }
}

/**
 * 创建设备信息处理器的预设配置
 */
export function createDeviceInfoProcessor(): GenericDataProcessor {
  const config: GenericDataProcessorConfig = {
    fieldMapping: {
      '型号描述': 'modelDescription',
      'model': 'modelDescription',
      'imei': 'imei',
      'imei2': 'imei2',
      'meid': 'meid',
      '序列号': 'serialNumber',
      'serial': 'serialNumber',
      '购买日期': 'purchaseDate',
      'purchase date': 'purchaseDate',
      '保修状态': 'warrantyStatus',
      'warranty': 'warrantyStatus',
      'icloud lock': 'icloudLock',
      'icloud status': 'icloudStatus',
      'sim-lock': 'simLockStatus',
      'simlock': 'simLockStatus',
      'demo unit': 'isDemoUnit',
      '贷款设备': 'isLoanDevice',
      'loan': 'isLoanDevice',
      '更换设备': 'isReplacementDevice',
      'replacement': 'isReplacementDevice',
      'refurbished': 'isRefurbishedDevice',
      'purchase country': 'purchaseCountry',
      '购买国家': 'purchaseCountry',
      '运营商': 'carrier',
      'carrier': 'carrier'
    },
    fieldTypes: {
      modelDescription: 'string',
      imei: 'string',
      imei2: 'string',
      meid: 'string',
      serialNumber: 'string',
      purchaseDate: 'string',
      warrantyStatus: 'string',
      icloudLock: 'string',
      icloudStatus: 'string',
      simLockStatus: 'string',
      isDemoUnit: 'boolean',
      isLoanDevice: 'boolean',
      isReplacementDevice: 'boolean',
      isRefurbishedDevice: 'boolean',
      purchaseCountry: 'string',
      carrier: 'string'
    },
    fieldTransformers: {
      // 特殊的字段值转换器
      warrantyStatus: (value: string) => {
        if (value.includes('在保') || value.toLowerCase().includes('active')) {
          return '🟢 在保'
        } else if (value.includes('过保') || value.toLowerCase().includes('expired')) {
          return '🔴 过保'
        }
        return value
      },
      icloudStatus: (value: string) => {
        if (value.toLowerCase().includes('clean')) {
          return '🟢 正常'
        } else if (value.toLowerCase().includes('lost') || value.toLowerCase().includes('stolen')) {
          return '🔴 异常'
        }
        return value
      },
      icloudLock: (value: string) => {
        if (value.toLowerCase().includes('on') || value.toLowerCase().includes('locked')) {
          return '🔒 已锁定'
        } else if (value.toLowerCase().includes('off') || value.toLowerCase().includes('unlocked')) {
          return '🔓 未锁定'
        }
        return value
      },
      simLockStatus: (value: string) => {
        if (value.toLowerCase().includes('unlocked')) {
          return '🔓 已解锁'
        } else if (value.toLowerCase().includes('locked')) {
          return '🔒 已锁定'
        }
        return value
      }
    }
  }

  return new GenericDataProcessor(config)
}

/**
 * 创建通用文本处理器
 */
export function createGenericTextProcessor(customConfig?: Partial<GenericDataProcessorConfig>): GenericDataProcessor {
  const defaultConfig: GenericDataProcessorConfig = {
    fieldMapping: {},
    fieldTypes: {},
    lineSeparators: ['<br>', '<br/>', '\n', '\r\n', '|'],
    kvSeparator: ':',
    cleanHtml: true
  }

  const config = customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig
  return new GenericDataProcessor(config)
}

/**
 * 简单通用的键值对提取器
 * 专注于从任何混乱数据中提取干净的键值对
 */
export function extractKeyValuePairs(rawData: string): Record<string, string> {
  console.log('📝 原始输入数据:', rawData)

  // 第1步：尝试从JSON中提取data字段
  let dataToProcess = rawData
  try {
    // 查找JSON开始位置
    const jsonStart = rawData.indexOf('{')
    if (jsonStart !== -1) {
      let jsonString = rawData.substring(jsonStart)

      // 处理转义的引号
      jsonString = jsonString.replace(/\\"/g, '"')

      const jsonData = JSON.parse(jsonString)
      console.log('✅ JSON解析成功:', jsonData)

      // 如果有data字段，使用data字段的内容
      if (jsonData.data && typeof jsonData.data === 'string') {
        dataToProcess = jsonData.data
        console.log('📄 提取到data字段:', dataToProcess)
      } else if (jsonData.data === 'Wrong_Imei') {
        // 处理错误情况
        return { '错误': 'Wrong_Imei', '状态': '查询失败' }
      }
    }
  } catch (error) {
    console.log('⚠️  JSON解析失败，直接处理原始数据')
    // 如果JSON解析失败，直接处理原始数据
  }

  // 第2步：先按分隔符分割数据（保留HTML标签用于分割）
  console.log('🔪 开始分割数据...')

  // 统一各种换行符和br标签为统一的分隔符
  let preprocessedData = dataToProcess
    // 统一各种br标签
    .replace(/<br\s*\/?>/gi, '|||SPLIT|||')
    // 统一换行符
    .replace(/\r\n/g, '|||SPLIT|||')
    .replace(/\r/g, '|||SPLIT|||')
    .replace(/\n/g, '|||SPLIT|||')
    // 处理转义字符
    .replace(/\\n/g, '|||SPLIT|||')
    .replace(/\\r/g, '|||SPLIT|||')

  console.log('🔄 预处理后的数据:', preprocessedData)

  // 按统一分隔符分割
  const rawLines = preprocessedData
    .split('|||SPLIT|||')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  console.log('📋 分割后的原始行:', rawLines)

  // 第3步：清理每行的HTML标签和特殊字符
  const lines = rawLines.map(line => {
    return line
      // 移除HTML标签
      .replace(/<[^>]*>/g, '')
      // 移除多余空格
      .replace(/\s+/g, ' ')
      // 去除首尾空格
      .trim()
  }).filter(line => line.length > 0)

  console.log('📋 分割后的行:', lines)

  // 第4步：提取键值对
  const result: Record<string, string> = {}

  lines.forEach((line, index) => {
    // 查找冒号分隔符
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      console.log(`⚠️  第${index + 1}行没有冒号，跳过: "${line}"`)
      return
    }

    // 分割键和值
    const key = line.substring(0, colonIndex).trim()
    const value = line.substring(colonIndex + 1).trim()

    // 跳过空键或空值
    if (!key || !value) {
      console.log(`⚠️  第${index + 1}行键或值为空，跳过: "${line}"`)
      return
    }

    // 保存键值对
    result[key] = value
    console.log(`✅ 提取键值对: "${key}" = "${value}"`)
  })

  console.log('🎯 最终提取结果:', result)
  return result
}

/**
 * 简单的批量键值对提取
 */
export function extractBatchKeyValuePairs(rawDataList: string[]): Record<string, string>[] {
  console.log('🔄 开始批量提取键值对...')

  const results: Record<string, string>[] = []
  const errors: Array<{ index: number, error: string }> = []

  rawDataList.forEach((rawData, index) => {
    try {
      const kvPairs = extractKeyValuePairs(rawData)
      results.push(kvPairs)
      console.log(`✅ 第${index + 1}条数据处理成功`)
    } catch (error: any) {
      console.error(`❌ 第${index + 1}条数据处理失败:`, error)
      errors.push({
        index: index + 1,
        error: error?.message || '未知错误'
      })
    }
  })

  console.log(`🎉 批量处理完成: 成功 ${results.length} 条，失败 ${errors.length} 条`)
  if (errors.length > 0) {
    console.warn('处理失败的数据:', errors)
  }

  return results
}

/**
 * 生成简单的表格列配置
 */
export function generateSimpleTableColumns(data: Record<string, string>[]): TableColumn[] {
  if (!data.length) return []

  // 收集所有可能的键
  const allKeys = new Set<string>()
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key))
  })

  // 生成表格列
  return Array.from(allKeys).map(key => ({
    title: key,
    dataIndex: key,
    key: key,
    width: key === 'url' || key === '设备图片' || key.includes('图片') ? 200 : 120,
    align: 'left' as const,
    render: (value: string) => {
      // 处理URL类型的值
      if (value && (value.startsWith('http') || value.startsWith('https'))) {
        return `🔗 ${value.substring(0, 30)}...`
      }
      // 处理日期类型的值
      if (value && /\d{4}-\d{2}-\d{2}/.test(value)) {
        return `📅 ${value}`
      }
      // 处理状态类型的值
      if (value) {
        if (value.includes('已激活') || value.includes('有效') || value.includes('是')) {
          return `✅ ${value}`
        }
        if (value.includes('未激活') || value.includes('无效') || value.includes('否')) {
          return `❌ ${value}`
        }
        if (value.includes('天')) {
          return `⏰ ${value}`
        }
      }
      return value || '-'
    }
  }))
}

/**
 * 设备查询结果接口
 */
export interface DeviceQueryResult {
  // 基本信息
  imei: string
  imei2?: string
  meid?: string
  serialNumber: string
  modelDescription: string

  // 状态信息
  warrantyStatus: string
  icloudLock: string
  icloudStatus: string
  simLockStatus: string

  // 设备类型判断
  isDemoUnit: boolean
  isLoanDevice: boolean
  isReplacementDevice: boolean
  isRefurbishedDevice: boolean

  // 购买信息
  purchaseDate?: string
  purchaseCountry?: string
  carrier?: string

  // 原始数据（用于调试）
  rawData?: string
}

/**
 * 表格列定义
 */
export interface TableColumn {
  title: string
  dataIndex: string
  key: string
  width?: number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: any) => string
}

/**
 * 清理HTML标签和特殊字符
 */
export function cleanHtmlText(text: string): string {
  if (!text) return ''

  return text
    // 移除HTML标签
    .replace(/<[^>]*>/g, '')
    // 移除换行符
    .replace(/\r?\n/g, '')
    // 移除多余空格
    .replace(/\s+/g, ' ')
    // 去除首尾空格
    .trim()
}

/**
 * 从响应数据中提取JSON（向后兼容版本）
 */
export function extractJsonFromResponse(responseText: string): any {
  try {
    // 查找JSON开始位置 (寻找第一个 '{')
    const jsonStart = responseText.indexOf('{')
    if (jsonStart === -1) {
      throw new Error('在响应中未找到JSON数据')
    }

    // 提取JSON部分
    const jsonString = responseText.substring(jsonStart)

    // 解析JSON
    const parsed = JSON.parse(jsonString)

    return parsed
  } catch (error: any) {
    console.error('解析JSON时出错:', error)
    throw new Error(`JSON解析失败: ${error?.message || '未知错误'}`)
  }
}

/**
 * 解析设备信息数据
 */
export function parseDeviceData(htmlData: string): DeviceQueryResult {
  if (!htmlData) {
    throw new Error('设备数据为空')
  }

  // 按<br>分割数据行
  const lines = htmlData.split('<br>').filter(line => line.trim())

  const result: Partial<DeviceQueryResult> = {}

  lines.forEach(line => {
    const cleanLine = cleanHtmlText(line)
    if (!cleanLine.includes(':')) return

    const [key, ...valueParts] = cleanLine.split(':')
    const value = valueParts.join(':').trim()

    const lowerKey = key.toLowerCase().trim()

    // 映射各个字段
    switch (true) {
      case lowerKey.includes('型号描述') || lowerKey.includes('model'):
        result.modelDescription = value
        break

      case lowerKey === 'imei' && !lowerKey.includes('2'):
        result.imei = value
        break

      case lowerKey.includes('imei2'):
        result.imei2 = value
        break

      case lowerKey.includes('meid'):
        result.meid = value
        break

      case lowerKey.includes('序列号') || lowerKey.includes('serial'):
        result.serialNumber = value
        break

      case lowerKey.includes('购买日期') || lowerKey.includes('purchase date'):
        result.purchaseDate = value
        break

      case lowerKey.includes('保修状态') || lowerKey.includes('warranty'):
        result.warrantyStatus = value
        break

      case lowerKey.includes('icloud lock'):
        result.icloudLock = value
        break

      case lowerKey.includes('icloud status'):
        result.icloudStatus = value
        break

      case lowerKey.includes('sim-lock') || lowerKey.includes('simlock'):
        result.simLockStatus = value
        break

      case lowerKey.includes('demo unit'):
        result.isDemoUnit = value.toLowerCase().includes('yes') || value.toLowerCase().includes('是')
        break

      case lowerKey.includes('贷款设备') || lowerKey.includes('loan'):
        result.isLoanDevice = value.toLowerCase().includes('yes') || value.toLowerCase().includes('是')
        break

      case lowerKey.includes('更换设备') || lowerKey.includes('replacement'):
        result.isReplacementDevice = value.toLowerCase().includes('yes') || value.toLowerCase().includes('是')
        break

      case lowerKey.includes('refurbished'):
        result.isRefurbishedDevice = value.toLowerCase().includes('yes') || value.toLowerCase().includes('是')
        break

      case lowerKey.includes('purchase country') || lowerKey.includes('购买国家'):
        result.purchaseCountry = value
        break

      case lowerKey.includes('运营商') || lowerKey.includes('carrier'):
        result.carrier = value
        break
    }
  })

  // 验证必需字段
  if (!result.imei) {
    throw new Error('未找到IMEI信息')
  }

  return result as DeviceQueryResult
}

/**
 * 处理第三方接口响应
 */
export function processThirdPartyResponse(responseText: string): DeviceQueryResult {
  try {
    console.log('原始响应数据:', responseText)

    // 1. 提取JSON数据
    const jsonData = extractJsonFromResponse(responseText)
    console.log('解析的JSON数据:', jsonData)

    // 2. 检查响应状态
    if (jsonData.code !== 200) {
      throw new Error(jsonData.msg || '查询失败')
    }

    // 3. 解析设备数据
    const deviceData = parseDeviceData(jsonData.data)
    deviceData.rawData = responseText // 保存原始数据用于调试

    console.log('解析的设备数据:', deviceData)

    return deviceData

  } catch (error: any) {
    console.error('处理第三方响应时出错:', error)
    throw error
  }
}

/**
 * 生成表格列定义
 */
export function generateTableColumns(): TableColumn[] {
  return [
    {
      title: 'IMEI',
      dataIndex: 'imei',
      key: 'imei',
      width: 150,
      align: 'left'
    },
    {
      title: '设备型号',
      dataIndex: 'modelDescription',
      key: 'modelDescription',
      width: 200,
      align: 'left'
    },
    {
      title: '序列号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 120,
      align: 'left'
    },
    {
      title: '保修状态',
      dataIndex: 'warrantyStatus',
      key: 'warrantyStatus',
      width: 100,
      align: 'center',
      render: (value: string) => {
        if (value?.includes('在保') || value?.toLowerCase().includes('active')) {
          return '🟢 在保'
        } else if (value?.includes('过保') || value?.toLowerCase().includes('expired')) {
          return '🔴 过保'
        }
        return value || '未知'
      }
    },
    {
      title: 'iCloud状态',
      dataIndex: 'icloudStatus',
      key: 'icloudStatus',
      width: 100,
      align: 'center',
      render: (value: string) => {
        if (value?.toLowerCase().includes('clean')) {
          return '🟢 正常'
        } else if (value?.toLowerCase().includes('lost') || value?.toLowerCase().includes('stolen')) {
          return '🔴 异常'
        }
        return value || '未知'
      }
    },
    {
      title: 'iCloud锁',
      dataIndex: 'icloudLock',
      key: 'icloudLock',
      width: 100,
      align: 'center',
      render: (value: string) => {
        if (value?.toLowerCase().includes('on') || value?.toLowerCase().includes('locked')) {
          return '🔒 已锁定'
        } else if (value?.toLowerCase().includes('off') || value?.toLowerCase().includes('unlocked')) {
          return '🔓 未锁定'
        }
        return value || '未知'
      }
    },
    {
      title: 'SIM锁状态',
      dataIndex: 'simLockStatus',
      key: 'simLockStatus',
      width: 100,
      align: 'center',
      render: (value: string) => {
        if (value?.toLowerCase().includes('unlocked')) {
          return '🔓 已解锁'
        } else if (value?.toLowerCase().includes('locked')) {
          return '🔒 已锁定'
        }
        return value || '未知'
      }
    },
    {
      title: '购买日期',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      width: 120,
      align: 'center'
    },
    {
      title: '购买国家',
      dataIndex: 'purchaseCountry',
      key: 'purchaseCountry',
      width: 100,
      align: 'center'
    },
    {
      title: '运营商',
      dataIndex: 'carrier',
      key: 'carrier',
      width: 150,
      align: 'left'
    },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      width: 120,
      align: 'center',
      render: (value: any, record: DeviceQueryResult) => {
        const types = []
        if (record.isDemoUnit) types.push('演示机')
        if (record.isLoanDevice) types.push('贷款设备')
        if (record.isReplacementDevice) types.push('更换设备')
        if (record.isRefurbishedDevice) types.push('翻新设备')

        return types.length > 0 ? types.join(', ') : '正常设备'
      }
    }
  ]
}

/**
 * 批量处理查询结果
 */
export function processBatchQueryResults(responses: string[]): DeviceQueryResult[] {
  const results: DeviceQueryResult[] = []
  const errors: Array<{ index: number, error: string }> = []

  responses.forEach((response, index) => {
    try {
      const deviceData = processThirdPartyResponse(response)
      results.push(deviceData)
    } catch (error: any) {
      console.error(`处理第${index + 1}条数据时出错:`, error)
      errors.push({
        index: index + 1,
        error: error?.message || '未知错误'
      })
    }
  })

  console.log(`批量处理完成: 成功 ${results.length} 条，失败 ${errors.length} 条`)
  if (errors.length > 0) {
    console.warn('处理失败的数据:', errors)
  }

  return results
}

/**
 * 测试数据处理工具的方法（供控制台调用）
 */
export function testDataProcessor(): DeviceQueryResult {
  // 示例原始数据
  const sampleResponse = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"型号描述: IPHONE 16 PRO MAX WHITE 256GB-CHN<br>IMEI: 357507795010217<br>IMEI2: 357507795095523<br>MEID: 35750779501021<br>序列号: JVWQFJXN4K<br>预计 购买日期: 2025-05-15<br>保修状态: <font color=\\"green\\">在保</font><br>iCloud Lock: <font color=\\"red\\">ON</font><br>iCloud Status: <font color=\\"green\\">Clean</font><br>Demo Unit: <font color=\\"green\\">No</font><br>贷款设备 Device: <font color=\\"green\\">No</font><br>更换设备 Device: <font color=\\"green\\">No</font><br>Replacement Device: <font color=\\"green\\">No</font><br>Refurbished Device: <font color=\\"green\\">No</font><br>Purchase Country: China<br>运营商: 10 - Unlock.<br>Sim-Lock Status: <font color=\\"green\\">Unlocked</font><br>","debug":"","exec_time":6.273647,"user_ip":"223.254.128.13"}`

  console.log('🧪 开始测试数据处理工具...')
  console.log('📝 原始数据:')
  console.log(sampleResponse)

  try {
    // 1. 测试提取JSON
    console.log('\n🔍 步骤1: 提取JSON数据')
    const jsonData = extractJsonFromResponse(sampleResponse)
    console.log('✅ JSON提取成功:', jsonData)

    // 2. 测试解析设备数据
    console.log('\n🔍 步骤2: 解析设备数据')
    const deviceData = parseDeviceData(jsonData.data)
    console.log('✅ 设备数据解析成功:', deviceData)

    // 3. 测试完整处理流程
    console.log('\n🔍 步骤3: 完整处理流程')
    const completeData = processThirdPartyResponse(sampleResponse)
    console.log('✅ 完整处理成功:', completeData)

    // 4. 测试表格列生成
    console.log('\n🔍 步骤4: 生成表格列')
    const columns = generateTableColumns()
    console.log('✅ 表格列生成成功 (共', columns.length, '列):')
    console.table(columns.map(col => ({
      标题: col.title,
      字段: col.dataIndex,
      宽度: col.width,
      对齐: col.align,
      自定义渲染: !!col.render
    })))

    console.log('\n🎉 所有测试通过！数据处理工具工作正常')
    return completeData

  } catch (error: any) {
    console.error('❌ 测试失败:', error)
    throw error
  }
}

/**
 * 导出结果为CSV格式
 */
export function exportToCSV(data: DeviceQueryResult[], filename: string = 'device_query_results.csv'): void {
  if (!data.length) {
    throw new Error('没有数据可导出')
  }

  const columns = generateTableColumns()
  const headers = columns.map(col => col.title).join(',')

  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.dataIndex as keyof DeviceQueryResult]

      // 处理特殊渲染逻辑
      if (col.render && typeof col.render === 'function') {
        value = col.render(value, item)
      }

      // 处理布尔值
      if (typeof value === 'boolean') {
        value = value ? '是' : '否'
      }

      // 处理空值
      if (value === null || value === undefined) {
        value = ''
      }

      // 转换为字符串并处理逗号
      const stringValue = String(value)
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue
    }).join(',')
  })

  const csvContent = [headers, ...rows].join('\n')

  // 创建下载链接
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// 在开发环境中暴露测试方法到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testDataProcessor = testDataProcessor;
  (window as any).processThirdPartyResponse = processThirdPartyResponse;
  (window as any).generateTableColumns = generateTableColumns;

  // 新增通用处理器方法
  (window as any).createDeviceInfoProcessor = createDeviceInfoProcessor;
  (window as any).createGenericTextProcessor = createGenericTextProcessor;
  (window as any).GenericDataProcessor = GenericDataProcessor;

  // 创建全局处理器实例
  (window as any).deviceProcessor = createDeviceInfoProcessor();
  (window as any).genericProcessor = createGenericTextProcessor();

  // 新增简单键值对提取器方法
  (window as any).extractKeyValuePairs = extractKeyValuePairs;
  (window as any).extractBatchKeyValuePairs = extractBatchKeyValuePairs;
  (window as any).generateSimpleTableColumns = generateSimpleTableColumns;

  console.log('🔧 数据处理工具已加载到全局对象:')
  console.log('  - testDataProcessor() - 运行完整测试')
  console.log('  - processThirdPartyResponse(data) - 处理第三方数据')
  console.log('  - generateTableColumns() - 生成表格列配置')
  console.log('  - createDeviceInfoProcessor() - 创建设备信息处理器')
  console.log('  - createGenericTextProcessor(config?) - 创建通用文本处理器')
  console.log('  - deviceProcessor - 全局设备处理器实例')
  console.log('  - genericProcessor - 全局通用处理器实例')
  console.log('')
  console.log('🎯 简单键值对提取器 (推荐使用):')
  console.log('  - extractKeyValuePairs(rawData) - 提取键值对')
  console.log('  - extractBatchKeyValuePairs([data1, data2]) - 批量提取')
  console.log('  - generateSimpleTableColumns(data) - 生成简单表格列')
  console.log('')
  console.log('💡 使用示例:')
  console.log('  deviceProcessor.processResponse("your_data")')
  console.log('  genericProcessor.processResponse("your_data")')
  console.log('  extractKeyValuePairs("your_messy_data") // 最简单的方式')
} 