import { QUIZ } from './data.js';
import { confetti } from './confetti.js';
import { play } from './sound.js';
import { load, store } from './storage.js';
import { sendWhatsApp } from './whatsapp.js';
import { saveCertificate } from './certificate.js';
import { ICONS } from './icons.js';

const KNOWLEDGE = QUIZ.filter((q) => q.correct !== undefined).length;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, className, onClick, icon) {
  const b = el('button', className);
  if (icon) b.insertAdjacentHTML('beforeend', ICONS[icon]);
  b.append(el('span', '', text));
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

// "🐶 כלבה" -> אימוג'י גדול + טקסט מתחתיו
function answerButton(text, onClick) {
  const [emoji, ...rest] = text.split(' ');
  const b = el('button', 'answer');
  b.type = 'button';
  b.append(el('span', 'answer-emoji', emoji), el('span', 'answer-text', rest.join(' ')));
  b.addEventListener('click', onClick);
  return b;
}

export function initQuiz(root) {
  let step = 0;
  let score = 0;
  let answers = [];
  let name = load('my-name', '');

  function renderStart() {
    root.replaceChildren();

    const label = el('label', 'label', 'השם שלך (לא חובה)');
    label.htmlFor = 'quiz-name';
    const input = el('input', 'field');
    input.id = 'quiz-name';
    input.maxLength = 20;
    input.autocomplete = 'off';
    input.placeholder = 'למשל: נועה';
    input.value = name;
    input.addEventListener('input', () => { name = input.value.trim(); });

    root.append(label, input, button('מתחילים!', 'btn btn-block', () => {
      store('my-name', name);
      step = 0;
      score = 0;
      answers = [];
      play('tap');
      renderQuestion();
    }));
  }

  function renderQuestion() {
    const item = QUIZ[step];
    root.replaceChildren();

    const progress = el('div', 'progress');
    QUIZ.forEach((_, i) => progress.append(el('span', i < step ? 'seg done' : i === step ? 'seg now' : 'seg')));
    root.append(
      el('div', 'step-label', `שאלה ${step + 1} מתוך ${QUIZ.length}`),
      progress,
      el('div', 'q-text', item.q),
    );

    // מערבבים את סדר התשובות כדי שהנכונה לא תהיה תמיד באותו מקום
    const order = item.a.map((_, i) => i).sort(() => Math.random() - 0.5);
    const list = el('div', 'answers');
    const buttons = [];
    for (const i of order) {
      buttons[i] = answerButton(item.a[i], () => choose(i));
      list.append(buttons[i]);
    }
    root.append(list);

    function choose(i) {
      buttons.forEach((b) => { b.disabled = true; });
      const knowledge = item.correct !== undefined;
      if (knowledge) {
        buttons[item.correct].classList.add('right');
        if (i === item.correct) {
          score++;
          confetti();
          play('win');
        } else {
          buttons[i].classList.add('wrong');
          play('tap');
        }
      } else {
        buttons[i].classList.add('picked');
        play('tap');
      }
      answers.push({ label: item.label, text: item.a[i] });
      setTimeout(() => {
        step++;
        if (step < QUIZ.length) renderQuestion();
        else renderResult();
      }, knowledge ? 1400 : 700);
    }
  }

  function summary() {
    const who = name || 'חבר/ה מד3';
    const lines = answers.map((a) => `• ${a.label}: ${a.text}`);
    return `📋 תשובות מהשאלון מ${who}\nענה/תה נכון על ${score} מתוך ${KNOWLEDGE} שאלות על אגם 🎯\n${lines.join('\n')}`;
  }

  function renderResult() {
    root.replaceChildren();
    confetti();
    play('win');
    root.append(
      el('div', 'big-emoji', score === KNOWLEDGE ? '🏆' : '🎉'),
      el('div', 'q-text', `ענית נכון על ${score} מתוך ${KNOWLEDGE}!`),
      el('p', 'hint center', score === KNOWLEDGE ? 'וואו, מכירים את אגם מצוין!' : 'כמעט! עכשיו מכירים את אגם קצת יותר.'),
    );
    const actions = el('div', 'actions');
    actions.append(
      button('תעודה', 'btn', () => saveCertificate(name), 'award'),
      button('שלחו תשובות לאגם', 'btn btn-wa', () => sendWhatsApp(summary()), 'send'),
      button('שוב', 'btn btn-light', renderStart, 'refresh'),
    );
    root.append(actions);
  }

  renderStart();
}
