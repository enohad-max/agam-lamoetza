import { WHATSAPP_NUMBER } from './data.js';

export function sendWhatsApp(text) {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
