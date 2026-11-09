// Avvisa Bing/Yandex (IndexNow) delle pagine cambiate nell'ultimo commit di docs/.
import { execSync } from 'node:child_process';
const SITE = 'https://www.ilbossdeglistock.it', KEY = '02c4014a40f84147a153c44dcb5d774a';
const files = execSync('git diff --name-only HEAD~1 HEAD -- docs').toString().split('\n').filter(f => f.endsWith('index.html'));
const urls = [...new Set(files.map(f => SITE + '/' + f.replace(/^docs\//, '').replace(/index\.html$/, '')))].slice(0, 1000);
if (!urls.length) { console.log('Nessuna pagina da segnalare'); process.exit(0); }
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'www.ilbossdeglistock.it', key: KEY, keyLocation: SITE + '/' + KEY + '.txt', urlList: urls }) });
console.log('IndexNow', r.status, urls.length, 'URL');
