export function normalizeUrl(url) {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return '';
  }

  if (/^(https?:|mailto:|tel:)/i.test(trimmedUrl)) {
    return trimmedUrl;
  }

  return `https://${trimmedUrl}`;
}

export function isUrlLikeSelection(value) {
  return Boolean(value) && /^https?:\/\/\S+$/i.test(value.trim());
}
