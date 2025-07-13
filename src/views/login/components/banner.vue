<template>
  <div class="banner">
    <div class="banner-inner">
      <a-carousel class="carousel" animation-name="fade">
        <a-carousel-item v-for="item in carouselItem" :key="item.slogan">
          <div :key="item.slogan" class="carousel-item">
            <div class="carousel-title">{{ item.slogan }}</div>
            <div class="carousel-sub-title">{{ item.subSlogan }}</div>
            <img class="carousel-image" :src="item.image" />
          </div>
        </a-carousel-item>
      </a-carousel>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const carouselItem = computed(() => [
  {
    slogan: t('login.banner.slogan1'),
    subSlogan: t('login.banner.subSlogan1'),
    image: "https://www.nuogobrand.com/uploads/image/20210317/1615974678.jpg",
  },
  {
    slogan: t('login.banner.slogan2'),
    subSlogan: t('login.banner.subSlogan2'),
    image: "https://www.nuogobrand.com/uploads/image/20210317/1615976549.jpg",
  },
  {
    slogan: t('login.banner.slogan3'),
    subSlogan: t('login.banner.subSlogan3'),
    image: "https://www.nuogobrand.com/uploads/image/20210317/1615975995.jpg",
  },
])
</script>

<style lang="less" scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: center;

  &-inner {
    flex: 1;
    height: 100%;
  }
}

.carousel {
  height: 100%;

  &-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  &-title {
    color: #ffffff;
    font-weight: 600;
    font-size: 24px;
    line-height: 32px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    text-align: center;
  }

  &-sub-title {
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
    line-height: 24px;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
    text-align: center;
  }

  &-image {
    width: 320px;
    margin-top: 30px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    }
  }
}
</style>
