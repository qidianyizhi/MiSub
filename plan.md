# 内置转换器规则模板系统

## 核心思路
创建一个共享的规则模板模块 `rule-templates.js`，定义 3 个预设模板（基础/标准/完整）。
每个模板以抽象方式定义「策略组」和「规则」，各生成器读取模板后转换为格式特定的语法。

规则集 URL 指向公开的 GitHub 仓库（blackmatrix7/ios_rule_script），只下载域名/IP 分类数据，不发送任何用户信息。

## 模板预设

### basic（基础）— 当前行为，兜底保底
- 策略组：节点选择、自动选择
- 规则：GEOIP CN 直连 + 兜底走代理

### standard（标准）— 默认推荐
- 策略组：节点选择、自动选择 + 地区分组（已有）
- 规则：Apple 直连、GlobalMedia 代理、Telegram 代理、China 直连、GEOIP CN、兜底代理
- （Surge/Loon 已经是这个级别，统一到所有格式）

### full（完整）— 对齐 ACL4SSR_Online_Full
- 策略组：节点选择、自动选择、地区分组 + YouTube、Netflix、Disney+、Spotify、Telegram、Microsoft、Apple、Game
- 规则：在 standard 基础上增加 YouTube/Netflix/Disney+/Spotify/Microsoft/Game 等细分规则集

## 数据结构

```js
// rule-templates.js
export const RULE_TEMPLATES = {
  basic: {
    name: '基础',
    description: '仅 GEOIP 分流，最简配置',
    // 额外策略组（节点选择和自动选择由各生成器自行生成）
    extraGroups: [],
    // 规则列表，每条规则 { type, payload, policy, options? }
    rules: [
      { type: 'GEOIP', payload: 'CN', policy: 'DIRECT' },
      { type: 'FINAL', policy: '📶 节点选择' }
    ]
  },
  standard: {
    name: '标准',
    description: 'Apple/媒体/Telegram/国内分流',
    extraGroups: [],
    rules: [
      { type: 'RULE-SET', category: 'Apple', policy: 'DIRECT' },
      { type: 'RULE-SET', category: 'GlobalMedia', policy: '📶 节点选择' },
      { type: 'RULE-SET', category: 'Telegram', policy: '📶 节点选择' },
      { type: 'RULE-SET', category: 'China', policy: 'DIRECT' },
      { type: 'GEOIP', payload: 'CN', policy: 'DIRECT' },
      { type: 'FINAL', policy: '📶 节点选择' }
    ]
  },
  full: {
    name: '完整',
    description: '细分流媒体/社交/微软/游戏等',
    extraGroups: [
      { name: '🎬 YouTube', type: 'select', defaultPolicy: '📶 节点选择' },
      { name: '🎥 Netflix', type: 'select', defaultPolicy: '📶 节点选择' },
      { name: '📲 Telegram', type: 'select', defaultPolicy: '📶 节点选择' },
      { name: '🍎 Apple', type: 'select', defaultPolicy: 'DIRECT' },
      { name: '🪟 Microsoft', type: 'select', defaultPolicy: '📶 节点选择' },
      { name: '🎮 Game', type: 'select', defaultPolicy: '📶 节点选择' },
    ],
    rules: [
      { type: 'RULE-SET', category: 'YouTube', policy: '🎬 YouTube' },
      { type: 'RULE-SET', category: 'Netflix', policy: '🎥 Netflix' },
      { type: 'RULE-SET', category: 'Disney', policy: '📶 节点选择' },
      { type: 'RULE-SET', category: 'Spotify', policy: '📶 节点选择' },
      { type: 'RULE-SET', category: 'Telegram', policy: '📲 Telegram' },
      { type: 'RULE-SET', category: 'Apple', policy: '🍎 Apple' },
      { type: 'RULE-SET', category: 'Microsoft', policy: '🪟 Microsoft' },
      { type: 'RULE-SET', category: 'Game', policy: '🎮 Game' },
      { type: 'RULE-SET', category: 'GlobalMedia', policy: '📶 节点选择' },
      { type: 'RULE-SET', category: 'China', policy: 'DIRECT' },
      { type: 'GEOIP', payload: 'CN', policy: 'DIRECT' },
      { type: 'FINAL', policy: '📶 节点选择' }
    ]
  }
};
```

## 规则集 URL 映射

`rule-templates.js` 中导出一个 `getRuleSetUrl(category, format)` 函数，根据格式返回对应 URL：

| category | Surge (jsdelivr) | Clash (jsdelivr) | Loon (raw) | QX (raw) | Sing-Box |
|----------|-----------------|-----------------|------------|----------|----------|
| Apple | .../rule/Surge/Apple/Apple.list | .../rule/Clash/Apple/Apple.yaml | .../rule/Loon/Apple/Apple.list | .../rule/QuantumultX/Apple/Apple.list | geosite:apple |
| YouTube | .../rule/Surge/YouTube/YouTube.list | .../rule/Clash/YouTube/YouTube.yaml | ... | ... | geosite:youtube |
| ... | ... | ... | ... | ... | ... |

Surfboard：不支持 RULE-SET，basic 模板直接内联规则；standard/full 模板降级为 basic（只用 GEOIP+FINAL）。

Sing-Box：使用 geosite/geoip 而非远程 URL（已有模式）。

## 修改文件清单

### 1. 新建 `functions/modules/subscription/rule-templates.js`
- 导出 `RULE_TEMPLATES` 对象
- 导出 `getRuleSetUrl(category, format)` 函数
- 导出 `getTemplate(templateId)` 函数（带 fallback 到 basic）
- 导出 `renderRulesForFormat(template, format)` — 返回格式特定的规则字符串/数组
- 导出 `renderExtraGroupsForFormat(template, format, proxyNames)` — 返回额外策略组

### 2. 修改 6 个生成器
每个生成器的 options 新增 `ruleTemplate` 参数，调用 rule-templates 获取规则和额外分组：

- `builtin-clash-generator.js` — rules 数组 + rule-providers
- `builtin-surge-generator.js` — [Rule] 段 RULE-SET 行
- `builtin-loon-generator.js` — [Rule] 段 RULE-SET 行
- `builtin-singbox-generator.js` — route.rules + route.rule_set
- `builtin-quanx-generator.js` — [filter_remote] + [filter_local]
- `builtin-surfboard-generator.js` — 仅 basic 内联规则（不支持远程规则集）

### 3. 修改 `main-handler.js`
- 读取 `config.builtinRuleTemplate`，传递给各生成器的 options

### 4. 修改 `src/constants/default-settings.js`
- 新增 `builtinRuleTemplate: 'standard'`

### 5. 修改 `SubConverterCard.vue`
- 在内置转换器开关下方，当开启时显示规则模板选择器（select 下拉框）
- 3 个选项：基础 / 标准（推荐）/ 完整

### 6. 测试
- 现有 92 个测试应继续通过（默认 standard 模板 = 当前 Surge/Loon 行为）
- 构建验证
