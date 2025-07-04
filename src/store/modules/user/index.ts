import { LoginData, getUserInfo, login as userLogin, logout as userLogout } from '@/api/user'
import { clearToken, setToken } from '@/utils/auth'
import { removeRouteListener } from '@/utils/route-listener'
import { defineStore } from 'pinia'
import useAppStore from '../app'
import { UserState } from './types'

const useUserStore = defineStore('user', {
  state: (): UserState => ({
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
    role: '',
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
    userInfo(state: UserState): UserState {
      return { ...state }
    },
  },

  actions: {
    switchRoles() {
      return new Promise((resolve) => {
        this.role = this.role === 'user' ? 'admin' : 'user'
        resolve(this.role)
      })
    },
    // Set user's information
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial)
    },

    // Reset user's information
    resetInfo() {
      this.$reset()
    },

    // Get user's information
    async info() {
      const res = await getUserInfo()

      this.setInfo(res.data)
    },

    // Login
    async login(loginForm: LoginData) {
      try {
        const res = await userLogin(loginForm)
        setToken(res.data.apikey)
        this.setInfo(res.data)
        console.log(res.data);

      } catch (err) {
        clearToken()
        throw err
      }
    },
    logoutCallBack() {
      const appStore = useAppStore()
      this.resetInfo()
      clearToken()
      removeRouteListener()
      appStore.clearServerMenu()
    },
    // Logout
    async logout() {
      try {
        await userLogout()
      } finally {
        this.logoutCallBack()
      }
    },
  },
})

export default useUserStore
