import { queryService } from '@/api/list';
import { DEFAULT_LAYOUT } from '../base';
import { AppRouteRecordRaw } from '../types';

const children = async (): Promise<AppRouteRecordRaw[]> => {
  const data = await queryService(null);
  const list = data.data;
  // 动态生成路由
  const res = list.map((item: { type_id: string | number }, index: number) => ({
    path: `search-table?${item.type_id}`, // 动态路由，如 search-table/1
    name: `${item.type_id}`, // 确保 name 唯一
    component: () => import('@/views/list/search-table/index.vue'),
    meta: {
      locale: `menu.list.${item.type_id}`,
      requiresAuth: true,
      roles: ['*'],
      // 可选：将 id 存入 meta，便于组件内访问
      id: item.type_id,
    },
  }));


  res.push({
    path: `/result`, // 动态路由，如 search-table/1
    name: `Result`, // 确保 name 唯一
    component: () => import('@/views/list/search-table/result.vue'),
    meta: {
      locale: `menu.list.result`,
      requiresAuth: true,
      roles: ['*'],
      hideInMenu: true
    },
  })

  return res;
};


const LIST: AppRouteRecordRaw = {
  path: '/list',
  name: 'list',
  component: DEFAULT_LAYOUT,
  meta: {
    locale: 'menu.list',
    requiresAuth: true,
    icon: 'icon-list',
    order: 2,
  },
  children: await children()
}

export default LIST
