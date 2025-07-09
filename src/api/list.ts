import { withCache } from '@/utils/cache'
import type { DescData } from '@arco-design/web-vue/es/descriptions/interface'
import axios from 'axios'
import qs from 'query-string'


export interface ServiceRecord {
  id: number
  title: string
  description: string
  name?: string
  actionType?: string
  icon?: string
  data?: DescData[]
  enable?: boolean
  expires?: boolean
}
export interface ServiceResponse {
  code: number
  msg: string
  data: {
    type_id: string
    type_name: string
    api_list: ServiceRecord[]
  }
  total: number
}

export interface PolicyRecord {
  id: string
  number: number
  name: string
  contentType: 'img' | 'horizontalVideo' | 'verticalVideo'
  filterType: 'artificial' | 'rules'
  count: number
  status: 'online' | 'offline'
  createdTime: string
}

export interface PolicyParams extends Partial<PolicyRecord> {
  current: number
  pageSize: number
}

export interface PolicyListRes {
  list: PolicyRecord[]
  total: number
}

export function queryPolicyList(params: PolicyParams) {
  return axios.get<PolicyListRes>('/api/list/policy', {
    params,
    paramsSerializer: (obj) => {
      return qs.stringify(obj)
    },
  })
}

export function queryInspectionList() {
  return axios.get('/api/list/quality-inspection')
}

export function queryTheServiceList() {
  return axios.get('/api/list/the-service')
}

export function queryRulesPresetList() {
  return axios.get('/api/list/rules-preset')
}

// 原始queryService函数
function _queryService(key: string | undefined | null) {
  // return axios.get(`https://imei.top/software/service?key=${apikey}`).then(res => res.data)
  return axios.get(key ? `http://223.254.128.13:4000/software/service?key=${key}` : `http://223.254.128.13:4000/software/service`).then(res => res.data)
}

// 带缓存的queryService函数
export const queryService = withCache(_queryService, (key: string | undefined | null) => key)


export function submitOrder(imei: string, key: string, sid: string, lang: string) {
  return axios.get(`http://223.254.128.13:4000/software/instant?client=4&key=${key}&sid=${sid}&imei=${imei}&lang=${lang}`).then(res => res.data)
}
