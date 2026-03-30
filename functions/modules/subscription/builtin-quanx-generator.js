/**
 * 内置 Quantumult X 配置生成器
 * 不依赖外部 subconverter，直接将节点 URL 转换为 QX 配置
 * 支持协议：SS、VMess、Trojan、Hysteria2、TUIC
 * 注意：QX 不原生支持 VLESS，VLESS 节点会被跳过
 */

import { urlToClashProxy } from '../../utils/url-to-clash.js';
import { getUniqueName } from './name-utils.js';
import { getTemplate, renderRulesForQuanx, getExtraGroups } from './rule-templates.js';

function cleanControlChars(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function sanitizeNodeName(name) {
    if (!name) return 'Untitled';
    let safe = cleanControlChars(name);
    safe = safe.replace(/,/g, ' ').replace(/=/g, '-');
    safe = safe.replace(/\s+/g, ' ').trim();
    return safe || 'Untitled';
}

/**
 * 将 Clash 代理对象转换为 QX server_local 行
 */
function clashProxyToQuanxLine(proxy) {
    if (!proxy || !proxy.server || !proxy.port) return null;

    const name = sanitizeNodeName(proxy.name);
    const type = (proxy.type || '').toLowerCase();
    const server = proxy.server;
    const port = proxy.port;
    const parts = [];

    if (type === 'ss' || type === 'shadowsocks') {
        parts.push(`shadowsocks=${server}:${port}`);
        parts.push(`method=${proxy.cipher || 'aes-128-gcm'}`);
        parts.push(`password=${proxy.password || ''}`);
        // obfs 支持
        if (proxy.plugin === 'obfs-local' || proxy.obfs) {
            const obfsMode = proxy.pluginOpts?.mode || proxy.obfs;
            if (obfsMode === 'http' || obfsMode === 'tls') {
                parts.push(`obfs=${obfsMode}`);
                const obfsHost = proxy.pluginOpts?.host || proxy['obfs-host'];
                if (obfsHost) parts.push(`obfs-host=${obfsHost}`);
                const obfsUri = proxy.pluginOpts?.uri || proxy['obfs-uri'];
                if (obfsUri) parts.push(`obfs-uri=${obfsUri}`);
            }
        }
        parts.push('fast-open=false');
        parts.push('udp-relay=true');
        parts.push(`tag=${name}`);
        return parts.join(', ');
    }

    if (type === 'vmess') {
        parts.push(`vmess=${server}:${port}`);
        parts.push(`method=${proxy.cipher === 'auto' ? 'chacha20-poly1305' : (proxy.cipher || 'chacha20-poly1305')}`);
        parts.push(`password=${proxy.uuid || ''}`);
        // TLS
        if (proxy.tls) {
            parts.push('obfs=over-tls');
            const sni = proxy.sni || proxy.servername;
            if (sni) parts.push(`obfs-host=${sni}`);
            parts.push(`tls-verification=${proxy['skip-cert-verify'] ? 'false' : 'true'}`);
        }
        // WebSocket
        if (proxy.network === 'ws') {
            const wsOpts = proxy['ws-opts'] || proxy.wsOpts || {};
            if (proxy.tls) {
                parts.push('obfs=wss');
            } else {
                parts.push('obfs=ws');
            }
            if (wsOpts.headers?.Host) parts.push(`obfs-host=${wsOpts.headers.Host}`);
            if (wsOpts.path) parts.push(`obfs-uri=${wsOpts.path}`);
        }
        parts.push('fast-open=false');
        parts.push('udp-relay=true');
        parts.push(`tag=${name}`);
        return parts.join(', ');
    }

    if (type === 'trojan') {
        parts.push(`trojan=${server}:${port}`);
        parts.push(`password=${proxy.password || ''}`);
        parts.push('over-tls=true');
        const sni = proxy.sni || proxy.servername;
        if (sni) parts.push(`tls-host=${sni}`);
        parts.push(`tls-verification=${proxy['skip-cert-verify'] ? 'false' : 'true'}`);
        // WebSocket
        if (proxy.network === 'ws') {
            const wsOpts = proxy['ws-opts'] || proxy.wsOpts || {};
            parts.push('obfs=wss');
            if (wsOpts.headers?.Host) parts.push(`obfs-host=${wsOpts.headers.Host}`);
            if (wsOpts.path) parts.push(`obfs-uri=${wsOpts.path}`);
        }
        parts.push('fast-open=false');
        parts.push('udp-relay=true');
        parts.push(`tag=${name}`);
        return parts.join(', ');
    }

    if (type === 'hysteria2' || type === 'hy2') {
        parts.push(`hysteria2=${server}:${port}`);
        parts.push(`password=${proxy.password || ''}`);
        const sni = proxy.sni || proxy.servername;
        if (sni) parts.push(`sni=${sni}`);
        if (proxy['skip-cert-verify']) parts.push('tls-verification=false');
        parts.push('fast-open=false');
        parts.push('udp-relay=true');
        parts.push(`tag=${name}`);
        return parts.join(', ');
    }

    if (type === 'tuic') {
        parts.push(`tuic-v5=${server}:${port}`);
        parts.push(`password=${proxy.password || ''}`);
        parts.push(`uuid=${proxy.uuid || proxy.token || ''}`);
        if (proxy.alpn) {
            const alpnStr = Array.isArray(proxy.alpn) ? proxy.alpn[0] : proxy.alpn;
            parts.push(`alpn=${alpnStr}`);
        }
        const sni = proxy.sni || proxy.servername;
        if (sni) parts.push(`sni=${sni}`);
        if (proxy['skip-cert-verify']) parts.push('tls-verification=false');
        parts.push('fast-open=false');
        parts.push('udp-relay=true');
        parts.push(`tag=${name}`);
        return parts.join(', ');
    }

    if (type === 'vless') {
        console.warn(`[BuiltinQuanX] 跳过不支持的 VLESS 节点: ${name}`);
        return null;
    }

    // 其他不支持的协议
    console.warn(`[BuiltinQuanX] 跳过不支持的协议: ${type} (${name})`);
    return null;
}

/**
 * 生成完整的 Quantumult X 配置
 * @param {string} nodeList - 节点列表（换行分隔的 URL）
 * @param {Object} options - 配置选项
 * @returns {string} QX 配置文本
 */
export function generateBuiltinQuanxConfig(nodeList, options = {}) {
    const { fileName = 'MiSub', skipCertVerify = false, ruleTemplate = 'standard' } = options;

    const cleanedNodeList = cleanControlChars(nodeList);
    const nodeUrls = cleanedNodeList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    const serverLines = [];
    const proxyNames = [];
    const usedNames = new Map();

    for (const url of nodeUrls) {
        const clashProxy = urlToClashProxy(url);
        if (!clashProxy) continue;

        if (skipCertVerify) {
            clashProxy['skip-cert-verify'] = true;
        }

        const baseName = sanitizeNodeName(clashProxy.name);
        const uniqueName = getUniqueName(baseName, usedNames);
        clashProxy.name = uniqueName;

        const line = clashProxyToQuanxLine(clashProxy);
        if (line) {
            serverLines.push(line);
            proxyNames.push(uniqueName);
        }
    }

    if (serverLines.length === 0) {
        return `[general]\nserver_check_url=http://www.gstatic.com/generate_204\n\n[server_local]\n# No valid proxies found\n`;
    }

    const proxyNamesStr = proxyNames.join(', ');

    const sections = [];

    // [general]
    sections.push(`[general]
server_check_url=http://www.gstatic.com/generate_204
dns_exclusion_list=*.cmpassport.com, *.jegotrip.com.cn, *.icitymobile.mobi, id6.me`);

    // [dns]
    sections.push(`[dns]
server=223.5.5.5
server=119.29.29.29
server=8.8.8.8`);

    // [policy]
    const template = getTemplate(ruleTemplate);
    const extraGroups = getExtraGroups(template);
    const iconRepo = 'https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color';
    const policyLines = [
        `static=节点选择, auto, direct, ${proxyNamesStr}, img-url=${iconRepo}/Proxy.png`,
        `url-latency-benchmark=auto, ${proxyNamesStr}, check-interval=300, tolerance=50, img-url=${iconRepo}/Speedtest.png`
    ];
    for (const g of extraGroups) {
        const defaultProxies = g.defaultPolicy === 'DIRECT'
            ? `direct, 节点选择, ${proxyNamesStr}`
            : `节点选择, auto, direct, ${proxyNamesStr}`;
        policyLines.push(`static=${g.name}, ${defaultProxies}, img-url=${iconRepo}/Proxy.png`);
    }
    sections.push(`[policy]\n${policyLines.join('\n')}`);

    // [server_local]
    sections.push(`[server_local]\n${serverLines.join('\n')}`);

    // [filter_local] + [filter_remote] — 从规则模板生成
    const { filterRemote, filterLocal } = renderRulesForQuanx(template);
    sections.push(`[filter_local]\n${filterLocal.join('\n')}`);
    sections.push(`[filter_remote]\n${filterRemote.join('\n')}`);

    return sections.join('\n\n') + '\n';
}
