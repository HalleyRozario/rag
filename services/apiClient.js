const axios = require('axios');

function buildAuthHeader(req) {
  if (req && req.headers && req.headers.authorization) {
    return { Authorization: req.headers.authorization };
  }
  if (process.env.WHERE_USED_BEARER) {
    return { Authorization: `Bearer ${process.env.WHERE_USED_BEARER}` };
  }
  if (process.env.WHERE_USED_USER && process.env.WHERE_USED_PASS) {
    const token = Buffer.from(`${process.env.WHERE_USED_USER}:${process.env.WHERE_USED_PASS}`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }
  return {};
}

async function get(urlPath, { req = null, params = {}, timeout = 10000, baseUrl = null } = {}) {
  const base = (baseUrl || process.env.WHERE_USED_BASE || '').replace(/\/$/, '');
  const url = base ? `${base}${urlPath.startsWith('/') ? '' : '/'}${urlPath}` : urlPath;
  const headers = Object.assign({ Accept: 'application/json' }, buildAuthHeader(req));

  try {
    const resp = await axios.get(url, { params, headers, timeout });
    return { ok: true, status: resp.status, data: resp.data, sourceUrl: resp.config.url };
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    const data = err.response ? err.response.data : { message: err.message };
    return { ok: false, status, data, sourceUrl: err.config ? err.config.url : url };
  }
}

async function requestWhereUsed({ entity, attribute, top = 999, resolveTexts = true, req = null, baseUrl = null } = {}) {
  if (!entity || !attribute) throw new Error('entity and attribute are required');
  const key = JSON.stringify({
    target: {
      type: 'entityAttribute',
      id: attribute,
      parent: { type: 'entity', id: entity }
    }
  });
  const params = { $top: top, resolveTexts: String(resolveTexts), key };
  const path = '/sap/c4c/api/v1/where-used-service/usageDependencies';
  return get(path, { req, params, baseUrl });
}

module.exports = { get, requestWhereUsed };
