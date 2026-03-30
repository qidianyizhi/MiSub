<script setup>
import { ref, computed, onUnmounted } from 'vue';
import { useToastStore } from '../../stores/toast.js';
import { useUIStore } from '../../stores/ui.js';

const props = defineProps({
  config: Object,
  profiles: Array,
});

const emit = defineEmits(['qrcode']);

const { showToast } = useToastStore();
const uiStore = useUIStore();

const copied = ref(false);
let copyTimeout = null;

const formats = [
  { name: '通用格式', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9' },
  { name: 'Base64', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { name: 'Clash', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { name: 'Sing-Box', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'NekoBox', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Surge', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { name: 'Shadowrocket', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { name: 'Surfboard', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
  { name: 'Loon', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
  { name: 'QuanX', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'FlClash', icon: 'M11.983 1.907a.75.75 0 00-.726.56L9.167 10.5H4.5a.75.75 0 00-.56 1.243l8.25 9.348a.75.75 0 001.393-.509l-.009-.038 2.09-8.067H19.5a.75.75 0 00.56-1.243l-8.25-9.348a.75.75 0 00-.827-.179z' },
];
const selectedFormat = ref('通用格式');
const selectedId = ref('default'); 

const requiredToken = computed(() => {
  return selectedId.value === 'default' 
    ? { type: 'mytoken', value: props.config?.mytoken, name: '主 Token' }
    : { type: 'profileToken', value: props.config?.profileToken, name: '分享 Token' };
});

const isLinkValid = computed(() => {
  return requiredToken.value.value && requiredToken.value.value !== 'auto';
});

const subLink = computed(() => {
  if (!isLinkValid.value) {
    return `请先在“设置”中配置固定的 ${requiredToken.value.name}`;
  }
  
  const origin = window.location.origin;
  const token = requiredToken.value.value;
  let baseUrl = selectedId.value === 'default'
    ? `${origin}/${token}`
    : `${origin}/${token}/${selectedId.value}`;

  if (selectedFormat.value === '通用格式') {
    return baseUrl;
  }
  
  const targetMapping = { 'Sing-Box': 'singbox', 'NekoBox': 'singbox', 'QuanX': 'quanx', 'Shadowrocket': 'base64', 'FlClash': 'clash' };
  const formatKey = (targetMapping[selectedFormat.value] || selectedFormat.value.toLowerCase());
  return `${baseUrl}?${formatKey}&builtin=1`;
});

const copyToClipboard = () => {
    if (!isLinkValid.value) {
        showToast('链接无效，请先完成配置', 'error');
        return;
    }
    navigator.clipboard.writeText(subLink.value);
    showToast('已复制到剪贴板', 'success');
    copied.value = true;
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => { copied.value = false; }, 2000);
};

onUnmounted(() => {
  clearTimeout(copyTimeout);
});
</script>

<template>
  <div>
    <div class="bg-white/90 dark:bg-gray-900/80 backdrop-blur-md p-6 misub-radius-lg border border-gray-100/80 dark:border-white/10 shadow-sm transition-all duration-300">
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 list-item-animation" style="--delay-index: 0">生成订阅链接</h3>

      <div class="mb-4 list-item-animation" style="--delay-index: 1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">1. 选择订阅内容</label>
        <select v-model="selectedId" class="w-full px-3 py-2.5 bg-white/80 dark:bg-gray-800/70 border border-gray-200/80 dark:border-white/10 misub-radius-lg shadow-sm focus:outline-hidden focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 text-sm text-gray-900 dark:text-white input-enhanced">
            <option value="default">默认订阅 (全部启用节点)</option>
            <option v-for="profile in profiles" :key="profile.id" :value="profile.customId || profile.id">
                {{ profile.name }}
            </option>
        </select>
      </div>

      <div class="mb-5 list-item-animation" style="--delay-index: 2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. 选择格式</label>
        <div class="grid grid-cols-3 gap-2">
            <button
              v-for="(format, index) in formats"
              :key="format.name"
              @click="selectedFormat = format.name"
              :aria-pressed="selectedFormat === format.name"
              class="px-3 py-2 text-xs font-medium misub-radius-lg border transition-colors flex justify-center items-center gap-1.5 list-item-animation"
              :style="{ '--delay-index': index }"
              :class="[
                selectedFormat === format.name
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-500/30'
                  : 'bg-white/70 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200/70 dark:border-white/10 hover:bg-white dark:hover:bg-gray-800'
              ]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" :d="format.icon" />
              </svg>
              {{ format.name }}
            </button>
        </div>
      </div>

      <div class="relative list-item-animation" style="--delay-index: 3">
        <input
          type="text"
          :value="subLink"
          readonly
          :disabled="!isLinkValid"
          class="w-full text-sm text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-800/60 misub-radius-lg pl-3 pr-20 py-2.5 border border-gray-200/70 dark:border-white/10 focus:outline-hidden focus:ring-2 font-mono input-enhanced"
          :class="{
            'focus:ring-primary-500': isLinkValid,
            'focus:ring-red-500 cursor-not-allowed': !isLinkValid,
            'text-red-500 dark:text-red-500': !isLinkValid
          }"
        />
        <div class="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button @click="$emit('qrcode', subLink, '订阅链接')" :disabled="!isLinkValid" class="flex h-9 w-9 items-center justify-center misub-radius-md text-gray-400 transition-colors duration-200" :class="isLinkValid ? 'hover:text-primary-600 hover:bg-white/80 dark:hover:bg-gray-800' : 'cursor-not-allowed'" title="显示二维码">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
               <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
               <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
             </svg>
          </button>
          <button @click="copyToClipboard" :disabled="!isLinkValid" class="flex h-9 w-9 items-center justify-center misub-radius-md text-gray-400 transition-colors duration-200" :class="isLinkValid ? 'hover:text-primary-600 hover:bg-white/80 dark:hover:bg-gray-800' : 'cursor-not-allowed'" title="复制链接">
             <Transition name="fade" mode="out-in">
                 <svg v-if="copied" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                 </svg>
                 <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                     <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                 </svg>
             </Transition>
          </button>
        </div>
      </div>

       <p v-if="!isLinkValid || requiredToken.value.value === 'auto'" class="text-xs text-yellow-600 dark:text-yellow-500 mt-2 list-item-animation" style="--delay-index: 4">
           提示：
           <span v-if="!isLinkValid">请在              <router-link to="/settings" class="font-bold underline hover:text-yellow-400">设置</router-link> 
             中配置一个固定的 {{ requiredToken.name }}。
           </span>
           <span v-else-if="requiredToken.type === 'mytoken' && requiredToken.value === 'auto'">
             当前为自动Token，链接可能会变化。为确保链接稳定，推荐在 "设置" 中配置一个固定Token。
           </span>
       </p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
