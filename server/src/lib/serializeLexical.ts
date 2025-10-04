export function serializeLexical(data: any): string {
    if (!data) return ''
    
    // Если это уже HTML строка
    if (typeof data === 'string') return data
    
    // Если это Lexical JSON
    if (data.root && Array.isArray(data.root.children)) {
      return serializeNodes(data.root.children)
    }
    
    return ''
  }
  
  function serializeNodes(nodes: any[]): string {
    return nodes.map(node => serializeNode(node)).join('')
  }
  
  function serializeNode(node: any): string {
    if (!node) return ''
    
    const type = node.type
    const children = node.children ? serializeNodes(node.children) : ''
    
    // Text node
    if (type === 'text') {
      let text = node.text || ''
      if (node.format) {
        if (node.format & 1) text = `<strong>${text}</strong>` // bold
        if (node.format & 2) text = `<em>${text}</em>` // italic
        if (node.format & 8) text = `<u>${text}</u>` // underline
        if (node.format & 4) text = `<s>${text}</s>` // strikethrough
        if (node.format & 16) text = `<code>${text}</code>` // code
      }
      return text
    }
    
    // Paragraph
    if (type === 'paragraph') {
      return `<p>${children}</p>`
    }
    
    // Headings
    if (type === 'heading') {
      const tag = node.tag || 'h2'
      return `<${tag}>${children}</${tag}>`
    }
    
    // Lists
    if (type === 'list') {
      const tag = node.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${children}</${tag}>`
    }
    
    if (type === 'listitem') {
      return `<li>${children}</li>`
    }
    
    // Quote
    if (type === 'quote') {
      return `<blockquote>${children}</blockquote>`
    }
    
    // Link
    if (type === 'link') {
      const url = node.url || '#'
      const rel = node.rel || 'noopener noreferrer'
      const target = node.target || '_blank'
      return `<a href="${url}" rel="${rel}" target="${target}">${children}</a>`
    }
    
    // Linebreak
    if (type === 'linebreak') {
      return '<br>'
    }
    
    // Default: just return children
    return children
  }