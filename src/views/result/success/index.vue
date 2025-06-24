<template>
  <a-watermark :content="['17604515707@163.com', dayjs().format('YYYY-MM-DD')]"
    :font="{ color: 'rgba(255, 0, 0, 0.3)', fontSize: 16 }">
    <div class="container">
      <Breadcrumb :items="['menu.result', 'menu.result.success']" />
      <div class="page-container">
        <!-- 头部区域 -->
        <header class="header">
          <h1 class="title">欢迎体验凌速科技</h1>
          <p class="subtitle">引领手机信息管理与服务的未来</p>
        </header>

        <!-- 软件介绍区域 -->
        <section class="software-section">
          <div class="section-content">
            <h2>探索凌速科技</h2>
            <p>
              凌速科技是一款专业的手机IMEI接口服务软件，致力于提供全面的手机信息查询、管理、解锁和保修解决方案。无论您是个人用户还是企业客户，我们的软件都能为您提供高效、灵活和安全的手机管理体验。
            </p>
            <div class="features-grid">
              <div class="feature-card">
                <a-icon type="search" class="feature-icon" />
                <h3>专业的手机IMEI接口服务</h3>
                <p>提供全面的手机信息查询和管理解决方案，快速获取设备详情。</p>
              </div>
              <div class="feature-card">
                <a-icon type="unlock" class="feature-icon" />
                <h3>一站式保修与解锁服务</h3>
                <p>支持国际化查询，快速解锁，全面的状态管理，简化您的操作流程。</p>
              </div>
              <div class="feature-card">
                <a-icon type="eye" class="feature-icon" />
                <h3>接入可视化增强工具</h3>
                <p>实现灵活的手机信息管理与服务配置，提升用户体验。</p>
              </div>
            </div>
            <a-button type="primary" size="large" class="cta-button">立即体验凌速科技</a-button>
          </div>
        </section>

        <!-- 公司介绍区域 -->
        <section class="company-section">
          <div class="section-content">
            <h2>关于凌速科技</h2>
            <p>
              凌速科技成立于2010年，是全球领先的软件开发公司，专注于为企业和个人提供创新的手机管理解决方案。我们拥有遍布10个国家的500多名专家团队，结合尖端技术和以客户为中心的服务理念，为全球用户创造卓越价值。
            </p>
            <div class="company-highlights">
              <div class="highlight">
                <h3>我们的使命</h3>
                <p>通过直观、高效和可持续的软件解决方案，革新手机信息管理方式。</p>
              </div>
              <div class="highlight">
                <h3>我们的愿景</h3>
                <p>成为全球企业与用户信赖的合作伙伴，引领数字化管理转型。</p>
              </div>
              <div class="highlight">
                <h3>我们的价值观</h3>
                <p>创新、诚信和协作是我们一切工作的核心。</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 行动号召区域 -->
        <section class="cta-section">
          <h2>携手凌速科技，开启未来</h2>
          <p>准备好革新您的手机管理方式了吗？立即体验凌速科技，感受与众不同！</p>
          <a-button type="primary" size="large" class="cta-button">立即开始</a-button>
        </section>

        <!-- 底部区域 -->
        <footer class="footer">
          <p>© {{ dayjs().format('YYYY') }} 凌速科技。保留所有权利。</p>
          <p>联系我们: <a href="mailto:17604515707@163.com">17604515707@163.com</a></p>
        </footer>
      </div>
    </div>
  </a-watermark>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs';


</script>

<style scoped lang="less">
.container {
  padding: 0 20px 20px 20px;
}

.wrapper {
  padding: 24px 150px;
  background-color: var(--color-bg-2);
  border-radius: 4px;
}

.result {
  margin: 150px 0 0 0;
}

.operation-wrap {
  margin-bottom: 40px;
  text-align: center;
}

.steps-wrapper {
  width: 100%;
  min-width: fit-content;
  margin-bottom: 150px;
  padding: 20px;
  background-color: rgb(var(--gray-1));
}
</style>

<style lang="less" scoped>
.mobile {
  .wrapper {
    padding: 24px 10px;

    .steps-wrapper {
      transform: scale(0.8);
    }
  }
}

.page-container {
  font-family: 'Arial', sans-serif;
  color: #333;
  line-height: 1.6;
  background-color: #f5f5f5;
}

/* Header Styling */
.header {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: white;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
}

/* Section Styling */
.software-section,
.company-section,
.cta-section {
  padding: 60px 20px;
  text-align: center;
}

.software-section {
  background-color: #fff;
}

.company-section {
  background-color: #f0f4f8;
}

.cta-section {
  background: linear-gradient(135deg, #2a5298, #1e3c72);
  color: white;
}

.section-content {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #1e3c72;
}

.cta-section h2 {
  color: white;
}

p {
  font-size: 1.1rem;
  max-width: 800px;
  margin: 0 auto 30px;
}

/* Features Grid */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.feature-card {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 2rem;
  color: #2a5298;
  margin-bottom: 10px;
}

/* Company Highlights */
.company-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.highlight {
  flex: 1;
  min-width: 250px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Call to Action Button */
.cta-button {
  background-color: #2a5298 !important;
  border-color: #2a5298 !important;
  padding: 10px 30px;
  font-size: 1.1rem;
}

.cta-button:hover {
  background-color: #1e3c72 !important;
  border-color: #1e3c72 !important;
}

/* Footer Styling */
.footer {
  text-align: center;
  padding: 20px;
  background-color: #1e3c72;
  color: white;
}

.footer a {
  color: #a0c4ff;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

/* Responsive Design */
@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  h2 {
    font-size: 1.8rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .company-highlights {
    flex-direction: column;
  }
}
</style>