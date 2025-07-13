<template>
  <a-watermark :content="['17604515707@163.com', dayjs().format('YYYY-MM-DD')]"
    :font="{ color: 'rgba(255, 0, 0, 0.3)', fontSize: 16 }">
    <div class="container">
      <Breadcrumb :items="['menu.result', 'menu.result.success']" />
      <div class="page-container">
        <!-- 头部区域 -->
        <header class="header">
          <div class="header-background">
            <div class="bg-elements">
              <div class="bg-circle bg-circle-1"></div>
              <div class="bg-circle bg-circle-2"></div>
              <div class="bg-triangle"></div>
            </div>
          </div>
          <div class="header-content">
            <h1 class="title">{{ $t('success.welcome.title') }}</h1>
            <p class="subtitle">{{ $t('success.welcome.subtitle') }}</p>
          </div>
        </header>

        <!-- 软件介绍区域 -->
        <section class="platform-section">
          <div class="section-content">
            <div class="section-header">
              <h2>{{ $t('success.platform.title') }}</h2>
              <div class="section-divider"></div>
            </div>
            <p class="platform-description">{{ $t('success.platform.description') }}</p>

            <div class="features-container">
              <h3 class="features-title">{{ $t('success.features.title') }}</h3>
              <div class="features-grid">
                <div class="feature-card">
                  <div class="feature-icon-wrapper">
                    <icon-mobile class="feature-icon" />
                  </div>
                  <h4>{{ $t('success.feature1.title') }}</h4>
                  <p>{{ $t('success.feature1.description') }}</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon-wrapper">
                    <icon-bar-chart class="feature-icon" />
                  </div>
                  <h4>{{ $t('success.feature2.title') }}</h4>
                  <p>{{ $t('success.feature2.description') }}</p>
                </div>
                <div class="feature-card">
                  <div class="feature-icon-wrapper">
                    <icon-safe class="feature-icon" />
                  </div>
                  <h4>{{ $t('success.feature3.title') }}</h4>
                  <p>{{ $t('success.feature3.description') }}</p>
                </div>
              </div>
            </div>

            <div class="cta-primary">
              <a-button type="primary" size="large" class="cta-button">
                {{ $t('success.cta.button') }}
              </a-button>
            </div>
          </div>
        </section>

        <!-- 公司介绍区域 -->
        <section class="company-section">
          <div class="section-content">
            <div class="section-header">
              <h2>{{ $t('success.company.title') }}</h2>
              <div class="section-divider"></div>
            </div>
            <p class="company-description">{{ $t('success.company.description') }}</p>

            <div class="company-highlights">
              <div class="highlight-card">
                <div class="highlight-icon">
                  <icon-tag />
                </div>
                <h4>{{ $t('success.mission.title') }}</h4>
                <p>{{ $t('success.mission.description') }}</p>
              </div>
              <div class="highlight-card">
                <div class="highlight-icon">
                  <icon-eye />
                </div>
                <h4>{{ $t('success.vision.title') }}</h4>
                <p>{{ $t('success.vision.description') }}</p>
              </div>
              <div class="highlight-card">
                <div class="highlight-icon">
                  <icon-heart />
                </div>
                <h4>{{ $t('success.values.title') }}</h4>
                <p>{{ $t('success.values.description') }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 行动号召区域 -->
        <section class="cta-section">
          <div class="cta-background">
            <div class="cta-bg-elements">
              <div class="cta-circle cta-circle-1"></div>
              <div class="cta-circle cta-circle-2"></div>
            </div>
          </div>
          <div class="cta-content">
            <h2>{{ $t('success.cta.title') }}</h2>
            <p>{{ $t('success.cta.description') }}</p>
            <a-button type="primary" size="large" class="cta-button-secondary">
              {{ $t('success.cta.start') }}
            </a-button>
          </div>
        </section>

        <!-- 底部区域 -->
        <footer class="footer">
          <div class="footer-content">
            <p>{{ $t('success.footer.copyright', { year: dayjs().format('YYYY') }) }}</p>
            <p>{{ $t('success.footer.contact') }}:
              <a href="mailto:17604515707@163.com">17604515707@163.com</a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  </a-watermark>
</template>

<script lang="ts" setup>
import { IconBarChart, IconEye, IconHeart, IconMobile, IconSafe, IconTag } from '@arco-design/web-vue/es/icon';
import dayjs from 'dayjs';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped lang="less">
.container {
  padding: 0 20px 20px 20px;
}

.page-container {
  font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1a1a1a;
  line-height: 1.7;
  background: #ffffff;
  overflow-x: hidden;
}

/* Header Styling */
.header {
  position: relative;
  text-align: center;
  padding: 100px 20px 120px;
  background: linear-gradient(135deg,
      #667eea 0%,
      #764ba2 25%,
      #f093fb 50%,
      #f5576c 75%,
      #4facfe 100%);
  color: white;
  overflow: hidden;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg,
      rgba(255, 255, 255, 0.1),
      rgba(255, 255, 255, 0.05));
  animation: float 8s ease-in-out infinite;
}

.bg-circle-1 {
  width: 200px;
  height: 200px;
  top: 20%;
  right: 10%;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 150px;
  height: 150px;
  bottom: 30%;
  left: 15%;
  animation-delay: 3s;
}

.bg-triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 40px solid transparent;
  border-right: 40px solid transparent;
  border-bottom: 70px solid rgba(255, 255, 255, 0.08);
  top: 40%;
  left: 50%;
  transform: translateX(-50%);
  animation: rotate 10s linear infinite;
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

@keyframes rotate {
  0% {
    transform: translateX(-50%) rotate(0deg);
  }

  100% {
    transform: translateX(-50%) rotate(360deg);
  }
}

.header-content {
  position: relative;
  z-index: 1;
}

.title {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.subtitle {
  font-size: 1.4rem;
  font-weight: 400;
  opacity: 0.95;
  max-width: 600px;
  margin: 0 auto;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Section Styling */
.platform-section,
.company-section {
  padding: 100px 20px;
  position: relative;
}

.platform-section {
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
}

.company-section {
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-divider {
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 auto;
  border-radius: 2px;
}

.platform-description,
.company-description {
  font-size: 1.2rem;
  color: #4a5568;
  max-width: 800px;
  margin: 0 auto 60px;
  text-align: center;
  line-height: 1.8;
}

/* Features Section */
.features-container {
  margin-bottom: 60px;
}

.features-title {
  font-size: 2.2rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 40px;
  color: #2d3748;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-bottom: 40px;
}

.feature-card {
  background: #ffffff;
  padding: 40px 32px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 48px rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.2);
  }
}

.feature-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.feature-icon {
  font-size: 2.5rem;
  color: white;
}

.feature-card h4 {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #2d3748;
}

.feature-card p {
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

/* Company Highlights */
.company-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 32px;
}

.highlight-card {
  background: #ffffff;
  padding: 40px 32px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  }
}

.highlight-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.arco-icon) {
    font-size: 1.8rem;
    color: white;
  }
}

.highlight-card h4 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: #2d3748;
}

.highlight-card p {
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.6;
  margin: 0;
}

/* CTA Section */
.cta-section {
  position: relative;
  padding: 100px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  overflow: hidden;
}

.cta-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.cta-bg-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.cta-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.cta-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: 1s;
}

.cta-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: 3s;
}

.cta-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

.cta-content h2 {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: white;
}

.cta-content p {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.95;
}

/* Buttons */
.cta-primary {
  text-align: center;
  margin-top: 40px;
}

.cta-button,
.cta-button-secondary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 50px;
  height: 56px;
  padding: 0 40px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);

    &::before {
      left: 100%;
    }
  }
}

.cta-button-secondary {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

/* Footer */
.footer {
  background: #1a202c;
  color: #a0aec0;
  padding: 40px 20px;
  text-align: center;
}

.footer-content p {
  margin: 8px 0;
  font-size: 0.95rem;
}

.footer a {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: #764ba2;
    text-decoration: underline;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 1.1rem;
  }

  .section-header h2 {
    font-size: 2.2rem;
  }

  .features-title {
    font-size: 1.8rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .company-highlights {
    grid-template-columns: 1fr;
  }

  .cta-content h2 {
    font-size: 2.2rem;
  }

  .platform-section,
  .company-section,
  .cta-section {
    padding: 60px 20px;
  }

  .header {
    padding: 60px 20px 80px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 2rem;
  }

  .section-header h2 {
    font-size: 1.8rem;
  }

  .feature-card,
  .highlight-card {
    padding: 32px 24px;
  }
}
</style>