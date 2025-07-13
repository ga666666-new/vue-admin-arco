<template>
  <div class="login-container">
    <!-- 缓冲页面 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-logo">
          <img alt="logo" src="https://imei.top/favicon.ico" />
          <div class="logo-text">Apple Assistant</div>
        </div>
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <div class="loading-text">{{ $t('login.loading.text') }}</div>
      </div>
    </div>

    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
      <div class="bg-triangle bg-triangle-1"></div>
      <div class="bg-triangle bg-triangle-2"></div>
      <div class="bg-square bg-square-1"></div>
      <div class="bg-gradient"></div>
    </div>

    <div class="container">
      <div class="logo">
        <img alt="logo" src="https://imei.top/favicon.ico" />
        <div class="logo-text">Apple Assistant</div>
      </div>
      <LoginBanner />
      <div class="content">
        <div class="content-inner">
          <LoginForm />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, nextTick, onMounted, ref } from 'vue'
import LoginBanner from './components/banner.vue'
import LoginForm from './components/login-form.vue'

export default defineComponent({
  components: {
    LoginBanner,
    LoginForm,
  },
  setup() {
    const loading = ref(true)

    onMounted(async () => {
      try {
        // 等待下一个tick，确保DOM完全渲染
        await nextTick()

        // 等待一小段时间确保组件完全加载
        await new Promise(resolve => setTimeout(resolve, 600))

        // 检查关键元素是否已加载
        const banner = document.querySelector('.banner')
        const form = document.querySelector('.login-form-wrapper')

        if (banner && form) {
          // 如果关键元素已加载，立即隐藏缓冲页面
          loading.value = false
        } else {
          // 如果元素未加载，再等待一段时间
          setTimeout(() => {
            loading.value = false
          }, 400)
        }
      } catch (error) {
        // 如果出现错误，确保缓冲页面最终会隐藏
        setTimeout(() => {
          loading.value = false
        }, 1000)
      }
    })

    return {
      loading
    }
  }
})
</script>

<style lang="less" scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg,
      #667eea 0%,
      #764ba2 25%,
      #f093fb 50%,
      #f5576c 75%,
      #4facfe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
      rgba(102, 126, 234, 0.95) 0%,
      rgba(118, 75, 162, 0.95) 25%,
      rgba(240, 147, 251, 0.95) 50%,
      rgba(245, 87, 108, 0.95) 75%,
      rgba(79, 172, 254, 0.95) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.loading-content {
  text-align: center;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(15px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;

  img {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .logo-text {
    font-size: 28px;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.loading-spinner {
  margin: 30px auto;
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.loading-text {
  font-size: 18px;
  color: white;
  font-weight: 500;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
      rgba(102, 126, 234, 0.4) 0%,
      rgba(118, 75, 162, 0.5) 25%,
      rgba(240, 147, 251, 0.3) 50%,
      rgba(245, 87, 108, 0.4) 75%,
      rgba(79, 172, 254, 0.5) 100%);
  backdrop-filter: blur(15px);
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg,
      rgba(240, 147, 251, 0.15),
      rgba(245, 87, 108, 0.1),
      rgba(255, 255, 255, 0.08));
  animation: float 8s ease-in-out infinite;
  box-shadow: 0 0 60px rgba(240, 147, 251, 0.2);
}

.bg-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  left: -150px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 200px;
  height: 200px;
  top: 50%;
  right: -100px;
  animation-delay: 2s;
}

.bg-circle-3 {
  width: 150px;
  height: 150px;
  bottom: -75px;
  left: 50%;
  animation-delay: 4s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

@keyframes triangleFloat {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg) scale(1);
  }

  33% {
    transform: translateY(-15px) rotate(120deg) scale(1.1);
  }

  66% {
    transform: translateY(-5px) rotate(240deg) scale(0.9);
  }
}

@keyframes squareRotate {
  0% {
    transform: rotate(0deg) scale(1);
  }

  50% {
    transform: rotate(180deg) scale(1.2);
  }

  100% {
    transform: rotate(360deg) scale(1);
  }
}

// 几何装饰元素
.bg-triangle {
  position: absolute;
  width: 0;
  height: 0;
  animation: triangleFloat 10s ease-in-out infinite;
}

.bg-triangle-1 {
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 52px solid rgba(245, 87, 108, 0.1);
  top: 20%;
  right: 15%;
  animation-delay: 1s;
  filter: blur(1px);
}

.bg-triangle-2 {
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 35px solid rgba(240, 147, 251, 0.12);
  bottom: 30%;
  left: 10%;
  animation-delay: 3s;
  filter: blur(0.5px);
}

.bg-square {
  position: absolute;
  background: linear-gradient(45deg,
      rgba(102, 126, 234, 0.08),
      rgba(118, 75, 162, 0.1));
  animation: squareRotate 12s linear infinite;
  border-radius: 8px;
}

.bg-square-1 {
  width: 40px;
  height: 40px;
  top: 60%;
  right: 25%;
  animation-delay: 2s;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.15);
}

.container {
  display: flex;
  height: 500px;
  width: 900px;
  border-radius: 20px;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(25px);
  box-shadow: 0 25px 60px rgba(102, 126, 234, 0.15),
    0 0 120px rgba(240, 147, 251, 0.1),
    0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 35px 70px rgba(102, 126, 234, 0.2),
      0 0 140px rgba(240, 147, 251, 0.15),
      0 12px 40px rgba(0, 0, 0, 0.15);
  }

  .banner {
    width: 400px;
    background: linear-gradient(163.85deg,
        #667eea 0%,
        #764ba2 30%,
        #f093fb 60%,
        #f5576c 100%);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(163.85deg,
          rgba(102, 126, 234, 0.85) 0%,
          rgba(118, 75, 162, 0.9) 30%,
          rgba(240, 147, 251, 0.8) 60%,
          rgba(245, 87, 108, 0.9) 100%);
      backdrop-filter: blur(15px);
    }
  }

  .content {
    border-radius: 20px;
    position: relative;
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    padding-bottom: 40px;
    background: linear-gradient(145deg,
        #ffffff 0%,
        #fafbfc 30%,
        #f8f9fa 70%,
        #f1f3f4 100%);
  }
}

.logo {
  position: fixed;
  top: 24px;
  left: 22px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  img {
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: rotate(360deg);
  }

  &-text {
    margin-right: 4px;
    margin-left: 4px;
    color: #ffffff;
    font-size: 20px;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .container {
    width: 90%;
    height: auto;
    flex-direction: column;

    .banner {
      width: 100%;
      height: 200px;
    }
  }
}

@media (max-width: 768px) {
  .container {
    width: 95%;
    margin: 20px;

    .banner {
      height: 150px;
    }
  }

  .logo {
    position: relative;
    top: 20px;
    left: 20px;
    margin-bottom: 20px;
  }
}
</style>
