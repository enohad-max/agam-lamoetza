// תעודת "תומך/ת רשמי/ת" – מצויירת על canvas ומוצעת לשמירה/שיתוף כתמונה
function draw(name) {
  const size = 1080;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.direction = 'rtl';
  g.textAlign = 'center';

  const bg = g.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#7c3aed');
  bg.addColorStop(1, '#ec4899');
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);

  g.fillStyle = '#fffbeb';
  g.beginPath();
  g.roundRect(60, 60, size - 120, size - 120, 50);
  g.fill();
  g.strokeStyle = '#fde047';
  g.lineWidth = 14;
  g.stroke();

  const font = (px) => `800 ${px}px system-ui, "Segoe UI", "Arial Hebrew", Arial, sans-serif`;
  const line = (text, y, px, color) => {
    g.font = font(px);
    g.fillStyle = color;
    g.fillText(text, size / 2, y);
  };

  line('🏆', 230, 130, '#000');
  line('תעודת תומך/ת רשמי/ת', 360, 84, '#5b21b6');
  line('של אגם למועצה', 450, 62, '#ec4899');
  line('מוענקת ל:', 590, 50, '#3b0764');
  line(name || 'חבר/ה מד3', 700, 100, '#7c3aed');
  line('כל הכיתה מרוצה! 💜', 840, 58, '#3b0764');
  line('ד3 יסמין • בחירות 23.10', 930, 40, '#6b21a8');
  return c;
}

export async function saveCertificate(name) {
  const blob = await new Promise((resolve) => draw(name).toBlob(resolve, 'image/png'));
  const file = new File([blob], 'agam-certificate.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'agam-certificate.png';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
