import localeMessageBox from '@/components/message-box/locale/en-US'
import localeLogin from '@/views/login/locale/en-US'

import localeWorkplace from '@/views/dashboard/workplace/locale/en-US'
/** simple */
import localeMonitor from '@/views/dashboard/monitor/locale/en-US'

import localeCardList from '@/views/list/card/locale/en-US'
import localeSearchTable from '@/views/list/search-table/locale/en-US'

import localeGroupForm from '@/views/form/group/locale/en-US'
import localeStepForm from '@/views/form/step/locale/en-US'

import localeBasicProfile from '@/views/profile/basic/locale/en-US'

import localeDataAnalysis from '@/views/visualization/data-analysis/locale/en-US'
import localeMultiDAnalysis from '@/views/visualization/multi-dimension-data-analysis/locale/en-US'

import localeError from '@/views/result/error/locale/en-US'
import localeSuccess from '@/views/result/success/locale/en-US'

import locale403 from '@/views/exception/403/locale/en-US'
import locale404 from '@/views/exception/404/locale/en-US'
import locale500 from '@/views/exception/500/locale/en-US'

import localeUserInfo from '@/views/user/info/locale/en-US'
import localeUserSetting from '@/views/user/setting/locale/en-US'
/** simple end */
import localeSettings from './en-US/settings'

// File Manager Localization
const localeFileManager = {
  // File Import related
  'fileManager.upload.title': 'File Import',
  'fileManager.upload.desktopTip': 'Files will be saved to application data directory for reuse. Support drag & drop or click to select.',
  'fileManager.upload.dragTip': 'Drag files here, or click to select files',
  'fileManager.upload.fileLimit': 'Support .txt, .csv files, max 100MB per file',
  'fileManager.upload.currentFiles': 'Current Import Files',
  'fileManager.upload.totalLines': 'Total Lines',
  'fileManager.upload.validLines': 'Valid Lines',
  'fileManager.upload.preview': 'Preview',
  'fileManager.upload.delete': 'Delete',
  'fileManager.upload.uploading': 'Processing...',
  'fileManager.upload.uploadSuccess': 'Process Successful',
  'fileManager.upload.uploadFailed': 'Process Failed',
  'fileManager.upload.retry': 'Retry',
  'fileManager.upload.saveName': 'Dataset Name',
  'fileManager.upload.saveNameRequired': 'Please enter dataset name',
  'fileManager.upload.saveNamePlaceholder': 'Enter dataset name',
  'fileManager.upload.description': 'Description',
  'fileManager.upload.descriptionPlaceholder': 'Enter description (optional)',
  'fileManager.upload.mergeInfo': 'Will merge data from {count} files, automatically deduplicated before saving',
  'fileManager.upload.save': 'Save to Local',
  'fileManager.upload.clear': 'Clear',
  'fileManager.upload.saveSuccess': 'Save to Local Successful',
  'fileManager.upload.saveError': 'Save Failed',

  // Saved datasets related
  'fileManager.saved.title': 'Saved Datasets',
  'fileManager.saved.empty': 'No saved datasets yet',
  'fileManager.saved.refresh': 'Refresh',
  'fileManager.saved.totalLines': 'Total Lines',
  'fileManager.saved.createdAt': 'Created At',
  'fileManager.saved.description': 'Description',
  'fileManager.saved.preview': 'Preview',
  'fileManager.saved.edit': 'Edit',
  'fileManager.saved.delete': 'Delete',
  'fileManager.saved.deleteSuccess': 'Delete Successful',
  'fileManager.saved.append': 'Append',
  'fileManager.saved.appendSuccess': 'Append successful: Added {added} lines to {fileName}, total {total} lines',
  'fileManager.saved.appendResult': 'Append completed: Added {added} lines to {fileName}, {duplicate} duplicates, total {total} lines',
  'fileManager.saved.appendError': 'Append failed',

  // Preview related
  'fileManager.preview.title': 'File Preview',
  'fileManager.preview.close': 'Close',

  // Edit related
  'fileManager.edit.title': 'Edit Dataset Information',
  'fileManager.edit.name': 'Name',
  'fileManager.edit.nameRequired': 'Please enter dataset name',
  'fileManager.edit.description': 'Description',
  'fileManager.edit.updateSuccess': 'Update Successful',
}

export default {
  'menu.dashboard': 'Dashboard',
  'menu.server.dashboard': 'Dashboard-Server',
  'menu.server.workplace': 'Workplace-Server',
  'menu.server.monitor': 'Monitor-Server',
  'menu.fileManager': 'File Manager',
  'menu.fileManager.upload': 'File Import',
  'menu.list': 'List',
  'menu.result': 'Index',
  'menu.exception': 'Exception',
  'menu.form': 'Form',
  'menu.profile': 'Profile',
  'menu.visualization': 'Data Visualization',
  'menu.user': 'User Center',
  'menu.arcoWebsite': 'Arco Design',
  'menu.faq': 'FAQ',
  'navbar.docs': 'Docs',
  'navbar.action.locale': 'Switch to English',
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
