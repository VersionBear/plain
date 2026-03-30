function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}.`));

    reader.readAsDataURL(file);
  });
}

function buildImageAttributes(src, fileName = 'Image') {
  return {
    src,
    alt: fileName,
    caption: '',
    width: 72,
    align: 'center',
  };
}

export async function insertImageFiles(editor, files, options = {}) {
  const imageFiles = [...files].filter((file) =>
    file.type.startsWith('image/'),
  );

  if (!editor || imageFiles.length === 0) {
    return false;
  }

  let position = typeof options.position === 'number' ? options.position : null;

  for (const file of imageFiles) {
    const src = await readFileAsDataUrl(file);
    const chain = editor.chain().focus();

    if (typeof position === 'number') {
      chain.setTextSelection(position);
      position = null;
    }

    chain
      .insertContent({
        type: 'plainImage',
        attrs: buildImageAttributes(src, file.name),
      })
      .run();
  }

  return true;
}
