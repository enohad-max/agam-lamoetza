import { ELECTION_DATE } from './data.js';

const DAY = 86400000;

export function renderCountdown(num, big, small) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((ELECTION_DATE - today) / DAY);

  if (days > 1) {
    num.textContent = days;
    big.textContent = 'ימים עד הבחירות';
    small.textContent = 'שישי 23.10';
  } else if (days === 1) {
    num.textContent = '1';
    big.textContent = 'מחר מצביעים!';
    small.textContent = 'אל תשכחו – אגם למועצה';
  } else if (days === 0) {
    num.textContent = '🗳️';
    big.textContent = 'היום מצביעים!';
    small.textContent = 'הצביעו אגם!';
  } else {
    num.textContent = '💜';
    big.textContent = 'תודה לכולם!';
    small.textContent = 'הבחירות הסתיימו';
  }
}
