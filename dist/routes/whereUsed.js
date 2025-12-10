"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const url_1 = __importDefault(require("url"));
const router = express_1.default.Router();
function buildWhereUsedUrl(base, entity, attribute, top = 999) {
    const key = {
        target: {
            type: 'entityAttribute',
            id: attribute,
            parent: {
                type: 'entity',
                id: entity
            }
        }
    };
    const encodedKey = encodeURIComponent(JSON.stringify(key));
    return `${base.replace(/\/$/, '')}/sap/c4c/api/v1/where-used-service/usageDependencies?$top=${top}&resolveTexts=true&key=${encodedKey}`;
}
function fetchUrl(targetUrl, extraHeaders = {}) {
    return new Promise((resolve, reject) => {
        const parsed = url_1.default.parse(targetUrl);
        const get = parsed.protocol === 'https:' ? https_1.default.get : http_1.default.get;
        const options = {
            hostname: parsed.hostname,
            path: (parsed.path || '') + (parsed.search || ''),
            port: parsed.port,
            headers: {
                Accept: 'application/json',
                ...extraHeaders
            }
        };
        const req = get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (!data)
                    return resolve({});
                try {
                    const parsedBody = JSON.parse(data);
                    resolve(parsedBody);
                }
                catch (e) {
                    reject(new Error('Failed to parse JSON from remote service: ' + e.message));
                }
            });
        });
        req.on('error', (err) => reject(err));
        req.end();
    });
}
// GET /where-used?entity=...&attribute=...&serviceBase=...
router.get('/', async (req, res, next) => {
    const entity = String(req.query.entity || '');
    const attribute = String(req.query.attribute || req.query.extension || req.query.field || '');
    const serviceBase = String(req.query.serviceBase || req.get('X-Service-Base') || process.env.WHERE_USED_BASE || 'https://service7-staging.cxm-salescloud.com');
    const top = Number(req.query.top || 999);
    if (!entity || !attribute) {
        return res.status(400).json({ error: 'Missing required query params: entity and attribute' });
    }
    try {
        const targetUrl = buildWhereUsedUrl(serviceBase, entity, attribute, top);
        let authHeader;
        if (req.get('Authorization')) {
            authHeader = req.get('Authorization');
        }
        else if (process.env.WHERE_USED_BEARER) {
            authHeader = `Bearer ${process.env.WHERE_USED_BEARER}`;
        }
        else if (process.env.WHERE_USED_USER && process.env.WHERE_USED_PASS) {
            const cred = Buffer.from(`${process.env.WHERE_USED_USER}:${process.env.WHERE_USED_PASS}`).toString('base64');
            authHeader = `Basic ${cred}`;
        }
        const extraHeaders = {};
        if (authHeader)
            extraHeaders.Authorization = authHeader;
        const data = await fetchUrl(targetUrl, extraHeaders);
        const value = data && data.value ? data.value : [];
        const count = typeof data.count === 'number' ? data.count : value.length;
        const mapped = value.map((item) => ({
            target: item.target || null,
            usageContext: item.usageContext || null,
            documentHash2: item.documentHash2 || null,
            isHardDependency: !!item.isHardDependency
        }));
        res.json({ ok: true, sourceUrl: targetUrl, count, value: mapped });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
