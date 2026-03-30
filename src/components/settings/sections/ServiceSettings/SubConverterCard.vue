<script setup>
import { ref } from 'vue';
import SubConverterSelector from '@/components/forms/SubConverterSelector.vue';
import Switch from '@/components/ui/Switch.vue';

const props = defineProps({
  settings: {
    type: Object,
    required: true
  }
});

const isTesting = ref(false);
const testResult = ref(null);

async function testSubconverter() {
  const backend = props.settings.subConverter;
  if (!backend || backend.trim() === '') {
    testResult.value = { success: false, message: '请先填写后端地址' };
    return;
  }

  isTesting.value = true;
  testResult.value = null;

  try {
    const response = await fetch('/api/test_subconverter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backend })
    });
    const data = await response.json();
    if (data.success) {
      testResult.value = {
        success: true,
        message: data.message || '后端可用',
        detail: data.detail
      };
    } else {
      testResult.value = {
        success: false,
        message: data.error || '测试失败',
        detail: data.detail
      };
    }
  } catch (e) {
    testResult.value = { success: false, message: '请求失败', error: e.message };
  } finally {
    isTesting.value = false;
  }
}
</script>

<template>
  <div class="bg-white/90 dark:bg-gray-900/70 misub-radius-lg p-6 space-y-5 border border-gray-100/80 dark:border-white/10 shadow-sm transition-shadow duration-300">
    <h3 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24"
        stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      外部服务集成
    </h3>

    <!-- 内置转换器开关 -->
    <div class="flex items-center justify-between p-4 misub-radius-lg" :class="settings.useBuiltinConverter ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-200/70 dark:border-green-800/30' : 'bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-200/70 dark:border-yellow-800/30'">
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-200">内置转换器（隐私模式）</p>
        <p v-if="settings.useBuiltinConverter" class="text-xs text-green-600 dark:text-green-400 mt-0.5">
          已开启 — 所有订阅格式（Clash / Surge / Loon / Sing-Box / QX / Surfboard / Base64）均在本地转换，节点信息不会发送给任何第三方
        </p>
        <p v-else class="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
          已关闭 — 将使用下方配置的外部 SubConverter 后端进行格式转换，您的节点信息（服务器地址、密码、UUID 等）会明文发送给该后端
        </p>
      </div>
      <Switch v-model="settings.useBuiltinConverter" />
    </div>

    <!-- 规则模板选择器（仅内置转换器开启时显示） -->
    <div v-if="settings.useBuiltinConverter" class="p-4 bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-white/10 misub-radius-lg">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200">分流规则模板</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            规则集从公开仓库加载（仅域名/IP 分类数据），不涉及任何隐私信息
          </p>
        </div>
        <select v-model="settings.builtinRuleTemplate"
          class="px-3 py-1.5 bg-white/80 dark:bg-gray-800/70 border border-gray-200/80 dark:border-white/10 misub-radius-lg text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary-500/40">
          <option value="basic">基础 — 仅 GEOIP 分流</option>
          <option value="standard">标准 — Apple / 媒体 / Telegram / 国内（推荐）</option>
          <option value="full">完整 — YouTube / Netflix / Telegram / 微软 / 游戏等细分</option>
        </select>
      </div>
    </div>

    <!-- 通用选项（内置/外部均生效） -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div
        class="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-white/10 misub-radius-lg">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200">禁用证书校验（scv）</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">仅在订阅源证书异常时启用，开启后存在安全风险</p>
        </div>
        <Switch v-model="settings.subConverterScv" />
      </div>
      <div
        class="flex items-center justify-between p-4 bg-white/70 dark:bg-gray-900/50 border border-gray-200/70 dark:border-white/10 misub-radius-lg">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-gray-200">启用 UDP</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">默认关闭，按需开启以避免兼容性问题</p>
        </div>
        <Switch v-model="settings.subConverterUdp" />
      </div>
    </div>

    <!-- 外部 SubConverter 配置（仅内置关闭时显示） -->
    <template v-if="!settings.useBuiltinConverter">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SubConverter 后端地址</label>
          <SubConverterSelector v-model="settings.subConverter" type="backend" placeholder="选择后端地址" :allowEmpty="false" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SubConverter 配置文件</label>
          <SubConverterSelector v-model="settings.subConfig" type="config" placeholder="选择配置" :allowEmpty="false" />
        </div>
      </div>

      <!-- 测试按钮区域 -->
      <div class="border-t border-gray-100 dark:border-gray-700 pt-4">
        <div class="flex items-center gap-4 flex-wrap">
          <button @click="testSubconverter" :disabled="isTesting || !settings.subConverter"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium misub-radius-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <svg v-if="isTesting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            <span v-else>🔌</span>
            {{ isTesting ? '测试中...' : '测试可用性' }}
          </button>
          <div v-if="testResult"
            :class="testResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            class="text-sm flex-1">
            <span v-if="testResult.success">
              ✅ {{ testResult.message }}
              <span v-if="testResult.detail?.responseTime" class="text-gray-500 dark:text-gray-400 text-xs ml-1">
                ({{ testResult.detail.responseTime }})
              </span>
            </span>
            <span v-else>
              ❌ {{ testResult.message }}
              <details v-if="testResult.detail"
                class="mt-1 text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded max-h-32 overflow-auto">
                <summary class="cursor-pointer text-gray-500">查看详细信息</summary>
                <pre class="mt-1 whitespace-pre-wrap">{{ JSON.stringify(testResult.detail, null, 2) }}</pre>
              </details>
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
