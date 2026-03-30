/**
 * 内置转换器规则模板系统
 * 定义策略组和分流规则的预设模板，各生成器调用后转换为格式特定语法
 * 规则集指向公开 GitHub 仓库（blackmatrix7/ios_rule_script），仅下载域名/IP 分类数据，零隐私风险
 */

// ========== 规则集 URL 映射 ==========

const RULE_SET_URLS = {
    Apple: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Apple/Apple.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Apple/Apple.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Apple/Apple.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Apple/Apple.list',
        singbox: 'geosite:apple',
    },
    GlobalMedia: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/GlobalMedia/GlobalMedia.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/GlobalMedia/GlobalMedia.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/GlobalMedia/GlobalMedia_No_Resolve.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/GlobalMedia/GlobalMedia.list',
        singbox: 'geosite:category-media-global',
    },
    Telegram: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Telegram/Telegram.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Telegram/Telegram.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Telegram/Telegram.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Telegram/Telegram.list',
        singbox: 'geosite:telegram',
    },
    China: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/China/China.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/China/China.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/China/China.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/China/China.list',
        singbox: 'geosite:cn',
    },
    YouTube: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/YouTube/YouTube.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/YouTube/YouTube.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/YouTube/YouTube.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/YouTube/YouTube.list',
        singbox: 'geosite:youtube',
    },
    Netflix: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Netflix/Netflix.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Netflix/Netflix.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Netflix/Netflix.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Netflix/Netflix.list',
        singbox: 'geosite:netflix',
    },
    Disney: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Disney/Disney.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Disney/Disney.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Disney/Disney.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Disney/Disney.list',
        singbox: 'geosite:disney',
    },
    Spotify: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Spotify/Spotify.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Spotify/Spotify.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Spotify/Spotify.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Spotify/Spotify.list',
        singbox: 'geosite:spotify',
    },
    Microsoft: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Microsoft/Microsoft.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Microsoft/Microsoft.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Microsoft/Microsoft.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Microsoft/Microsoft.list',
        singbox: 'geosite:microsoft',
    },
    Game: {
        surge: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Surge/Game/Game.list',
        clash: 'https://fastly.jsdelivr.net/gh/blackmatrix7/ios_rule_script@master/rule/Clash/Game/Game.yaml',
        loon: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/Loon/Game/Game.list',
        quanx: 'https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/rule/QuantumultX/Game/Game.list',
        singbox: 'geosite:category-games',
    },
};

export function getRuleSetUrl(category, format) {
    const entry = RULE_SET_URLS[category];
    if (!entry) return null;
    return entry[format] || null;
}

// ========== 模板定义 ==========

export const RULE_TEMPLATES = {
    basic: {
        name: '基础',
        description: '仅 GEOIP 分流，最简配置',
        extraGroups: [],
        rules: [
            { type: 'GEOIP', payload: 'CN', policy: 'DIRECT' },
            { type: 'FINAL', policy: '📶 节点选择' }
        ]
    },
    standard: {
        name: '标准',
        description: 'Apple / 媒体 / Telegram / 国内分流',
        extraGroups: [],
        rules: [
            { type: 'RULE-SET', category: 'Apple', policy: 'DIRECT', comment: '苹果服务直连' },
            { type: 'RULE-SET', category: 'GlobalMedia', policy: '📶 节点选择', comment: '全球媒体走代理' },
            { type: 'RULE-SET', category: 'Telegram', policy: '📶 节点选择', comment: '电报走代理' },
            { type: 'RULE-SET', category: 'China', policy: 'DIRECT', comment: '国内直连' },
            { type: 'GEOIP', payload: 'CN', policy: 'DIRECT' },
            { type: 'FINAL', policy: '📶 节点选择' }
        ]
    },
    full: {
        name: '完整',
        description: '细分 YouTube / Netflix / Telegram / 微软 / 游戏等',
        extraGroups: [
            { name: '🎬 YouTube', type: 'select', defaultPolicy: '📶 节点选择' },
            { name: '🎥 Netflix', type: 'select', defaultPolicy: '📶 节点选择' },
            { name: '📲 Telegram', type: 'select', defaultPolicy: '📶 节点选择' },
            { name: '🍎 Apple', type: 'select', defaultPolicy: 'DIRECT' },
            { name: '🪟 Microsoft', type: 'select', defaultPolicy: '📶 节点选择' },
            { name: '🎮 Game', type: 'select', defaultPolicy: '📶 节点选择' },
        ],
        rules: [
            { type: 'RULE-SET', category: 'YouTube', policy: '🎬 YouTube', comment: 'YouTube' },
            { type: 'RULE-SET', category: 'Netflix', policy: '🎥 Netflix', comment: 'Netflix' },
            { type: 'RULE-SET', category: 'Disney', policy: '📶 节点选择', comment: 'Disney+' },
            { type: 'RULE-SET', category: 'Spotify', policy: '📶 节点选择', comment: 'Spotify' },
            { type: 'RULE-SET', category: 'Telegram', policy: '📲 Telegram', comment: 'Telegram' },
            { type: 'RULE-SET', category: 'Apple', policy: '🍎 Apple', comment: 'Apple' },
            { type: 'RULE-SET', category: 'Microsoft', policy: '🪟 Microsoft', comment: 'Microsoft' },
            { type: 'RULE-SET', category: 'Game', policy: '🎮 Game', comment: '游戏' },
            { type: 'RULE-SET', category: 'GlobalMedia', policy: '📶 节点选择', comment: '其他全球媒体' },
            { type: 'RULE-SET', category: 'China', policy: 'DIRECT', comment: '国内直连' },
            { type: 'GEOIP', payload: 'CN', policy: 'DIRECT' },
            { type: 'FINAL', policy: '📶 节点选择' }
        ]
    }
};

export function getTemplate(templateId) {
    return RULE_TEMPLATES[templateId] || RULE_TEMPLATES.basic;
}

// ========== 格式特定渲染器 ==========

/**
 * Surge / Loon / Surfboard 格式的 [Rule] 行
 * Surfboard 不支持 RULE-SET，降级为 basic
 */
export function renderRulesForSurge(template, format = 'surge') {
    const lines = [];
    for (const rule of template.rules) {
        if (rule.comment) lines.push(`# ${rule.comment}`);
        if (rule.type === 'RULE-SET') {
            const url = getRuleSetUrl(rule.category, format);
            if (url) lines.push(`RULE-SET,${url},${rule.policy}`);
        } else if (rule.type === 'GEOIP') {
            lines.push(`GEOIP,${rule.payload},${rule.policy}`);
        } else if (rule.type === 'FINAL') {
            lines.push(format === 'loon' ? `FINAL,${rule.policy}` : `FINAL,${rule.policy},dns-failed`);
        }
    }
    return lines;
}

/**
 * Clash 格式的 rules 数组 + rule-providers 对象
 */
export function renderRulesForClash(template) {
    const rules = [];
    const ruleProviders = {};
    for (const rule of template.rules) {
        if (rule.type === 'RULE-SET') {
            const url = getRuleSetUrl(rule.category, 'clash');
            if (url) {
                const providerName = rule.category.toLowerCase();
                ruleProviders[providerName] = {
                    type: 'http',
                    behavior: 'classical',
                    url,
                    path: `./ruleset/${providerName}.yaml`,
                    interval: 86400
                };
                rules.push(`RULE-SET,${providerName},${rule.policy}`);
            }
        } else if (rule.type === 'GEOIP') {
            rules.push(`GEOIP,${rule.payload},${rule.policy}`);
        } else if (rule.type === 'FINAL') {
            rules.push(`MATCH,${rule.policy}`);
        }
    }
    return { rules, ruleProviders };
}

/**
 * Quantumult X 格式的 [filter_remote] 和 [filter_local]
 */
export function renderRulesForQuanx(template) {
    const filterRemote = [];
    const filterLocal = [];
    for (const rule of template.rules) {
        if (rule.type === 'RULE-SET') {
            const url = getRuleSetUrl(rule.category, 'quanx');
            if (url) {
                const tag = rule.comment || rule.category;
                const policy = rule.policy === 'DIRECT' ? 'direct' : rule.policy;
                filterRemote.push(`${url}, tag=${tag}, force-policy=${policy}, update-interval=86400`);
            }
        } else if (rule.type === 'GEOIP') {
            filterLocal.push(`geoip, ${rule.payload.toLowerCase()}, ${rule.policy.toLowerCase()}`);
        } else if (rule.type === 'FINAL') {
            filterLocal.push(`final, ${rule.policy}`);
        }
    }
    return { filterRemote, filterLocal };
}

/**
 * Sing-Box 格式的 route.rules 数组
 */
export function renderRulesForSingbox(template) {
    const rules = [{ protocol: 'dns', outbound: 'dns-out' }];
    for (const rule of template.rules) {
        if (rule.type === 'RULE-SET') {
            const geosite = getRuleSetUrl(rule.category, 'singbox');
            if (geosite && geosite.startsWith('geosite:')) {
                const site = geosite.replace('geosite:', '');
                const outbound = rule.policy === 'DIRECT' ? 'direct' : rule.policy === '📶 节点选择' ? 'proxy' : rule.policy;
                rules.push({ geosite: site, outbound });
            }
        } else if (rule.type === 'GEOIP') {
            rules.push({ geosite: 'cn', geoip: 'cn', outbound: 'direct' });
        }
        // FINAL is handled by route.final
    }
    return rules;
}

/**
 * 渲染额外策略组（full 模板的 YouTube/Netflix 等分组）
 * 返回格式无关的组定义数组，各生成器自行转换为格式特定语法
 */
export function getExtraGroups(template) {
    return template.extraGroups || [];
}
