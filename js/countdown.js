import { ELECTION_DATE } from './data.js';

const DAY = 86400000;

export function renderCountdown(big, small) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((ELECTION_DATE - today) / DAY);

  if (days > 1) {
    big.textContent = `עוד ${days} ימים!`;
    small.textContent = 'לבחירות – שישי 23.10';
  } else if (days === 1) {
    big.textContent = 'מחר מצביעים! 🗳️';
    small.textContent = 'אל תשכחו – אגם למועצה';
  } else if (days === 0) {
    big.textContent = 'היום מצביעים! 🗳️';
    small.textContent = 'הצביעו אגם!';
  } else {
    big.textContent = 'תודה לכולם! 💜';
    small.textContent = 'הבחירות הסתיימו';
  }
}
