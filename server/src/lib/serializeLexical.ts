// src/lib/serializeLexical.ts
type LexicalNode = any;

function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeText(node: LexicalNode): string {
  let text = esc(node.text ?? '');
  const format = node.format ?? 0;
  const isBold = (format & 1) !== 0;
  const isItalic = (format & 2) !== 0;
  const isUnderline = (format & 4) !== 0;
  const isCode = (format & 8) !== 0;

  if (isCode) text = `<code>${text}</code>`;
  if (isUnderline) text = `<u>${text}</u>`;
  if (isItalic) text = `<em>${text}</em>`;
  if (isBold) text = `<strong>${text}</strong>`;
  return text;
}

function serializeChildren(nodes: LexicalNode[] = []): string {
  return nodes.map(serializeNode).join('');
}

function serializeLink(node: LexicalNode): string {
  const href = esc(node?.url || node?.attributes?.href || '#');
  const children = serializeChildren(node.children);
  const target = esc(node?.target || '_self');
  return `<a href="${href}" target="${target}" rel="noopener noreferrer">${children}</a>`;
}

function serializeList(node: LexicalNode): string {
  const isOl =
    node.tag === 'ol' ||
    node.type === 'ol' ||
    node.listType === 'number' ||
    node.listType === 'ol';
  const tag = isOl ? 'ol' : 'ul';
  const items = (node.children || [])
    .map((li: LexicalNode) => `<li>${serializeChildren(li.children)}</li>`)
    .join('');
  return `<${tag}>${items}</${tag}>`;
}

function serializeHeading(node: LexicalNode): string {
  const lvl =
    Number(node.tag?.toString().replace('h', '')) ||
    Number(node.level) ||
    1;
  const level = Math.min(Math.max(lvl, 1), 6);
  return `<h${level}>${serializeChildren(node.children)}</h${level}>`;
}

function serializeUpload(node: LexicalNode): string {
  // Payload Lexical upload/image node
  // { type: 'upload' | 'image', relationTo: 'media', value: { url, alt, align, width, ... } }
  const v = node?.value || node?.payload || {};
  const src = v?.url || v?.filename || '';
  if (!src) return '';

  const alt = esc(v?.alt || v?.title || '');
  const align = String(v?.align || 'center').toLowerCase() as
    | 'left'
    | 'center'
    | 'right';
  const widthStr = String(v?.width || '100'); // percentage as string
  const widthNum = Math.min(Math.max(parseInt(widthStr, 10) || 100, 1), 100);

  // Styles:
  // - use percentage width with max-width:100% for responsiveness
  // - floats for left/right, centered block for center
  const common = `max-width:100%;width:${widthNum}%;height:auto;`;
  const floatLeft =
    `float:left;margin:0.25rem 1rem 0.75rem 0;` + common;
  const floatRight =
    `float:right;margin:0.25rem 0 0.75rem 1rem;` + common;
  const centered =
    `display:block;margin:0.5rem auto;` + common;

  const style =
    align === 'left' ? floatLeft : align === 'right' ? floatRight : centered;

  // Wrap with figure for cleaner layout inside prose
  return `<figure style="overflow:hidden;">` +
         `<img src="${esc(src)}" alt="${alt}" style="${style}" />` +
         `</figure>`;
}

function serializeNode(node: LexicalNode): string {
  if (!node || typeof node !== 'object') return '';
  switch (node.type) {
    case 'root':
      return serializeChildren(node.children);
    case 'paragraph':
      return `<p>${serializeChildren(node.children)}</p>`;
    case 'heading':
      return serializeHeading(node);
    case 'quote':
      return `<blockquote>${serializeChildren(node.children)}</blockquote>`;
    case 'list':
      return serializeList(node);
    case 'listitem':
    case 'list-item':
      return `<li>${serializeChildren(node.children)}</li>`;
    case 'link':
      return serializeLink(node);
    case 'linebreak':
    case 'linebreaknode':
      return `<br/>`;
    case 'horizontalrule':
    case 'hr':
      return `<hr/>`;
    case 'text':
      return serializeText(node);
    case 'upload':
    case 'image':
      return serializeUpload(node);
    default:
      return serializeChildren(node.children);
  }
}

export function serializeLexical(value: any): string {
  if (!value) return ''
  const root = value.root || value
  if (!root || !Array.isArray(root.children)) return ''
  return serializeNode(root)
}
