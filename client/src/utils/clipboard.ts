/**
 * Universal clipboard copy helper supporting HTTPS, HTTP local network IPs (e.g. 192.168.x.x), mobile devices, and desktop browsers.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  // 1. Try modern Clipboard API (available in Secure Contexts: localhost or HTTPS)
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Navigator clipboard API failed, trying fallback:', err);
    }
  }

  // 2. Universal fallback using hidden textarea (works on plain HTTP local network IPs & mobile)
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');

    // Prevent scrolling to bottom on mobile
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);

    // Mobile / iOS selection compatibility
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.focus();
      textArea.select();
    }

    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch (err) {
    console.error('Universal copyToClipboard failed:', err);
    return false;
  }
};
