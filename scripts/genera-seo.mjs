// Genera pagine statiche dei lotti, sitemap.xml, robots.txt e llms.txt
// per Google e i motori AI (ChatGPT, Gemini, Claude, Perplexity).
// Uso: node scripts/genera-seo.mjs            (legge da Supabase)
//      node scripts/genera-seo.mjs dati.json  (legge da file)
// I PREZZI NON VENGONO MAI PUBBLICATI: sono riservati ai rivenditori approvati.
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.ilbossdeglistock.it';
const SUPABASE_URL = 'https://jyeqwltlgmzbgyzhkbmy.supabase.co';
const KEY = 'sb_publishable_O70O2QL0HEh0bSgXhD6r_A_eub3RZdl';
const DOCS = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'docs');
const AZ = {
  nome: 'Olmo S.r.l.', marchio: 'Il Boss degli Stock', piva: '11943250966', rea: 'MI - 2631956',
  legale: 'Via Manfredo Camperio 9, 20123 Milano (MI)', magazzino: 'Via Lombardia 19/D, 41012 Carpi (MO)',
  tel: '+39 349 410 5409', email: 'info@ilbossdeglistock.it'
};

async function load() {
  if (process.argv[2]) return JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const get = async q => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (!r.ok) throw new Error(q + ' ' + r.status);
    return r.json();
  };
  const [lots, items, cats] = await Promise.all([
    get('lots?select=*&status=neq.bozza&order=id'),
    get('lot_items?select=lot_id,name,qty,position&order=lot_id,position'),
    get('categories?select=*&order=position')
  ]);
  return { lots, items, cats };
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = n => String(Math.round(Number(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const slugify = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
const lotPath = l => `/lotti/${l.id}-${slugify(l.title)}/`;
const photo = p => `${SUPABASE_URL}/storage/v1/object/public/lot-photos/${p}`;
const short = (s, n = 158) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };

const CSS = `body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:#f7f5f2;color:#3d3d3c;line-height:1.5}
a{color:#c9512c}.w{max-width:960px;margin:0 auto;padding:0 16px}header{background:#fff;border-bottom:1.5px solid #e6e1da}
header .w{display:flex;align-items:center;justify-content:space-between;padding:12px 16px}header img{height:46px}
h1{font-size:30px;line-height:1.15;margin:18px 0 6px}h2{font-size:20px;margin:24px 0 8px}.sub{color:#6d675c}
.ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:14px 0}
.ph img{width:100%;height:auto;border-radius:12px;border:1.5px solid #e6e1da;background:#fff}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}td,th{padding:9px 10px;border-bottom:1px solid #e6e1da;text-align:left}
td.r,th.r{text-align:right}.cta{display:inline-block;background:#c9512c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:11px;font-weight:700;margin:6px 8px 6px 0}
.cta.o{background:#fff;color:#3d3d3c;border:1.5px solid #3d3d3c}.box{background:#fff;border:1.5px solid #e6e1da;border-radius:14px;padding:16px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}.card{background:#fff;border:1.5px solid #e6e1da;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit}
.card img{width:100%;height:220px;object-fit:contain;background:#fff;display:block}.card div{padding:12px}.card b{display:block}
footer{background:#3d3d3c;color:#ddd;font-size:13px;padding:20px 0;margin-top:40px}footer a{color:#fff}`;

const head = ({ title, desc, url, img, jsonld }) => `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}"><link rel="icon" href="/logo.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Il Boss degli Stock">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">${img ? `<meta property="og:image" content="${img}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<style>${CSS}</style></head><body>
<header><div class="w"><a href="/"><img src="/logo.png" alt="Il Boss degli Stock"></a><a class="cta" href="/#proponi" style="margin:0">Vendi il tuo stock</a></div></header>`;

const foot = () => `<footer><div class="w"><b>Il Boss degli Stock</b> – stock, liquidazioni e bancali per rivenditori · Magazzino: ${AZ.magazzino} · Tel. e WhatsApp ${AZ.tel} · <a href="mailto:${AZ.email}">${AZ.email}</a><br>
${AZ.nome} · Sede legale ${AZ.legale} · P.IVA ${AZ.piva} · REA ${AZ.rea} · <a href="/lotti/">Tutti i lotti</a> · <a href="/#contatti">Contatti</a></div></footer></body></html>`;

const ORG = {
  '@type': ['Organization', 'LocalBusiness'], '@id': SITE + '/#org', name: 'Il Boss degli Stock', legalName: AZ.nome, url: SITE + '/',
  logo: SITE + '/logo.png', image: SITE + '/logo.png', telephone: AZ.tel, email: AZ.email, vatID: 'IT' + AZ.piva,
  description: 'Stock, liquidazioni, lotti e bancali di merce nuova per rivenditori, grossisti e negozi. Acquistiamo anche stock di magazzino.',
  address: { '@type': 'PostalAddress', streetAddress: 'Via Lombardia 19/D', postalCode: '41012', addressLocality: 'Carpi', addressRegion: 'MO', addressCountry: 'IT' },
  areaServed: 'IT', openingHours: ['Mo-Fr 10:00-13:00', 'Mo-Fr 15:00-18:00']
};

function lotPage(l, items, cat) {
  const url = SITE + lotPath(l), imgs = (l.photos || []).map(photo);
  const desc = short(l.description || l.title);
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, {
    '@type': 'Product', name: l.title, description: l.description, image: imgs, category: cat?.name, url,
    brand: { '@type': 'Brand', name: 'Stock' }, itemCondition: 'https://schema.org/NewCondition',
    seller: { '@id': SITE + '/#org' }
  }, { '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
    { '@type': 'ListItem', position: 2, name: 'Lotti', item: SITE + '/lotti/' },
    { '@type': 'ListItem', position: 3, name: l.title, item: url }] }] };
  delete jsonld['@graph'][1].brand;
  const sold = l.status === 'venduto';
  return head({ title: `${l.title} | Il Boss degli Stock`, desc, url, img: imgs[0], jsonld }) + `
<main class="w"><p class="sub"><a href="/lotti/">Tutti i lotti</a> › ${esc(cat?.name || '')}</p>
<h1>${esc(l.title)}</h1>
<p class="sub">${l.pieces ? num(l.pieces) + ' pezzi · ' : ''}${esc(cat?.name || '')} · Magazzino a Carpi (MO)${sold ? ' · <b>VENDUTO</b>' : ''}</p>
${imgs.length ? `<div class="ph">${imgs.map((u, i) => `<img src="${u}" alt="${esc(l.title)} – foto ${i + 1}" loading="${i ? 'lazy' : 'eager'}">`).join('')}</div>` : ''}
<div class="box"><b>Prezzi riservati ai rivenditori.</b> Registrati gratis con la tua partita IVA per vedere il prezzo e richiedere il lotto.<br>
<a class="cta" href="/#lotto-${l.id}">Vedi prezzo e richiedi</a><a class="cta o" href="https://wa.me/393494105409?text=${encodeURIComponent('Buongiorno, vorrei informazioni sul lotto: ' + l.title)}">Chiedi su WhatsApp</a></div>
<h2>Descrizione</h2><p>${esc(l.description || '')}</p>
${items.length ? `<h2>Composizione del lotto</h2><table><tr><th>Articolo</th><th class="r">Quantità</th></tr>${items.map(i => `<tr><td>${esc(i.name)}</td><td class="r">${i.qty ? num(i.qty) : '–'}</td></tr>`).join('')}</table>` : ''}
<h2>Come acquistare</h2><p>Vendiamo a rivenditori, grossisti, negozi, ambulanti ed e-commerce. Merce visibile su appuntamento nel nostro magazzino di Carpi (MO), ritiro diretto o spedizione in Italia e all'estero. Contattaci al ${AZ.tel} (anche WhatsApp) o scrivi a ${AZ.email}.</p>
</main>` + foot();
}

function listPage(lots, cats) {
  const url = SITE + '/lotti/';
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, { '@type': 'ItemList', name: 'Stock e lotti disponibili', itemListElement: lots.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + lotPath(l), name: l.title })) }] };
  const byCat = cats.map(c => ({ c, ls: lots.filter(l => l.category === c.slug) })).filter(x => x.ls.length);
  return head({ title: 'Stock e lotti disponibili per rivenditori | Il Boss degli Stock', desc: `Catalogo aggiornato di ${lots.length} stock e lotti di merce nuova per rivenditori: occhiali, casa, telefonia, igiene, Natale, giocattoli, ceramica e altro. Magazzino a Carpi (MO).`, url, img: lots.find(l => l.photos?.length) ? photo(lots.find(l => l.photos?.length).photos[0]) : SITE + '/logo.png', jsonld }) + `
<main class="w"><h1>Stock e lotti disponibili</h1><p class="sub">${lots.length} lotti di merce nuova per rivenditori, grossisti e negozi. Prezzi riservati ai rivenditori registrati. <a href="/">Apri la vetrina</a></p>
${byCat.map(({ c, ls }) => `<h2>${esc(c.name)}</h2><div class="grid">${ls.map(l => `<a class="card" href="${lotPath(l)}">${l.photos?.length ? `<img src="${photo(l.photos[0])}" alt="${esc(l.title)}" loading="lazy">` : ''}<div><b>${esc(l.title)}</b><span class="sub">${l.pieces ? num(l.pieces) + ' pezzi' : 'Quantità su richiesta'}${l.status === 'venduto' ? ' · VENDUTO' : ''}</span></div></a>`).join('')}</div>`).join('')}
<div class="box"><h2 style="margin-top:0">Hai uno stock da vendere?</h2>Acquistiamo rimanenze di magazzino, fine serie, stock da fallimenti, resi e bancali. <a class="cta" href="/#proponi">Proponi il tuo stock</a></div>
</main>` + foot();
}

function llms(lots, cats, itemsBy) {
  const cat = s => cats.find(c => c.slug === s)?.name || s;
  return `# Il Boss degli Stock

> Il Boss degli Stock (${SITE}) è il sito di ${AZ.nome} dedicato alla vendita di stock, liquidazioni, lotti e bancali di merce nuova a rivenditori, grossisti, negozi, ambulanti ed e-commerce in Italia e all'estero. Acquista anche stock di magazzino (rimanenze, fine serie, fallimenti, resi). Magazzino a Carpi (MO).

- Azienda: ${AZ.nome}, P.IVA ${AZ.piva}, sede legale ${AZ.legale}
- Magazzino e sede operativa: ${AZ.magazzino} (visione merce e ritiro su appuntamento)
- Contatti: telefono e WhatsApp ${AZ.tel}, email ${AZ.email}, lunedì–venerdì 10–13 e 15–18
- I prezzi sono riservati ai rivenditori registrati e approvati: per una quotazione contattare l'azienda.
- Vendi il tuo stock: ${SITE}/#proponi

## Lotti disponibili

${lots.filter(l => l.status !== 'venduto').map(l => `- [${l.title}](${SITE}${lotPath(l)}): ${cat(l.category)}. ${short(l.description, 260)}`).join('\n')}

## Pagine

- [Catalogo completo dei lotti](${SITE}/lotti/)
- [Vetrina e registrazione rivenditori](${SITE}/)
- [Contatti](${SITE}/#contatti)
`;
}

const main = async () => {
  const { lots, items, cats } = await load();
  const itemsBy = id => items.filter(i => i.lot_id === id).sort((a, b) => a.position - b.position);
  const catOf = s => cats.find(c => c.slug === s);
  const dir = path.join(DOCS, 'lotti');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const l of lots) {
    const d = path.join(DOCS, lotPath(l));
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'index.html'), lotPage(l, itemsBy(l.id), catOf(l.category)));
  }
  fs.writeFileSync(path.join(dir, 'index.html'), listPage(lots, cats));
  const today = new Date().toISOString().slice(0, 10);
  const urls = [{ loc: SITE + '/', p: '1.0' }, { loc: SITE + '/lotti/', p: '0.9' },
    ...lots.map(l => ({ loc: SITE + lotPath(l), p: l.status === 'venduto' ? '0.3' : '0.8', lm: (l.created_at || '').slice(0, 10) }))];
  fs.writeFileSync(path.join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lm || today}</lastmod><priority>${u.p}</priority></url>`).join('\n')}
</urlset>
`);
  fs.writeFileSync(path.join(DOCS, 'robots.txt'), `# Il Boss degli Stock – accesso consentito a motori di ricerca e assistenti AI
User-agent: *
Allow: /

User-agent: Googlebot
Allow: /
User-agent: Bingbot
Allow: /
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);
  fs.writeFileSync(path.join(DOCS, 'llms.txt'), llms(lots, cats, itemsBy));
  // Blocco statico nella home (visibile a chi non esegue JavaScript; il sito lo sostituisce al caricamento)
  const block = `<!--SEO--><div class="seo-static"><h1>Stock e lotti per rivenditori</h1><p>Il Boss degli Stock – ${AZ.nome}: stock, liquidazioni e bancali di merce nuova per rivenditori. Magazzino a Carpi (MO). Tel. e WhatsApp ${AZ.tel}.</p><ul>${lots.filter(l => l.status !== 'venduto').map(l => `<li><a href="${lotPath(l)}">${esc(l.title)}</a></li>`).join('')}</ul><p><a href="/lotti/">Catalogo completo dei lotti</a></p></div><!--/SEO-->`;
  const orgLd = `<!--ORGLD--><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...ORG })}</script><!--/ORGLD-->`;
  for (const f of ['index.html', '404.html']) {
    const p = path.join(DOCS, f); if (!fs.existsSync(p)) continue;
    let s = fs.readFileSync(p, 'utf8');
    s = s.replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, block).replace(/<!--ORGLD-->[\s\S]*?<!--\/ORGLD-->/, orgLd);
    fs.writeFileSync(p, s);
  }
  console.log(`OK: ${lots.length} lotti, sitemap con ${urls.length} URL`);
};
main().catch(e => { console.error(e); process.exit(1); });
