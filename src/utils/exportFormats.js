export function getExportFormats() {
  return [
    {
      id: 'markdown',
      label: 'Markdown',
      description:
        'Editable text with formatting. Great for Obsidian, Notion, and editors.',
      extension: '.md',
      category: 'text',
    },
    {
      id: 'text',
      label: 'Plain Text',
      description: 'Simple text-only format with no formatting.',
      extension: '.txt',
      category: 'text',
    },
    {
      id: 'html',
      label: 'HTML',
      description: 'Web page with embedded styles. Opens in any browser.',
      extension: '.html',
      category: 'web',
    },
    {
      id: 'png',
      label: 'PNG Image',
      description: 'High-quality image with transparency support.',
      extension: '.png',
      category: 'image',
    },
    {
      id: 'jpeg',
      label: 'JPEG Image',
      description: 'Compressed image, smaller file size.',
      extension: '.jpg',
      category: 'image',
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'Document format, perfect for sharing and printing.',
      extension: '.pdf',
      category: 'document',
    },
  ];
}
