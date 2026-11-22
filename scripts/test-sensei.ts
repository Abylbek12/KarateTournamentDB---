// Automated checks for «Сенсей» on Google Gemini (conversation format). Run: npm test
import { toGeminiContents, hasGeminiKey, GEMINI_MODEL } from '../server/geminiSensei';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};
const textOf = (c: { parts?: { text?: string }[] }) => c.parts?.[0]?.text;

{
  const c = toGeminiContents([], 'Что такое Senshu?');
  check('new question only: one user turn', c.length === 1 && c[0].role === 'user' && textOf(c[0]) === 'Что такое Senshu?');
}
{
  const c = toGeminiContents(
    [
      { role: 'model', text: 'Ос! Я — Sensei AI' },
      { role: 'user', text: 'Привет' },
      { role: 'model', text: 'Здравствуйте!' }
    ],
    'Сколько длится бой?'
  );
  check('history starts with the user (welcome dropped)', c[0].role === 'user' && textOf(c[0]) === 'Привет');
  check('roles user / model kept in order', c.map((x) => x.role).join(',') === 'user,model,user', c.map((x) => x.role).join(','));
  check('new question is last', textOf(c[c.length - 1]) === 'Сколько длится бой?');
}
{
  const c = toGeminiContents([{ role: 'assistant', text: 'a' }, { role: 'user', text: 'b' }, { role: 'assistant', text: 'c' }], 'q');
  check('assistant role becomes model', c[1]?.role === 'model' && textOf(c[1]) === 'c');
}
{
  const c = toGeminiContents([{ role: 'user', text: '   ' }, { role: 'hacker', text: 'x' }, null, { role: 'user', text: 42 }], 'q');
  check('empty, unknown and broken items are skipped', c.length === 1);
}
{
  const long = 'я'.repeat(10_000);
  const c = toGeminiContents([{ role: 'user', text: long }], long);
  check('long texts are cut to 4000 characters', textOf(c[0])!.length === 4000 && textOf(c[1])!.length === 4000);
}
{
  const many = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'model' : 'user', text: `m${i}` }));
  check('only the last 12 history items are sent (+ the question)', toGeminiContents(many, 'q').length <= 13);
}
check('not history array → just the question', toGeminiContents('oops', 'q').length === 1);
check('default model is set', GEMINI_MODEL.length > 0, GEMINI_MODEL);
check('no key in tests', hasGeminiKey() === !!process.env.GEMINI_API_KEY?.trim());

console.log(failures ? `\n${failures} check(s) failed` : '\nAll Sensei checks passed');
process.exit(failures ? 1 : 0);
