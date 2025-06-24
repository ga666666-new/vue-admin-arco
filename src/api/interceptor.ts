import { useUserStore } from '@/store'
import { getToken } from '@/utils/auth'
import { Message, Modal } from '@arco-design/web-vue'
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

export interface HttpResponse<T = unknown> {
  status: number
  msg: string
  code: number
  data: T
}

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
}

// Function to extract and parse JSON from response
function extractJsonFromResponse(responseData: string): any {
  const jsonMatch = responseData.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error('解析JSON时出错:', error)
      throw new Error('解析JSON时出错')
    }
  }
  throw new Error('未找到JSON数据')
}

// Request interceptor
axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axios.interceptors.response.use(
  (response: AxiosResponse) => {
    let res = response.data

    // Extract and parse JSON if necessary
    if (typeof res === 'string') {
      res = extractJsonFromResponse(res)
    }

    // Check for custom error codes
    if (res.code !== 200) {
      console.log(res)
      Message.error({
        content: res.msg || 'Error',
        duration: 5 * 1000,
      })

      // Handle specific error codes
      if ([50008, 50012, 50014].includes(res.code) && response.config.url !== '/api/user/info') {
        Modal.error({
          title: 'Confirm logout',
          content: 'You have been logged out, you can cancel to stay on this page, or log in again',
          okText: 'Re-Login',
          async onOk() {
            const userStore = useUserStore()
            await userStore.logout()
            window.location.reload()
          },
        })
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res
  },
  (error: AxiosError) => {
    Message.error({
      content: error.message || 'Request Error',
      duration: 5 * 1000,
    })
    return Promise.reject(error)
  }
)
