import { QUIZ } from './data.js';
import { confetti } from './confetti.js';
import { play } from './sound.js';
import { load, store } from './storage.js';
import { sendWhatsApp } from './whatsapp.js';
import { saveCertificate } from './certificate.js';

const KNOWLEDGE = QUIZ.filter((q) => q.correct !== undefined).length;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, className, onClick) {
  const b = el('button', className, text);
  b.type = 'button';
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
    root.append(el('p', 'hint', `${QUIZ.length} שאלות קצרות – יאללה!`));

    const label = el('label', 'slot-title', 'השם שלך (לא חובה)');
    label.htmlFor = 'quiz-name';
    const input = el('input', 'field');
    input.id = 'quiz-name';
    input.maxLength = 20;
    input.autocomplete = 'off';
    input.placeholder = 'למשל: נועה';
    input.value = name;
    input.addEventListener('input', () => { name = input.value.trim(); });

    root.append(label, input, button('🚀 מתחילים!', 'btn btn-big', () => {
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

    const dots = el('div', 'dots');
    QUIZ.forEach((_, i) => dots.append(el('span', i < step ? 'dot done' : i === step ? 'dot now' : 'dot')));
    root.append(dots, el('div', 'q-text', item.q));

    // מערבבים את סדר התשובות כדי שהנכונה לא תהיה תמיד באותו מקום
    const order = item.a.map((_, i) => i).sort(() => Math.random() - 0.5);
    const list = el('div', 'answers');
    const buttons = [];
    for (const i of order) {
      buttons[i] = button(item.a[i], 'answer', () => choose(i));
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
    return `📋 תשובות מהשאלון מ${who}\nידע/ה ${score} מתוך ${KNOWLEDGE} על אגם 🎯\n${lines.join('\n')}`;
  }

  function renderResult() {
    root.replaceChildren();
    confetti();
    play('win');
    root.append(
      el('div', 'big-emoji', score === KNOWLEDGE ? '🏆' : '🎉'),
      el('div', 'q-text', `ידעת ${score} מתוך ${KNOWLEDGE} על אגם!`),
      el('p', 'hint', score === KNOWLEDGE ? 'וואו, אתה מכיר אותה מצוין!' : 'כמעט! עכשיו אתה מכיר אותה יותר.'),
    );
    const actions = el('div', 'actions');
    actions.append(
      button('🏅 קבלו תעודה', 'btn', () => saveCertificate(name)),
      button('שלחו תשובות לאגם', 'btn btn-wa', () => sendWhatsApp(summary())),
      button('🔄 שוב', 'btn btn-light', renderStart),
    );
    root.append(actions);
  }

  renderStart();
}
