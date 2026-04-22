/**
 * 策略组修剪器
 * 从上游 builtin-rules-provider.js 提取，用于清洗生成的策略组
 * 防止自引用、回环、空组等导致客户端报错的问题
 */

// 策略组标准名称常量
export const DEFAULT_SELECT_GROUP = '🚀 节点选择';
export const AUTO_SELECT_GROUP = '♻️ 自动选择';
export const FALLBACK_GROUP = '🔯 故障转移';
export const MANUAL_SELECT_GROUP = '👋 手动切换';

/**
 * 清理策略组中不存在的成员引用，防止自引用和回环
 * @param {Array} proxyGroups - 策略组对象数组（Clash 格式）
 *   Clash: [{ name, type, proxies: [...] }]
 *   Surge/Loon: 转换为 Clash 格式后传入
 * @param {Array} proxies - 可用代理对象数组
 * @returns {Array} 清理后的策略组数组
 */
export function pruneProxyGroups(proxyGroups, proxies) {
    const validTargetNames = new Set([
        ...proxies.map(p => p.tag || p.name),
        ...proxyGroups.map(g => g.name),
        DEFAULT_SELECT_GROUP,
        '📶 节点选择', // Surge/Loon 使用
        AUTO_SELECT_GROUP,
        FALLBACK_GROUP,
        MANUAL_SELECT_GROUP,
        ...['DIRECT', 'REJECT', 'REJECT-DROP', 'ANY'] // 各平台通用保留字
    ]);

    return proxyGroups.map(group => {
        if (!Array.isArray(group.proxies)) return group;

        const newProxies = group.proxies.filter(member => {
            // 核心修复 1：禁止策略组引用自身
            if (member === group.name) return false;

            // 核心修复 2：禁止非顶级组引用顶级入口组名，防止回环
            if (member === DEFAULT_SELECT_GROUP || member === '📶 节点选择') {
                // 只有顶级组自身可以包含这些名称
                return group.name === DEFAULT_SELECT_GROUP || group.name === '📶 节点选择';
            }

            // 正则过滤器的内容保留（如 ".*", "(HK)" 等）
            if (typeof member === 'string' && (member.startsWith('(') || member.includes('.*') || member.includes('+') || member.includes('$'))) {
                return true;
            }

            return validTargetNames.has(member);
        });

        // 兜底逻辑：如果清理后组为空，添加 DIRECT
        return {
            ...group,
            proxies: newProxies.length > 0 ? newProxies : ['DIRECT']
        };
    });
}

/**
 * 递归修剪所有成员为空的策略组，并清理相关引用
 * @param {Array} proxyGroups - 策略组数组
 * @returns {Array} 修剪后的策略组数组
 */
export function pruneEmptyGroups(proxyGroups) {
    let changed = true;
    const groups = [...proxyGroups];

    while (changed) {
        changed = false;
        const emptyGroupNames = new Set(
            groups
                .filter(g => !Array.isArray(g.proxies) || g.proxies.length === 0 || (g.proxies.length === 1 && g.proxies[0] === 'DIRECT' && g.type === 'url-test'))
                .map(g => g.name)
        );

        if (emptyGroupNames.size === 0) break;

        // 1. 移除空组本身
        const initialCount = groups.length;
        const filtered = groups.filter(g => !emptyGroupNames.has(g.name));
        if (filtered.length !== initialCount) changed = true;

        // 2. 从其它组的成员列表中移除对空组的引用
        filtered.forEach(group => {
            if (Array.isArray(group.proxies)) {
                const newProxies = group.proxies.filter(m => !emptyGroupNames.has(m));
                if (newProxies.length !== group.proxies.length) {
                    group.proxies = newProxies.length > 0 ? newProxies : ['DIRECT'];
                    changed = true;
                }
            }
        });

        // 重新赋值并继续检查
        groups.length = 0;
        groups.push(...filtered);
    }

    return groups;
}
