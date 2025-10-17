// Helper function to parse data URLs
function parseDataUrl(url) {
  if (!url.startsWith('data:')) {
    return null;
  }
  
  const match = url.match(/^data:([^;]+)(;base64)?,(.*)$/);
  if (!match) return null;
  
  const mime = match[1];
  const isBase64 = !!match[2];
  const payload = match[3];
  
  if (isBase64) {
    try {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return { mime, isBase64, bytes };
    } catch (e) {
      console.error('Failed to decode base64 data URL');
      return null;
    }
  } else {
    try {
      const text = decodeURIComponent(payload);
      return { mime, isBase64, text };
    } catch (e) {
      console.error('Failed to decode data URL');
      return null;
    }
  }
}

// Helper function to decode base64 to text
function decodeBase64ToText(b64) {
  try {
    return atob(b64);
  } catch (e) {
    console.error('Failed to decode base64 string');
    return '';
  }
}

// Main function to process markdown
async function processMarkdown() {
  const outputElement = document.getElementById('markdown-output');
  
  try {
    // Get the markdown file URL from attachments
    const attachments = [
      {
        "name": "input.md",
        "url": "data:text/markdown;base64,aGVsbG8KIyBUaXRsZQ=="
      }
    ];
    
    const markdownAttachment = attachments.find(att => att.name === 'input.md');
    
    if (!markdownAttachment) {
      throw new Error('Markdown file not found in attachments');
    }
    
    let markdownText = '';
    
    // Check if it's a data URL
    if (markdownAttachment.url.startsWith('data:')) {
      const parsed = parseDataUrl(markdownAttachment.url);
      if (parsed && parsed.isBase64) {
        markdownText = decodeBase64ToText(markdownAttachment.url.split(',')[1]);
      } else if (parsed) {
        markdownText = parsed.text;
      } else {
        throw new Error('Failed to parse data URL');
      }
    } else {
      // Handle regular URL
      const response = await fetch(markdownAttachment.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch markdown file: ${response.status} ${response.statusText}`);
      }
      markdownText = await response.text();
    }
    
    // Configure marked with highlighting
    marked.setOptions({
      highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
      langPrefix: 'hljs language-'
    });
    
    // Convert markdown to HTML
    const html = marked.parse(markdownText);
    
    // Render in the output element
    outputElement.innerHTML = html;
  } catch (error) {
    console.error('Error processing markdown:', error);
    outputElement.innerHTML = `<p class="error">Error: ${error.message}</p>`;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', processMarkdown);