import { UserState } from '@/store/modules/user/types'
import axios from 'axios'
import type { RouteRecordNormalized } from 'vue-router'

export interface LoginData {
  key: string
}

export interface LoginRes {
  token: string
}
export function login(data: LoginData) {
  // return axios.get(`https://imei.top/software/user?key=${data.key}`)
  return axios.get(`http://223.254.128.13:4000/software/user?key=${data.key}`)
}

export function logout() {
  return axios.post<LoginRes>('/api/user/logout')
}

export function getUserInfo() {
  return axios.post<UserState>('/api/user/info')
}

export function getMenuList() {
  return axios.post<RouteRecordNormalized[]>('/api/user/menu')
}
