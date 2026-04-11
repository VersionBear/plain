/**
 * Image asset management for file-system storage.
 * Extracts base64 images from HTML, saves them as individual files,
 * and resolves asset paths back to data URLs when loading notes.
 */

const ASSETS_DIR_NAME = 'assets';

/**
 * Generate a stable, deterministic filename for an image based on its content.
 */
async function generateAssetFilename(dataUrl, index) {
  // Extract the raw base64 data (without the data:image/...;base64, prefix)
  const base64Data = dataUrl.split(',')[1] || '';

  // Compute a short hash from the first 12 bytes of base64 data
  const hashInput = base64Data.slice(0, 64);
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const shortHash = Math.abs(hash).toString(36).slice(0, 8);

  // Determine extension from the data URL mime type
  const mimeMatch = dataUrl.match(/^data:(image\/\w+)/);
  let ext = 'png';
  if (mimeMatch) {
    const mime = mimeMatch[1];
    const extMap = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
    };
    ext = extMap[mime] || 'png';
  }

  return `img-${shortHash}-${index}.${ext}`;
}

/**
 * Extract all base64 image sources from an HTML string.
 * Returns an array of { src, element } for each <img> with a data URL.
 */
function extractDataUrlImages(html) {
  if (typeof DOMParser === 'undefined') {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  const images = [];

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('data:image/')) {
      images.push({ src, element: img });
    }
  });

  return images;
}

/**
 * Replace base64 image sources in HTML with relative asset paths.
 * Returns { html, assets } where assets is a Map of filename -> dataUrl.
 */
export async function extractImageAssets(html) {
  const dataUrlImages = extractDataUrlImages(html);
  const assets = new Map();

  if (dataUrlImages.length === 0) {
    return { html, assets };
  }

  for (let i = 0; i < dataUrlImages.length; i++) {
    const { src, element } = dataUrlImages[i];
    const filename = await generateAssetFilename(src, i);
    const relativePath = `./${ASSETS_DIR_NAME}/${filename}`;

    assets.set(filename, src);
    element.setAttribute('src', relativePath);
  }

  const doc = dataUrlImages[0]?.element?.ownerDocument;
  const processedHtml = doc?.body?.innerHTML || html;

  return { html: processedHtml, assets };
}

/**
 * Resolve relative asset paths in HTML back to data URLs.
 * Reads asset files from the given assetsDirHandle and replaces
 * relative paths like ./assets/img-xxx.png with data URLs.
 */
export async function resolveImageAssets(html, assetsDirHandle) {
  if (!html || typeof DOMParser === 'undefined' || !assetsDirHandle) {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  let modified = false;

  const images = doc.querySelectorAll('img');
  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src || !src.startsWith(`./${ASSETS_DIR_NAME}/`)) {
      continue;
    }

    const filename = src.replace(`./${ASSETS_DIR_NAME}/`, '');
    try {
      const fileHandle = await assetsDirHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const dataUrl = await readFileAsDataUrl(file);
      img.setAttribute('src', dataUrl);
      modified = true;
    } catch {
      // Asset file not found — leave the path as-is, the image won't render
    }
  }

  if (!modified) {
    return html;
  }

  return doc.body.innerHTML;
}

/**
 * Read a File object as a data URL.
 */
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

/**
 * Write an asset file (data URL) to the assets directory.
 */
async function writeAssetFile(assetsDirHandle, filename, dataUrl) {
  const fileHandle = await assetsDirHandle.getFileHandle(filename, {
    create: true,
  });
  const writable = await fileHandle.createWritable();

  // Convert data URL to raw bytes
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  await writable.write(blob);
  await writable.close();
}

/**
 * Save extracted image assets to the assets directory.
 * Also cleans up orphaned asset files (files in assets/ not referenced
 * by the current set of asset filenames).
 */
export async function saveImageAssets(assetsDirHandle, assets, currentFilenames) {
  if (!assetsDirHandle) {
    return;
  }

  const currentSet = new Set(currentFilenames);

  // Write new/updated assets
  for (const [filename, dataUrl] of assets) {
    await writeAssetFile(assetsDirHandle, filename, dataUrl);
  }

  // Clean up orphaned files
  try {
    for await (const entry of assetsDirHandle.values()) {
      if (entry.kind === 'file' && !currentSet.has(entry.name)) {
        await assetsDirHandle.removeEntry(entry.name);
      }
    }
  } catch {
    // Directory might not exist or be empty — that's fine
  }
}

/**
 * Get the list of filenames currently in the assets directory.
 */
export async function listAssetFiles(assetsDirHandle) {
  if (!assetsDirHandle) {
    return [];
  }

  const filenames = [];
  try {
    for await (const entry of assetsDirHandle.values()) {
      if (entry.kind === 'file') {
        filenames.push(entry.name);
      }
    }
  } catch {
    // Directory might not exist
  }

  return filenames;
}

/**
 * Ensure the assets subdirectory exists within a parent directory.
 */
export async function ensureAssetsDir(parentDirHandle) {
  return parentDirHandle.getDirectoryHandle(ASSETS_DIR_NAME, { create: true });
}

/**
 * Check if an HTML string contains any relative asset references.
 */
export function hasAssetReferences(html) {
  if (!html || typeof html !== 'string') {
    return false;
  }
  return html.includes(`./${ASSETS_DIR_NAME}/`);
}
