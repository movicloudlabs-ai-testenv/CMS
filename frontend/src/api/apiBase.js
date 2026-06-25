const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

const configuredBaseRaw = trimTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE
);

function normalizeHostBase(value) {
  if (!value) return '';
  return value.endsWith('/api') ? value.slice(0, -4) : value;
}

function resolveHostBase() {
  const configuredBase = normalizeHostBase(configuredBaseRaw);
  if (configuredBase) return configuredBase;

  // Render static rewrite for /api is unreliable in this deployment,
  // so use direct backend host in production by default.
  if (!import.meta.env.DEV && typeof window !== 'undefined') {
    const host = window.location.hostname;
    const match = host.match(/^(cms-main|cms-frontend)-([a-z0-9]+)\.onrender\.com$/);
    if (match) {
      const suffix = match[2];
      return `https://cms-backend-${suffix}.onrender.com`;
    }
    if (host === 'cms1-weof.onrender.com') {
      return 'https://cms-x82g.onrender.com';
    }
    if (host === 'cms-main-nv6w.onrender.com' || host.endsWith('-nv6w.onrender.com')) {
      return 'https://cms-backend-oj7w.onrender.com';
    }
  }

  return '';
}

const hostBase = resolveHostBase();

export const API_BASE = hostBase ? `${trimTrailingSlash(hostBase)}/api` : '/api';

export function buildApiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
}

export function buildUploadUrl(fileName) {
  if (!fileName) return '';
  if (fileName.startsWith('http') || fileName.startsWith('/uploads')) return fileName;
  const base = hostBase || '';
  return `${trimTrailingSlash(base)}/uploads/${fileName}`;
}
