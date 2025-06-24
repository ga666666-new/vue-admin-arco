// 简单键值对提取器测试文件
import {
  extractBatchKeyValuePairs,
  extractKeyValuePairs,
  generateSimpleTableColumns
} from './data-processor'

/**
 * 测试用户提供的真实数据
 */
export function testUserRealData() {
  console.log('🔥 测试用户提供的真实数据...')

  // 用户测试数据1: Wrong_Imei 错误情况
  const wrongImeiData = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"Wrong_Imei","debug":"","exec_time":0.336041,"user_ip":"223.254.128.13"}`

  // 用户测试数据2: 设备信息
  const deviceInfoData = `<br />
<b>Notice</b>:  Undefined index: lang in <b>/www/wwwroot/imei.top/software/instant.php</b> on line <b>11</b><br />
{"code":200,"msg":"查询成功","data":"序列号: JVWQFJXN4K<br>设备型号: iPhone 16 Pro Max<br>激活状态: 已激活<br>空中激活: 否<br>保修状态: 有限保修<br>剩余保修: 324天<br>购买日期: 2025-05<br>激活日期: 2025-05-15<br>保修到期: 2026-05-14<br>注销设备: 否<br>AC+保障: 否<br>是否资源机: 否<br>AC+购买资格: 可直营店购买<br>购买日期验证: 已验证<br>设备图片: https://cdsassets.apple.com/content/services/pub/image?productid=301048&size=240x240","debug":"","exec_time":4.59001,"user_ip":"223.254.128.13"}`

  console.log('\n==========================================')
  console.log('🧪 测试1: Wrong_Imei 错误情况')
  console.log('==========================================')

  try {
    const result1 = extractKeyValuePairs(wrongImeiData)
    console.log('✅ 提取结果:', result1)

    // 验证关键字段
    console.log('\n🔍 关键字段验证:')
    console.log('- 错误状态:', result1['错误'])
    console.log('- 查询状态:', result1['状态'])

  } catch (error) {
    console.error('❌ 测试1失败:', error)
  }

  console.log('\n==========================================')
  console.log('🧪 测试2: 设备信息提取')
  console.log('==========================================')

  try {
    const result2 = extractKeyValuePairs(deviceInfoData)
    console.log('✅ 提取结果:', result2)

    // 验证关键字段
    console.log('\n🔍 关键字段验证:')
    console.log('- 序列号:', result2['序列号'])
    console.log('- 设备型号:', result2['设备型号'])
    console.log('- 保修状态:', result2['保修状态'])
    console.log('- 剩余保修:', result2['剩余保修'])
    console.log('- 激活状态:', result2['激活状态'])
    console.log('- 购买日期:', result2['购买日期'])
    console.log('- 设备图片:', result2['设备图片'])

    // 计算提取到的字段数量
    const fieldCount = Object.keys(result2).length
    console.log(`\n📊 总共提取到 ${fieldCount} 个字段`)

  } catch (error) {
    console.error('❌ 测试2失败:', error)
  }

  console.log('\n==========================================')
  console.log('🧪 测试3: 批量处理')
  console.log('==========================================')

  try {
    const batchResults = extractBatchKeyValuePairs([wrongImeiData, deviceInfoData])
    console.log('✅ 批量处理结果:', batchResults)

    console.log('\n📈 批量处理统计:')
    console.log(`- 总处理数量: ${batchResults.length}`)
    console.log(`- 第1条记录字段数: ${Object.keys(batchResults[0]).length}`)
    console.log(`- 第2条记录字段数: ${Object.keys(batchResults[1]).length}`)

  } catch (error) {
    console.error('❌ 测试3失败:', error)
  }

  console.log('\n==========================================')
  console.log('🧪 测试4: 表格列生成')
  console.log('==========================================')

  try {
    const sampleData = [extractKeyValuePairs(deviceInfoData)]
    const columns = generateSimpleTableColumns(sampleData)

    console.log('✅ 生成的表格列配置:')
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.title} (${col.dataIndex}) - 宽度:${col.width}px`)
    })

    console.log(`\n📊 总共生成 ${columns.length} 列`)

  } catch (error) {
    console.error('❌ 测试4失败:', error)
  }

  console.log('\n🎉 用户真实数据测试完成！')
}

/**
 * 演示各种数据格式处理
 */
export function demonstrateDataFormats() {
  console.log('🎯 演示各种数据格式处理...')

  const testCases = [
    {
      name: '纯键值对格式',
      data: `
        姓名: 张三
        年龄: 28
        职业: 工程师
        邮箱: zhangsan@example.com
      `
    },
    {
      name: 'HTML标签格式',
      data: `
        商品名称: <b>MacBook Pro</b><br>
        价格: <span style="color:red">19999</span><br>
        库存状态: <font color="green">有货</font><br>
        评分: ⭐⭐⭐⭐⭐
      `
    },
    {
      name: 'JSON嵌套格式',
      data: `{"status": "success", "data": "用户名: admin<br>角色: 管理员<br>权限: 全部<br>最后登录: 2024-01-20"}`
    },
    {
      name: '混合分隔符格式',
      data: `
        项目名称: Vue管理系统
        开发语言: TypeScript|JavaScript
        框架版本: Vue 3.0<br/>
        UI组件: ArcoDesign
        构建工具: Vite
      `
    }
  ]

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 测试案例 ${index + 1}: ${testCase.name}`)
    console.log('原始数据:', testCase.data)

    try {
      const result = extractKeyValuePairs(testCase.data)
      console.log('✅ 提取结果:', result)
      console.log(`📊 提取字段数: ${Object.keys(result).length}`)
    } catch (error) {
      console.error(`❌ ${testCase.name} 处理失败:`, error)
    }
  })
}

/**
 * 性能测试
 */
export function performanceTest() {
  console.log('⚡ 性能测试...')

  // 生成大量测试数据
  const largeData = Array.from({ length: 1000 }, (_, i) => `
    记录ID: ${i + 1}
    用户名: user_${i + 1}
    状态: ${i % 2 === 0 ? '活跃' : '非活跃'}
    创建时间: 2024-01-${String(i % 28 + 1).padStart(2, '0')}
    积分: ${Math.floor(Math.random() * 10000)}
  `)

  console.log(`📊 准备处理 ${largeData.length} 条记录...`)

  const startTime = performance.now()

  try {
    const results = extractBatchKeyValuePairs(largeData)
    const endTime = performance.now()

    console.log('✅ 性能测试完成!')
    console.log(`⏱️  处理时间: ${(endTime - startTime).toFixed(2)}ms`)
    console.log(`📈 处理速度: ${(largeData.length / (endTime - startTime) * 1000).toFixed(2)} 条/秒`)
    console.log(`✨ 成功处理: ${results.length} 条记录`)

    if (results.length > 0) {
      console.log(`🔍 样本记录字段数: ${Object.keys(results[0]).length}`)
    }

  } catch (error) {
    console.error('❌ 性能测试失败:', error)
  }
}

/**
 * 运行所有测试
 */
export function runAllSimpleTests() {
  console.log('🚀 开始运行简单键值对提取器所有测试...')
  console.log('='.repeat(60))

  try {
    // 1. 用户真实数据测试
    testUserRealData()

    console.log('\n' + '='.repeat(60))

    // 2. 各种数据格式演示
    demonstrateDataFormats()

    console.log('\n' + '='.repeat(60))

    // 3. 性能测试
    performanceTest()

    console.log('\n' + '='.repeat(60))
    console.log('🎉 所有测试完成！')

  } catch (error) {
    console.error('❌ 测试套件执行失败:', error)
  }
}

// 在开发环境中暴露测试方法到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testUserRealData = testUserRealData;
  (window as any).demonstrateDataFormats = demonstrateDataFormats;
  (window as any).performanceTest = performanceTest;
  (window as any).runAllSimpleTests = runAllSimpleTests;

  console.log('🧪 简单键值对提取器测试方法已加载:')
  console.log('  - testUserRealData() - 测试用户真实数据')
  console.log('  - demonstrateDataFormats() - 演示各种数据格式')
  console.log('  - performanceTest() - 性能测试')
  console.log('  - runAllSimpleTests() - 运行所有测试')
} 