<template>
  <div class="login-form-wrapper">
    <div class="login-form-title">{{ $t('login.form.title') }}</div>
    <div class="login-form-sub-title">Apple Assistant 智能管理平台</div>
    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
    <a-form ref="loginForm" :model="userInfo" class="login-form" layout="vertical" @submit="handleSubmit">
      <a-form-item field="key" :rules="[{ required: true, message: $t('login.form.token.errMsg') }]"
        :validate-trigger="['change', 'blur']" hide-label>
        <a-input-password v-model="userInfo.key" :placeholder="$t('login.form.key.placeholder')" allow-clear>
          <template #prefix>
            <icon-lock />
          </template>
        </a-input-password>
      </a-form-item>
      <a-space :size="16" direction="vertical">
        <div class="login-form-password-actions">
          <a-checkbox checked="rememberPassword" :model-value="loginConfig.rememberPassword"
            @change="setRememberPassword as any">
            {{ $t('login.form.key') }}
          </a-checkbox>
          <!-- <a-link>{{ $t('login.form.forgetPassword') }}</a-link> -->
        </div>
        <a-button type="primary" html-type="submit" long :loading="loading">
          {{ $t('login.form.login') }}
        </a-button>
        <!-- <a-button type="text" long class="login-form-register-btn">
          {{ $t('login.form.register') }}
        </a-button> -->
      </a-space>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import type { LoginData } from '@/api/user'
import useLoading from '@/hooks/loading'
import { useUserStore } from '@/store'
import { getToken } from '@/utils/auth'
import { Message } from '@arco-design/web-vue'
import { ValidatedError } from '@arco-design/web-vue/es/form/interface'
import { useStorage } from '@vueuse/core'
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { t } = useI18n()
const errorMessage = ref('')
const { loading, setLoading } = useLoading()
const userStore = useUserStore()

const loginConfig = useStorage('login-config', {
  rememberPassword: true,
  username: 'admin', // 演示默认值
  password: 'admin', // demo default value
  key: ''
})
const userInfo = reactive({
  username: loginConfig.value.username,
  password: loginConfig.value.password,
  key: getToken(),
})

const handleSubmit = async ({ errors, values }: { errors: Record<string, ValidatedError> | undefined; values: Record<string, any> }) => {
  if (loading.value) return
  if (!errors) {
    setLoading(true)
    try {
      await userStore.login(values as LoginData)
      const { redirect, ...othersQuery } = router.currentRoute.value.query
      router.push({
        name: (redirect as string) || 'Index',
        query: {
          ...othersQuery,
        },
      })
      Message.success(t('login.form.login.success'))
      const { rememberPassword } = loginConfig.value
      const { username, password } = values
      // 实际生产环境需要进行加密存储。
      // The actual production environment requires encrypted storage.
      loginConfig.value.username = rememberPassword ? username : ''
      loginConfig.value.password = rememberPassword ? password : ''
    } catch (err) {
      errorMessage.value = (err as Error).message
    } finally {
      setLoading(false)
    }
  }
}
const setRememberPassword = (value: boolean) => {
  loginConfig.value.rememberPassword = value
}
</script>

<style lang="less" scoped>
.login-form {
  &-wrapper {
    width: 320px;
    padding: 20px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(15px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
  }

  &-title {
    color: #1a1a1a;
    font-weight: 600;
    font-size: 28px;
    line-height: 36px;
    margin-bottom: 8px;
    text-align: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &-sub-title {
    color: #666;
    font-size: 16px;
    line-height: 24px;
    text-align: center;
    margin-bottom: 24px;
  }

  &-error-msg {
    height: 32px;
    color: #ff4d4f;
    line-height: 32px;
    text-align: center;
    font-size: 14px;
    background: rgba(255, 77, 79, 0.1);
    border-radius: 8px;
    padding: 0 12px;
    margin-bottom: 16px;
  }

  &-password-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &-register-btn {
    color: var(--color-text-3) !important;
  }

  // 输入框样式优化
  :deep(.arco-input-wrapper) {
    border-radius: 12px;
    border: 2px solid rgba(102, 126, 234, 0.2);
    background: rgba(255, 255, 255, 0.9);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: rgba(102, 126, 234, 0.4);
      background: rgba(255, 255, 255, 1);
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    &.arco-input-focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1),
        0 2px 12px rgba(102, 126, 234, 0.15);
      background: rgba(255, 255, 255, 1);
    }
  }

  // 按钮样式优化
  :deep(.arco-btn-primary) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 12px;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent);
      transition: left 0.5s ease;
    }

    &:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(102, 126, 234, 0.4);

      &::before {
        left: 100%;
      }
    }

    &:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }
  }

  // 复选框样式优化
  :deep(.arco-checkbox) {
    .arco-checkbox-icon {
      border-radius: 6px;
      border-color: rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .arco-checkbox-icon-checked {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    &:hover .arco-checkbox-icon {
      border-color: rgba(102, 126, 234, 0.5);
    }
  }

  // 表单项间距优化
  :deep(.arco-form-item) {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  // 图标颜色优化
  :deep(.arco-icon) {
    color: #667eea;
    transition: color 0.3s ease;
  }

  // 表单标题优化
  .login-form-title {
    color: #2c3e50;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .login-form-sub-title {
    color: #6c757d;
    font-weight: 400;
    margin-bottom: 24px;
    text-align: center;
    font-size: 14px;
  }

  .error-message {
    color: #f5576c;
    background: rgba(245, 87, 108, 0.1);
    border: 1px solid rgba(245, 87, 108, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
    font-size: 14px;
    text-align: center;
    animation: slideIn 0.3s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
