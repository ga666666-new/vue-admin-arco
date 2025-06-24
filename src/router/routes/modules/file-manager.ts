import { DEFAULT_LAYOUT } from '../base'
import { AppRouteRecordRaw } from '../types'

const FILE_MANAGER: AppRouteRecordRaw = {
  path: '/file-manager',
  name: 'file-manager',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.fileManager',
    requiresAuth: true,
    icon: 'icon-folder',
    order: 1,
  },
  children: [
    {
      path: 'import',
      name: 'FileImport',
      component: () => import('@/views/file-manager/index.vue'),
      meta: {
        locale: 'menu.fileManager.upload',
        requiresAuth: true,
        roles: ['*'],
      },
    },
  ],
}

export default FILE_MANAGER 