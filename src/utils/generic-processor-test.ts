// 通用数据处理器测试文件
import {
  createDeviceInfoProcessor,
  createGenericTextProcessor,
  type GenericDataProcessorConfig
} from './data-processor'

/**
 * 测试数据样本
 */
const testSamples = {
  // iPhone设备信息（原始格式）
  deviceInfo: `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"型号描述: IPHONE 16 PRO MAX WHITE 256GB-CHN<br>IMEI: 357507795010217<br>IMEI2: 357507795095523<br>MEID: 35750779501021<br>序列号: JVWQFJXN4K<br>预计 购买日期: 2025-05-15<br>保修状态: <font color=\\"green\\">在保</font><br>iCloud Lock: <font color=\\"red\\">ON</font><br>iCloud Status: <font color=\\"green\\">Clean</font><br>Demo Unit: <font color=\\"green\\">No</font><br>贷款设备 Device: <font color=\\"green\\">No</font><br>更换设备 Device: <font color=\\"green\\">No</font><br>Replacement Device: <font color=\\"green\\">No</font><br>Refurbished Device: <font color=\\"green\\">No</font><br>Purchase Country: China<br>运营商: 10 - Unlock.<br>Sim-Lock Status: <font color=\\"green\\">Unlocked</font><br>","debug":"","exec_time":6.273647,"user_ip":"223.254.128.13"}`,

  // 商品信息
  productInfo: `
    商品名称: <b>MacBook Pro 16寸</b><br>
    价格: <span style="color:red">19999</span><br>
    库存: <font color="green">有货</font><br>
    品牌: Apple<br>
    型号: M3 Max<br>
    内存: 32GB<br>
    存储: 1TB SSD<br>
    颜色: 深空灰色<br>
    保修: 1年<br>
    是否翻新: <font color="red">否</font>
  `,

  // 用户信息
  userInfo: `
    用户名: zhangsan
    姓名: 张三
    年龄: 28
    性别: 男
    邮箱: zhangsan@example.com
    电话: 13800138000
    地址: 北京市朝阳区xxx街道xxx号
    注册时间: 2024-01-15
    VIP等级: 黄金会员
    是否激活: 是
  `,

  // JSON格式数据
  jsonData: `{
    "id": 1001,
    "name": "iPad Pro",
    "price": 8999,
    "category": "平板电脑",
    "brand": "Apple",
    "inStock": true,
    "rating": 4.8,
    "reviews": 256
  }`,

  // 混合格式数据
  mixedData: `
    订单号: ORD-2024-001<br/>
    客户姓名: 李四<br/>
    商品: {"name": "iPhone 15", "price": 5999}<br/>
    数量: 2<br/>
    总价: 11998<br/>
    订单状态: <font color="green">已完成</font><br/>
    创建时间: 2024-01-20 10:30:00
  `
}

/**
 * 测试设备信息处理器
 */
export function testDeviceInfoProcessor() {
  console.log('🧪 测试设备信息处理器...')

  const processor = createDeviceInfoProcessor()

  try {
    const result = processor.processResponse(testSamples.deviceInfo)
    console.log('✅ 设备信息处理成功:', result)

    // 生成动态表格列
    const columns = processor.generateDynamicColumns([result])
    console.log('📊 生成的表格列:', columns)

    return result
  } catch (error) {
    console.error('❌ 设备信息处理失败:', error)
    throw error
  }
}

/**
 * 测试商品信息处理器
 */
export function testProductInfoProcessor() {
  console.log('🧪 测试商品信息处理器...')

  const config: GenericDataProcessorConfig = {
    fieldMapping: {
      '商品名称': 'productName',
      '价格': 'price',
      '库存': 'stock',
      '品牌': 'brand',
      '型号': 'model',
      '内存': 'memory',
      '存储': 'storage',
      '颜色': 'color',
      '保修': 'warranty',
      '是否翻新': 'isRefurbished'
    },
    fieldTypes: {
      productName: 'string',
      price: 'number',
      stock: 'string',
      brand: 'string',
      model: 'string',
      memory: 'string',
      storage: 'string',
      color: 'string',
      warranty: 'string',
      isRefurbished: 'boolean'
    },
    fieldTransformers: {
      price: (value: string) => {
        const num = parseFloat(value.replace(/[^\d.]/g, ''))
        return isNaN(num) ? 0 : num
      },
      stock: (value: string) => {
        return value.includes('有货') ? '✅ 有货' : value.includes('缺货') ? '❌ 缺货' : value
      }
    }
  }

  const processor = createGenericTextProcessor(config)

  try {
    const result = processor.processResponse(testSamples.productInfo)
    console.log('✅ 商品信息处理成功:', result)

    // 生成动态表格列
    const columns = processor.generateDynamicColumns([result])
    console.log('📊 生成的表格列:', columns)

    return result
  } catch (error) {
    console.error('❌ 商品信息处理失败:', error)
    throw error
  }
}

/**
 * 测试用户信息处理器
 */
export function testUserInfoProcessor() {
  console.log('🧪 测试用户信息处理器...')

  const config: GenericDataProcessorConfig = {
    fieldMapping: {
      '用户名': 'username',
      '姓名': 'fullName',
      '年龄': 'age',
      '性别': 'gender',
      '邮箱': 'email',
      '电话': 'phone',
      '地址': 'address',
      '注册时间': 'registerTime',
      'vip等级': 'vipLevel',
      '是否激活': 'isActive'
    },
    fieldTypes: {
      username: 'string',
      fullName: 'string',
      age: 'number',
      gender: 'string',
      email: 'string',
      phone: 'string',
      address: 'string',
      registerTime: 'date',
      vipLevel: 'string',
      isActive: 'boolean'
    },
    lineSeparators: ['\n', '<br>', '<br/>'],
    cleanHtml: true
  }

  const processor = createGenericTextProcessor(config)

  try {
    const result = processor.processResponse(testSamples.userInfo)
    console.log('✅ 用户信息处理成功:', result)

    return result
  } catch (error) {
    console.error('❌ 用户信息处理失败:', error)
    throw error
  }
}

/**
 * 测试JSON数据处理器
 */
export function testJsonProcessor() {
  console.log('🧪 测试JSON数据处理器...')

  const processor = createGenericTextProcessor()

  try {
    const result = processor.processResponse(testSamples.jsonData)
    console.log('✅ JSON数据处理成功:', result)

    return result
  } catch (error) {
    console.error('❌ JSON数据处理失败:', error)
    throw error
  }
}

/**
 * 测试混合格式数据处理器
 */
export function testMixedDataProcessor() {
  console.log('🧪 测试混合格式数据处理器...')

  const config: GenericDataProcessorConfig = {
    fieldMapping: {
      '订单号': 'orderId',
      '客户姓名': 'customerName',
      '商品': 'product',
      '数量': 'quantity',
      '总价': 'totalPrice',
      '订单状态': 'status',
      '创建时间': 'createTime'
    },
    fieldTypes: {
      orderId: 'string',
      customerName: 'string',
      product: 'string',
      quantity: 'number',
      totalPrice: 'number',
      status: 'string',
      createTime: 'date'
    },
    fieldTransformers: {
      status: (value: string) => {
        if (value.includes('已完成')) return '✅ 已完成'
        if (value.includes('进行中')) return '🔄 进行中'
        if (value.includes('已取消')) return '❌ 已取消'
        return value
      }
    }
  }

  const processor = createGenericTextProcessor(config)

  try {
    const result = processor.processResponse(testSamples.mixedData)
    console.log('✅ 混合格式数据处理成功:', result)

    return result
  } catch (error) {
    console.error('❌ 混合格式数据处理失败:', error)
    throw error
  }
}

/**
 * 测试批量处理功能
 */
export function testBatchProcessing() {
  console.log('🧪 测试批量处理功能...')

  const processor = createDeviceInfoProcessor()
  const responses = [testSamples.deviceInfo] // 可以添加更多测试数据

  try {
    const results = processor.processBatchResponses(responses)
    console.log('✅ 批量处理成功:', results)

    // 生成动态表格列
    if (results.length > 0) {
      const columns = processor.generateDynamicColumns(results)
      console.log('📊 批量数据的动态表格列:', columns)
    }

    return results
  } catch (error) {
    console.error('❌ 批量处理失败:', error)
    throw error
  }
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  console.log('🚀 开始运行所有通用数据处理器测试...')
  console.log('='.repeat(50))

  const results: any = {}

  try {
    // 测试设备信息处理
    results.deviceInfo = testDeviceInfoProcessor()
    console.log('')

    // 测试商品信息处理
    results.productInfo = testProductInfoProcessor()
    console.log('')

    // 测试用户信息处理
    results.userInfo = testUserInfoProcessor()
    console.log('')

    // 测试JSON数据处理
    results.jsonData = testJsonProcessor()
    console.log('')

    // 测试混合格式数据处理
    results.mixedData = testMixedDataProcessor()
    console.log('')

    // 测试批量处理
    results.batchProcessing = testBatchProcessing()
    console.log('')

    console.log('🎉 所有测试完成！')
    console.log('测试结果汇总:', results)

    return results

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error)
    throw error
  }
}

// 在开发环境中暴露测试方法到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testDeviceInfoProcessor = testDeviceInfoProcessor;
  (window as any).testProductInfoProcessor = testProductInfoProcessor;
  (window as any).testUserInfoProcessor = testUserInfoProcessor;
  (window as any).testJsonProcessor = testJsonProcessor;
  (window as any).testMixedDataProcessor = testMixedDataProcessor;
  (window as any).testBatchProcessing = testBatchProcessing;
  (window as any).runAllTests = runAllTests;

  console.log('🧪 通用数据处理器测试方法已加载到全局对象:')
  console.log('  - testDeviceInfoProcessor() - 测试设备信息处理')
  console.log('  - testProductInfoProcessor() - 测试商品信息处理')
  console.log('  - testUserInfoProcessor() - 测试用户信息处理')
  console.log('  - testJsonProcessor() - 测试JSON数据处理')
  console.log('  - testMixedDataProcessor() - 测试混合格式处理')
  console.log('  - testBatchProcessing() - 测试批量处理')
  console.log('  - runAllTests() - 运行所有测试')
} 