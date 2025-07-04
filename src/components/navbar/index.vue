<template>
  <div class="navbar">
    <div class="left-side">
      <a-space>
        <icon-menu-fold v-if="!topMenu && appStore.device === 'mobile'" style="font-size: 22px; cursor: pointer"
          @click="toggleDrawerMenu" />
      </a-space>
    </div>
    <ul class="right-side">
      <li>
        {{ $t('settings.cpu') }}: {{ cpuCores }}
      </li>
      <li>
        {{ $t('settings.thread') }}: {{ cpuCores }}
      </li>
      <li>
        {{ $t('settings.total') }}:{{ userStore.total }}
      </li>
      <li>
        <a-tooltip :content="$t('settings.language')">
          <a-button class="nav-btn" type="outline" :shape="'circle'" @click="setDropDownVisible">
            <template #icon>
              <icon-language />
            </template>
          </a-button>
        </a-tooltip>
        <a-dropdown trigger="click" @select="changeLocale as any">
          <div ref="triggerBtn" class="trigger-btn"></div>
          <template #content>
            <a-doption v-for="item in locales" :key="item.value" :value="item.value">
              <template #icon>
                <icon-check v-show="item.value === currentLocale" />
              </template>
              {{ item.label }}
            </a-doption>
          </template>
        </a-dropdown>
      </li>
      <li>
        <a-tooltip
          :content="theme === 'light' ? $t('settings.navbar.theme.toDark') : $t('settings.navbar.theme.toLight')">
          <a-button class="nav-btn" type="outline" :shape="'circle'" @click="handleToggleTheme">
            <template #icon>
              <icon-moon-fill v-if="theme === 'dark'" />
              <icon-sun-fill v-else />
            </template>
          </a-button>
        </a-tooltip>
      </li>

      <li>
        <a-dropdown trigger="click">
          <a-avatar :size="32" :style="{ marginRight: '8px' }">
            <img alt="avatar" :src="avatar" />
          </a-avatar>
          <template #content>
            <a-doption>
              <a-space @click="handleLogout">
                <icon-export />
                <span>
                  {{ $t('messageBox.logout') }}
                </span>
              </a-space>
            </a-doption>
          </template>
        </a-dropdown>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import useLocale from '@/hooks/locale'
import useUser from '@/hooks/user'
import { LOCALE_OPTIONS } from '@/locale'
import { useAppStore, useUserStore } from '@/store'
import { Message } from '@arco-design/web-vue'
import {
  useDark,
  useFullscreen,
  useToggle
} from '@vueuse/core'
import {
  computed,
  inject,
  ref
} from 'vue'

const appStore = useAppStore()
const userStore = useUserStore()
const {
  logout
} = useUser()
const {
  changeLocale,
  currentLocale
}: any = useLocale()
const {
  isFullscreen,
  toggle: toggleFullScreen
} = useFullscreen()
const locales = [...LOCALE_OPTIONS]
const avatar = computed(() => {
  return "https://imei.top/favicon.ico"
})
const theme = computed(() => {
  return appStore.theme
})

const cpuCores = ref(navigator.hardwareConcurrency || 0)

const topMenu = computed(() => appStore.topMenu && appStore.menu)
const isDark = useDark({
  selector: 'body',
  attribute: 'arco-theme',
  valueDark: 'dark',
  valueLight: 'light',
  storageKey: 'arco-theme',
  onChanged(dark: boolean) {
    // overridden default behavior
    appStore.toggleTheme(dark)
  },
})
const toggleTheme = useToggle(isDark)
const handleToggleTheme = () => {
  toggleTheme()
}
const setVisible = () => {
  appStore.updateSettings({
    globalSettings: true
  })
}
const refBtn = ref()
const triggerBtn = ref()
const setPopoverVisible = () => {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })
  refBtn.value.dispatchEvent(event)
}
const handleLogout = () => {
  logout()
}
const setDropDownVisible = () => {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true,
  })
  triggerBtn.value.dispatchEvent(event)
}
const switchRoles = async () => {
  const res = await userStore.switchRoles()
  Message.success(res as string)
}
const toggleDrawerMenu = inject('toggleDrawerMenu') as () => void
const switchGit = () => {
  window.open('https://github.com/zxwk1998/vue-admin-arco')
}
const open = (val: string) => {
  window.open(`https://vuejs-core.cn/${val}`)
}
</script>

<style lang="less" scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  height: 100%;
  background-color: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  height: 60px;
  z-index: 99;
}

.left-side {
  display: flex;
  align-items: center;
  padding-left: 20px;
}

.right-side {
  display: flex;
  padding-right: 20px;
  list-style: none;

  :deep(.locale-select) {
    border-radius: 20px;
  }

  li {
    display: flex;
    align-items: center;
    padding: 0 10px;
  }

  a {
    color: var(--color-text-1);
    text-decoration: none;
  }

  .nav-btn {
    border-color: rgb(var(--gray-2));
    color: rgb(var(--gray-8));
    font-size: 16px;
  }

  .trigger-btn,
  .ref-btn {
    position: absolute;
    bottom: 14px;
  }

  .trigger-btn {
    margin-left: 14px;
  }
}
</style>

<style lang="less">
.message-popover {
  .arco-popover-content {
    margin-top: 0;
  }
}

.arco-dropdown-list-wrapper {
  max-height: 100vh !important;
}
</style>
