import assert from 'node:assert/strict';
import { splitDescription, descriptionLead, MAX_PARAGRAPH } from '../src/utils/eventDescription';

// Empty input
assert.deepEqual(splitDescription(''), []);
assert.deepEqual(splitDescription(undefined), []);

// Line breaks become paragraphs, blank lines are dropped
assert.deepEqual(splitDescription('Первый абзац.\n\nВторой абзац.\r\nТретий.'), [
  { type: 'p', text: 'Первый абзац.' },
  { type: 'p', text: 'Второй абзац.' },
  { type: 'p', text: 'Третий.' },
]);

// Bullet lines are grouped into one list
assert.deepEqual(splitDescription('Допуск:\n- кадеты 14–15\n• юниоры 16–17\n1) взрослые\nКонец.'), [
  { type: 'p', text: 'Допуск:' },
  { type: 'list', items: ['кадеты 14–15', 'юниоры 16–17', 'взрослые'] },
  { type: 'p', text: 'Конец.' },
]);

// A long single block is split by sentences, nothing is lost
const sentence = 'Соревнования проводятся по правилам WKF для всех возрастов и поясов участников турнира.';
const long = Array.from({ length: 12 }, () => sentence).join(' ');
const parts = splitDescription(long);
assert.ok(parts.length > 1, 'long text must be split');
for (const p of parts) {
  assert.equal(p.type, 'p');
  if (p.type === 'p') assert.ok(p.text.length <= MAX_PARAGRAPH, `paragraph too long: ${p.text.length}`);
}
assert.equal(parts.map((p) => (p.type === 'p' ? p.text : '')).join(' '), long);

// Kyrgyz capital letters start a new sentence too
const ky = Array.from({ length: 8 }, () => 'Өтүнмөлөр клубдар жана жеке спортчулар үчүн ачык болуп саналат, катталуу онлайн.').join(' ');
assert.ok(splitDescription(ky).length > 1);

// Short text is kept whole; abbreviations like "г. Бишкек" do not break a short paragraph
assert.deepEqual(splitDescription('Турнир в г. Бишкек. Начало в 09:00.'), [{ type: 'p', text: 'Турнир в г. Бишкек. Начало в 09:00.' }]);

assert.equal(descriptionLead('- пункт\nВводный абзац.\nЕщё.'), 'Вводный абзац.');

console.log('description: all checks passed');
