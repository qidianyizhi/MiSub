/**
 * 内置 Surfboard 配置生成器
 * 不依赖外部 subconverter，直接将节点 URL 转换为 Surfboard 配置
 * Surfboard 格式类似 Surge 的子集（INI 格式）
 * 支持协议：SS、VMess、Trojan、HTTP(S)、SOCKS5
 * 注意：Surfboard 不支持 VLESS、Hysteria2、TUIC、Snell、WireGuard
 */

import { urlToClashProxy } from '../../utils/url-to-clash.js';
import { getUniqueName } from './name-utils.js';

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

function surfboardQuote(value) {
    if (!value) return '';
    if (/[,\s"=]/.test(value)) {
        return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
}

/**
 * 将 Clash 代理对象转换为 Surfboard [Proxy] 行
 */
function clashProxyToSurfboardLine(proxy) {
    if (!proxy || !proxy.server || !proxy.port) return null;

    const name = sanitizeNodeName(proxy.name);
    const type = (proxy.type || '').toLowerCase();
    const server = proxy.server;
    const port = proxy.port;
    const parts = [];

    if (type === 'ss' || type === 'shadowsocks') {
        parts.push(`${name} = ss`);
        parts.push(server);
        parts.push(String(port));
        parts.push(`encrypt-method=${proxy.cipher || 'aes-128-gcm'}`);
        parts.push(`password=${surfboardQuote(proxy.password || '')}`);
        if (proxy.plugin === 'obfs-local' || proxy.pluginOpts?.mode || proxy.obfs) {
            const obfsMode = proxy.pluginOpts?.mode || proxy.obfs;
            if (obfsMode === 'http' || obfsMode === 'tls') {
                parts.push(`obfs=${obfsMode}`);
                const obfsHost = proxy.pluginOpts?.host || proxy['obfs-host'];
                if (obfsHost) parts.push(`obfs-host=${obfsHost}`);
                const obfsUri = proxy.pluginOpts?.uri || proxy['obfs-uri'];
                if (obfsUri) parts.push(`obfs-uri=${obfsUri}`);
            }
        }
        if (proxy.udp) parts.push('udp-relay=true');
    } else if (type === 'vmess') {
        parts.push(`${name} = vmess`);
        parts.push(server);
        parts.push(String(port));
        parts.push(`username=${proxy.uuid || ''}`);
        if (proxy.tls) parts.push('tls=true');
        if (proxy.network === 'ws') {
            parts.push('ws=true');
            const wsOpts = proxy['ws-opts'] || proxy.wsOpts;
            if (wsOpts?.path) parts.push(`ws-path=${wsOpts.path}`);
            if (wsOpts?.headers?.Host) parts.push(`ws-headers=Host:${wsOpts.headers.Host}`);
        }
        if (proxy.alterId === 0 || proxy.alterId === undefined || proxy.alterId === null) {
            parts.push('vmess-aead=true');
        }
        if (proxy.sni || proxy.servername) parts.push(`sni=${proxy.sni || proxy.servername}`);
        if (proxy['skip-cert-verify']) parts.push('skip-cert-verify=true');
        if (proxy.tfo) parts.push('tfo=true');
    } else if (type === 'trojan') {
        parts.push(`${name} = trojan`);
        parts.push(server);
        parts.push(String(port));
        parts.push(`password=${surfboardQuote(proxy.password || '')}`);
        if (proxy.network === 'ws') {
            parts.push('ws=true');
            const wsOpts = proxy['ws-opts'] || proxy.wsOpts;
            if (wsOpts?.path) parts.push(`ws-path=${wsOpts.path}`);
            if (wsOpts?.headers?.Host) parts.push(`ws-headers=Host:${wsOpts.headers.Host}`);
        }
        if (proxy.sni || proxy.servername) parts.push(`sni=${proxy.sni || proxy.servername}`);
        if (proxy['skip-cert-verify']) parts.push('skip-cert-verify=true');
        if (proxy.tfo) parts.push('tfo=true');
    } else if (type === 'http' || type === 'https') {
        parts.push(`${name} = ${type}`);
        parts.push(server);
        parts.push(String(port));
        if (proxy.username) parts.push(proxy.username);
        if (proxy.password) parts.push(proxy.password);
        if (proxy['skip-cert-verify']) parts.push('skip-cert-verify=true');
    } else if (type === 'socks5' || type === 'socks5-tls') {
        parts.push(`${name} = socks5`);
        parts.push(server);
        parts.push(String(port));
        if (proxy.username) parts.push(`username=${proxy.username}`);
        if (proxy.password) parts.push(`password=${surfboardQuote(proxy.password)}`);
        if (proxy['skip-cert-verify']) parts.push('skip-cert-verify=true');
    } else {
        // Surfboard 不支持 VLESS、Hysteria2、TUIC、Snell、WireGuard
        console.warn(`[BuiltinSurfboard] 跳过不支持的协议: ${type} (${name})`);
        return null;
    }

    return parts.join(', ');
}

/**
 * 生成完整的 Surfboard 配置
 */
export function generateBuiltinSurfboardConfig(nodeList, options = {}) {
    const { fileName = 'MiSub', managedConfigUrl = '', skipCertVerify = false, ruleTemplate = 'standard' } = options;
    // 注意：Surfboard 不支持远程 RULE-SET，始终使用基础内联规则（GEOIP + FINAL）

    const cleanedNodeList = cleanControlChars(nodeList);
    const nodeUrls = cleanedNodeList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    const proxyLines = [];
    const proxyNames = [];
    const usedNames = new Map();

    for (const url of nodeUrls) {
        const clashProxy = urlToClashProxy(url);
        if (!clashProxy) continue;
        if (skipCertVerify) clashProxy['skip-cert-verify'] = true;

        const baseName = sanitizeNodeName(clashProxy.name);
        const uniqueName = getUniqueName(baseName, usedNames);
        clashProxy.name = uniqueName;

        const line = clashProxyToSurfboardLine(clashProxy);
        if (line) {
            proxyLines.push(line);
            proxyNames.push(uniqueName);
        }
    }

    if (proxyLines.length === 0) {
        return `#!MANAGED-CONFIG ${managedConfigUrl} interval=86400 strict=true\n\n[General]\nloglevel = notify\n\n[Proxy]\nDIRECT = direct\n\n[Proxy Group]\n\n[Rule]\nMATCH,DIRECT\n`;
    }

    const sections = [];

    // Managed config header
    if (managedConfigUrl) {
        sections.push(`#!MANAGED-CONFIG ${managedConfigUrl} interval=86400 strict=true`);
    }

    // [General]
    sections.push(`[General]
loglevel = notify
interface = 127.0.0.1
skip-proxy = 127.0.0.1, 192.168.0.0/16, 10.0.0.0/8, 172.16.0.0/12, 100.64.0.0/10, localhost, *.local
ipv6 = false
dns-server = system, 223.5.5.5, 8.8.8.8
exclude-simple-hostnames = true
enhanced-mode-by-rule = true`);

    // [Proxy]
    sections.push(`[Proxy]\nDIRECT = direct\n${proxyLines.join('\n')}`);

    // [Proxy Group]
    const proxyNamesStr = proxyNames.join(', ');
    const groupLines = [
        `📶 节点选择 = select, 🚀 自动选择, DIRECT, ${proxyNamesStr}`,
        `🚀 自动选择 = url-test, ${proxyNamesStr}, url=http://www.gstatic.com/generate_204, interval=300, tolerance=50`
    ];
    sections.push(`[Proxy Group]\n${groupLines.join('\n')}`);

    // [Rule]
    const ruleLines = [
        'GEOIP,CN,DIRECT',
        'MATCH,📶 节点选择'
    ];
    sections.push(`[Rule]\n${ruleLines.join('\n')}`);

    return sections.join('\n\n') + '\n';
}
