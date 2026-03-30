/**
 * 内置 Sing-Box 配置生成器
 * 不依赖外部 subconverter，直接将节点 URL 转换为 Sing-Box JSON 配置
 * 支持协议：SS、VMess、VLESS、Trojan、Hysteria2、TUIC、WireGuard
 */

import { urlToClashProxy } from '../../utils/url-to-clash.js';
import { getUniqueName } from './name-utils.js';
import { getTemplate, renderRulesForSingbox, getExtraGroups } from './rule-templates.js';

function cleanControlChars(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * 构建 TLS 子对象
 */
function buildTls(proxy, skipCertVerify) {
    const tls = {
        enabled: true,
        server_name: proxy.sni || proxy.servername || proxy.server
    };
    if (skipCertVerify || proxy['skip-cert-verify']) {
        tls.insecure = true;
    }
    if (proxy.alpn) {
        tls.alpn = Array.isArray(proxy.alpn) ? proxy.alpn : [proxy.alpn];
    }
    if (proxy['client-fingerprint']) {
        tls.utls = { enabled: true, fingerprint: proxy['client-fingerprint'] };
    }
    const realityOpts = proxy['reality-opts'] || proxy.realityOpts;
    if (realityOpts) {
        tls.reality = {
            enabled: true,
            public_key: realityOpts['public-key'],
            short_id: realityOpts['short-id'] || ''
        };
    }
    return tls;
}

/**
 * 构建 Transport 子对象
 */
function buildTransport(proxy) {
    const network = proxy.network;
    if (!network || network === 'tcp') return undefined;

    if (network === 'ws') {
        const wsOpts = proxy['ws-opts'] || proxy.wsOpts || {};
        const transport = { type: 'ws' };
        if (wsOpts.path) transport.path = wsOpts.path;
        if (wsOpts.headers?.Host) {
            transport.headers = { Host: [wsOpts.headers.Host] };
        }
        if (wsOpts['max-early-data']) {
            transport.max_early_data = wsOpts['max-early-data'];
            if (wsOpts['early-data-header-name']) {
                transport.early_data_header_name = wsOpts['early-data-header-name'];
            }
        }
        return transport;
    }

    if (network === 'grpc') {
        const grpcOpts = proxy['grpc-opts'] || proxy.grpcOpts || {};
        return {
            type: 'grpc',
            service_name: grpcOpts['grpc-service-name'] || ''
        };
    }

    if (network === 'h2' || network === 'http') {
        const h2Opts = proxy['h2-opts'] || proxy.httpOpts || {};
        const transport = { type: 'http' };
        if (h2Opts.host) {
            transport.host = Array.isArray(h2Opts.host) ? h2Opts.host : [h2Opts.host];
        }
        if (h2Opts.path) transport.path = h2Opts.path;
        return transport;
    }

    return undefined;
}

/**
 * 将 Clash 代理对象转换为 Sing-Box outbound
 */
function clashProxyToSingboxOutbound(proxy, skipCertVerify) {
    if (!proxy || !proxy.server || !proxy.port) return null;

    const type = (proxy.type || '').toLowerCase();
    const base = {
        tag: proxy.name,
        server: proxy.server,
        server_port: Number(proxy.port)
    };

    if (type === 'ss' || type === 'shadowsocks') {
        return {
            type: 'shadowsocks',
            ...base,
            method: proxy.cipher || 'aes-128-gcm',
            password: proxy.password || ''
        };
    }

    if (type === 'vmess') {
        const outbound = {
            type: 'vmess',
            ...base,
            uuid: proxy.uuid || '',
            security: proxy.cipher === 'auto' ? 'auto' : (proxy.cipher || 'auto'),
            alter_id: proxy.alterId || 0
        };
        if (proxy.tls) {
            outbound.tls = buildTls(proxy, skipCertVerify);
        }
        const transport = buildTransport(proxy);
        if (transport) outbound.transport = transport;
        return outbound;
    }

    if (type === 'vless') {
        const outbound = {
            type: 'vless',
            ...base,
            uuid: proxy.uuid || ''
        };
        if (proxy.flow) outbound.flow = proxy.flow;
        if (proxy.tls || proxy.security === 'reality' || proxy['reality-opts']) {
            outbound.tls = buildTls(proxy, skipCertVerify);
        }
        const transport = buildTransport(proxy);
        if (transport) outbound.transport = transport;
        return outbound;
    }

    if (type === 'trojan') {
        const outbound = {
            type: 'trojan',
            ...base,
            password: proxy.password || ''
        };
        outbound.tls = buildTls(proxy, skipCertVerify);
        const transport = buildTransport(proxy);
        if (transport) outbound.transport = transport;
        return outbound;
    }

    if (type === 'hysteria2' || type === 'hy2') {
        const outbound = {
            type: 'hysteria2',
            ...base,
            password: proxy.password || ''
        };
        outbound.tls = buildTls(proxy, skipCertVerify);
        if (proxy.obfs) {
            outbound.obfs = { type: proxy.obfs, password: proxy['obfs-password'] || '' };
        }
        return outbound;
    }

    if (type === 'tuic') {
        const outbound = {
            type: 'tuic',
            ...base,
            uuid: proxy.uuid || proxy.token || '',
            password: proxy.password || ''
        };
        outbound.tls = buildTls(proxy, skipCertVerify);
        if (proxy['congestion-controller']) {
            outbound.congestion_control = proxy['congestion-controller'];
        }
        return outbound;
    }

    if (type === 'wireguard') {
        const outbound = {
            type: 'wireguard',
            ...base,
            private_key: proxy['private-key'] || '',
            peer_public_key: proxy['public-key'] || '',
            local_address: []
        };
        if (proxy.ip) {
            const ips = Array.isArray(proxy.ip) ? proxy.ip : [proxy.ip];
            outbound.local_address = ips.map(ip => ip.includes(':') ? `${ip}/128` : `${ip}/32`);
        }
        if (proxy.reserved) {
            outbound.reserved = Array.isArray(proxy.reserved) ? proxy.reserved : [proxy.reserved];
        }
        if (proxy.mtu) outbound.mtu = proxy.mtu;
        if (proxy.dns) {
            const dnsArr = Array.isArray(proxy.dns) ? proxy.dns : [proxy.dns];
            outbound.local_address.length > 0 && (outbound.dns = { servers: dnsArr });
        }
        return outbound;
    }

    // 不支持的协议
    console.warn(`[BuiltinSingbox] 跳过不支持的协议: ${type} (${proxy.name})`);
    return null;
}

/**
 * 生成完整的 Sing-Box 配置
 * @param {string} nodeList - 节点列表（换行分隔的 URL）
 * @param {Object} options - 配置选项
 * @returns {string} Sing-Box JSON 配置
 */
export function generateBuiltinSingboxConfig(nodeList, options = {}) {
    const { fileName = 'MiSub', skipCertVerify = false, enableUdp = true, ruleTemplate = 'standard' } = options;

    const cleanedNodeList = cleanControlChars(nodeList);
    const nodeUrls = cleanedNodeList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));

    const outbounds = [];
    const outboundTags = [];
    const usedNames = new Map();

    for (const url of nodeUrls) {
        const clashProxy = urlToClashProxy(url);
        if (!clashProxy) continue;

        const baseName = clashProxy.name || 'Untitled';
        clashProxy.name = getUniqueName(baseName, usedNames);

        const outbound = clashProxyToSingboxOutbound(clashProxy, skipCertVerify);
        if (outbound) {
            outbounds.push(outbound);
            outboundTags.push(outbound.tag);
        }
    }

    if (outbounds.length === 0) {
        return JSON.stringify({ log: { level: 'info' }, outbounds: [{ tag: 'direct', type: 'direct' }] }, null, 2);
    }

    const template = getTemplate(ruleTemplate);
    const extraGroups = getExtraGroups(template);

    // 构建额外策略组的 outbounds
    const extraOutbounds = extraGroups.map(g => ({
        tag: g.name,
        type: 'selector',
        outbounds: g.defaultPolicy === 'DIRECT'
            ? ['direct', 'proxy', ...outboundTags]
            : ['proxy', 'auto', 'direct', ...outboundTags]
    }));

    const config = {
        log: { level: 'info', timestamp: true },
        dns: {
            servers: [
                { tag: 'google', address: 'tls://8.8.8.8' },
                { tag: 'alidns', address: 'https://223.5.5.5/dns-query', detour: 'direct' }
            ],
            rules: [
                { geosite: 'cn', server: 'alidns' }
            ],
            strategy: 'prefer_ipv4'
        },
        outbounds: [
            {
                tag: 'proxy',
                type: 'selector',
                outbounds: ['auto', ...outboundTags, 'direct']
            },
            {
                tag: 'auto',
                type: 'urltest',
                outbounds: [...outboundTags],
                url: 'http://www.gstatic.com/generate_204',
                interval: '3m',
                tolerance: 50
            },
            ...extraOutbounds,
            ...outbounds,
            { tag: 'direct', type: 'direct' },
            { tag: 'block', type: 'block' },
            { tag: 'dns-out', type: 'dns' }
        ],
        route: {
            rules: renderRulesForSingbox(template),
            auto_detect_interface: true,
            final: 'proxy'
        }
    };

    return JSON.stringify(config, null, 2);
}
