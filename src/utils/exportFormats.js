export function getExportFormats() {
  return [
    {
      id: 'markdown',
      label: 'Markdown',
      description:
        'Editable text with formatting. Good for other writing tools and long-term storage.',
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
      description: 'A styled web page copy that opens in any browser.',
      extension: '.html',
      category: 'web',
    },
    {
      id: 'png',
      label: 'PNG Image',
      description: 'A high-quality image copy with transparency support.',
      extension: '.png',
      category: 'image',
    },
    {
      id: 'jpeg',
      label: 'JPEG Image',
      description: 'A smaller image file for sharing.',
      extension: '.jpg',
      category: 'image',
    },
    {
      id: 'pdf',
      label: 'PDF',
      description: 'A shareable document copy for printing or sending.',
      extension: '.pdf',
      category: 'document',
    },
  ];
}
