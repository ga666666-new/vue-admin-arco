import { LoginData, getUserInfo, login as userLogin, logout as userLogout } from '@/api/user'
import { clearToken, setToken } from '@/utils/auth'
import { removeRouteListener } from '@/utils/route-listener'
import { defineStore } from 'pinia'
import useAppStore from '../app'
import { ResultState } from './types'

const resultStore = defineStore('result', {
  state: (): ResultState => ({
    name: undefined,
    avatar: undefined,
    job: undefined,
    organization: undefined,
    location: undefined,
    email: undefined,
    introduction: undefined,
    personalWebsite: undefined,
    jobName: undefined,
    organizationName: undefined,
    locationName: undefined,
    phone: undefined,
    registrationDate: undefined,
    accountId: undefined,
    certification: undefined,
    id: undefined,
    group: undefined,
    password: undefined,
    apikey: undefined,
    apikey_check_type: undefined,
    apikey_check_domain: undefined,
    apikey_check_ip: undefined,
    apikey_check_sk: undefined,
    vip_type: undefined,
    vip_start_time: undefined,
    vip_end_time: undefined,
    ip: undefined,
    time: undefined,
    openid: undefined,
    qqname: undefined,
    img: undefined,
    used: undefined,
    day_used: undefined,
    freeze: undefined,
    total: undefined,
    settle_money: undefined,
    auth_idcard: undefined,
    auth: undefined,
    auth_name: undefined,
    currency: undefined,
    wx_openid: undefined,
    pid: undefined,
    invite: undefined,
    user_package_id: undefined,
    open_server: undefined,
    telegram_id: undefined,
    email_notice: undefined,
    chat_user: undefined,
    chat_password: undefined,
    email_verify: undefined
  }),

  getters: {
    resultInfo(state: ResultState): ResultState {
      return { ...state }
    },
  },

  actions: {
    // Set user's information
    setInfo(partial: Partial<ResultState>) {
      this.$patch(partial)
    },

    // Reset user's information
    resetInfo() {
      this.$reset()
    }
  },
})

export default resultStore
