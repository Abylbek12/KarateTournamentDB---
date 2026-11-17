// Automated checks for YouTube live links per tatami. Run: npm test
import { youtubeVideoId, sanitizeLiveStreams, streamTatamis, fitVideoGrid } from '../src/utils/youtube';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures++;
};
const ID = 'dQw4w9WgXcQ';

check('watch?v= link', youtubeVideoId(`https://www.youtube.com/watch?v=${ID}&t=10s`) === ID);
check('youtu.be share link', youtubeVideoId(`https://youtu.be/${ID}?si=abc`) === ID);
check('youtube.com/live/ link', youtubeVideoId(`https://youtube.com/live/${ID}?feature=share`) === ID);
check('mobile m.youtube.com', youtubeVideoId(`https://m.youtube.com/watch?v=${ID}`) === ID);
check('without https://', youtubeVideoId(`youtube.com/live/${ID}`) === ID);
check('embed link', youtubeVideoId(`https://www.youtube.com/embed/${ID}`) === ID);
check('not YouTube → null', youtubeVideoId(`https://evil.example/watch?v=${ID}`) === null);
check('look-alike domain → null', youtubeVideoId(`https://youtube.com.evil.example/watch?v=${ID}`) === null);
check('channel page → null', youtubeVideoId('https://www.youtube.com/@karate/live') === null);
check('empty → null', youtubeVideoId('') === null);

const s = sanitizeLiveStreams({ '1': `https://youtu.be/${ID}`, '2': 'https://evil.example', '13': `https://youtu.be/${ID}`, x: `https://youtu.be/${ID}`, '3': `youtube.com/live/${ID}` });
check('sanitize keeps tatami 1 and 3 only', JSON.stringify(Object.keys(s).sort()) === '["1","3"]', JSON.stringify(s));
check('sanitize normalizes link', s['1'] === `https://www.youtube.com/watch?v=${ID}`);
check('sanitize rejects non-object', Object.keys(sanitizeLiveStreams('x')).length === 0 && Object.keys(sanitizeLiveStreams([1])).length === 0);
check('streamTatamis sorted', JSON.stringify(streamTatamis({ '3': s['3'], '1': s['1'] })) === '[1,3]');

// Full-screen layout on a 1920×1000 screen
const g = (n: number) => fitVideoGrid(n, 1920, 1000, 8, 40);
check('fit: 1 video → 1 column', g(1).cols === 1);
check('fit: 4 videos → 2×2', g(4).cols === 2, JSON.stringify(g(4)));
check('fit: 6 videos → 3 columns', g(6).cols === 3, JSON.stringify(g(6)));
check('fit: 10 videos → 4 columns', g(10).cols === 4, JSON.stringify(g(10)));
check('fit: everything fits in height', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((n) => {
  const { cols, tileWidth } = g(n);
  const rows = Math.ceil(n / cols);
  return rows * (tileWidth * 9 / 16 + 40) + (rows - 1) * 8 <= 1000 + 1 && cols * tileWidth + (cols - 1) * 8 <= 1920 + 1;
}));
check('fit: phone portrait 4 videos → 1 column', fitVideoGrid(4, 375, 700, 8, 40).cols === 1, JSON.stringify(fitVideoGrid(4, 375, 700, 8, 40)));
check('fit: empty screen safe', fitVideoGrid(4, 0, 0).tileWidth === 0);

if (failures > 0) {
  console.error(`\n${failures} YouTube check(s) failed`);
  process.exit(1);
}
console.log('\nAll YouTube checks passed');
