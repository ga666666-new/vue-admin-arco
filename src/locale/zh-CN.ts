import localeMessageBox from '@/components/message-box/locale/zh-CN'
import localeLogin from '@/views/login/locale/zh-CN'

import localeWorkplace from '@/views/dashboard/workplace/locale/zh-CN'
/** simple */
import localeMonitor from '@/views/dashboard/monitor/locale/zh-CN'

import localeCardList from '@/views/list/card/locale/zh-CN'
import localeSearchTable from '@/views/list/search-table/locale/zh-CN'

import localeGroupForm from '@/views/form/group/locale/zh-CN'
import localeStepForm from '@/views/form/step/locale/zh-CN'

import localeBasicProfile from '@/views/profile/basic/locale/zh-CN'

import localeDataAnalysis from '@/views/visualization/data-analysis/locale/zh-CN'
import localeMultiDAnalysis from '@/views/visualization/multi-dimension-data-analysis/locale/zh-CN'

import localeError from '@/views/result/error/locale/zh-CN'
import localeSuccess from '@/views/result/success/locale/zh-CN'

import locale403 from '@/views/exception/403/locale/zh-CN'
import locale404 from '@/views/exception/404/locale/zh-CN'
import locale500 from '@/views/exception/500/locale/zh-CN'

import localeUserInfo from '@/views/user/info/locale/zh-CN'
import localeUserSetting from '@/views/user/setting/locale/zh-CN'
/** simple end */
import localeSettings from './zh-CN/settings'

// 文件管理本地化
const localeFileManager = {
  // 文件导入相关
  'fileManager.upload.title': '文件导入',
  'fileManager.upload.desktopTip': '文件将保存到应用程序数据目录，可重复使用。支持拖拽导入或点击选择。',
  'fileManager.upload.dragTip': '拖拽文件到此处，或点击选择文件',
  'fileManager.upload.fileLimit': '支持 .txt, .csv 文件，单个文件最大 100MB',
  'fileManager.upload.currentFiles': '当前导入文件',
  'fileManager.upload.totalLines': '总行数',
  'fileManager.upload.validLines': '有效行数',
  'fileManager.upload.preview': '预览',
  'fileManager.upload.delete': '删除',
  'fileManager.upload.uploading': '正在处理...',
  'fileManager.upload.uploadSuccess': '处理成功',
  'fileManager.upload.uploadFailed': '处理失败',
  'fileManager.upload.retry': '重试',
  'fileManager.upload.saveName': '数据集名称',
  'fileManager.upload.saveNameRequired': '请输入数据集名称',
  'fileManager.upload.saveNamePlaceholder': '输入数据集名称',
  'fileManager.upload.description': '描述',
  'fileManager.upload.descriptionPlaceholder': '输入描述信息（可选）',
  'fileManager.upload.mergeInfo': '将合并 {count} 个文件的数据，自动去重后保存',
  'fileManager.upload.save': '保存到本地',
  'fileManager.upload.clear': '清空',
  'fileManager.upload.saveSuccess': '保存到本地成功',
  'fileManager.upload.saveError': '保存失败',

  // 已保存数据集相关
  'fileManager.saved.title': '已保存数据集',
  'fileManager.saved.empty': '暂无已保存的数据集',
  'fileManager.saved.refresh': '刷新',
  'fileManager.saved.totalLines': '总行数',
  'fileManager.saved.createdAt': '创建时间',
  'fileManager.saved.description': '描述',
  'fileManager.saved.preview': '预览',
  'fileManager.saved.edit': '编辑',
  'fileManager.saved.delete': '删除',
  'fileManager.saved.deleteSuccess': '删除成功',
  'fileManager.saved.append': '追加',
  'fileManager.saved.appendSuccess': '追加成功：向 {fileName} 添加了 {added} 行数据，总计 {total} 行',
  'fileManager.saved.appendResult': '追加完成：向 {fileName} 添加了 {added} 行数据，其中 {duplicate} 行重复，总计 {total} 行',
  'fileManager.saved.appendError': '追加失败',

  // 预览相关
  'fileManager.preview.title': '文件预览',
  'fileManager.preview.close': '关闭',

  // 编辑相关
  'fileManager.edit.title': '编辑数据集信息',
  'fileManager.edit.name': '名称',
  'fileManager.edit.nameRequired': '请输入数据集名称',
  'fileManager.edit.description': '描述',
  'fileManager.edit.updateSuccess': '更新成功',
}

export default {
  'menu.dashboard': '仪表盘',
  'menu.server.dashboard': '仪表盘-服务端',
  'menu.server.workplace': '工作台-服务端',
  'menu.server.monitor': '实时监控-服务端',
  'menu.fileManager': '文件管理',
  'menu.fileManager.upload': '文件导入',
  'menu.list': '查询服务',
  'menu.result': '首页',
  'menu.exception': '异常页',
  'menu.form': '表单页',
  'menu.profile': '详情页',
  'menu.visualization': '数据可视化',
  'menu.user': '个人中心',
  'menu.arcoWebsite': 'Arco Design',
  'menu.faq': '常见问题',
  'navbar.docs': '文档中心',
  'navbar.action.locale': '切换为中文',
  ...localeSettings,
  ...localeMessageBox,
  ...localeLogin,
  ...localeWorkplace,
  /** simple */
  ...localeMonitor,
  ...localeSearchTable,
  ...localeCardList,
  ...localeStepForm,
  ...localeGroupForm,
  ...localeBasicProfile,
  ...localeDataAnalysis,
  ...localeMultiDAnalysis,
  ...localeSuccess,
  ...localeError,
  ...locale403,
  ...locale404,
  ...locale500,
  ...localeUserInfo,
  ...localeUserSetting,
  /** simple end */
  ...localeFileManager,
}
