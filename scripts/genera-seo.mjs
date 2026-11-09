// Genera le pagine statiche SEO del sito (lotti, categorie, contatti, vendi il tuo stock),
// sitemap.xml (con immagini), robots.txt, llms.txt, il blocco SEO della home e la 404.
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
  tel: '+39 349 410 5409', wa: '393494105409', email: 'info@ilbossdeglistock.it', orari: 'lunedì–venerdì 10–13 e 15–18'
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
// ATTENZIONE: la stessa funzione è copiata in docs/index.html (vetrina): se la cambi, cambiala anche lì.
export const slugify = s => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/, '');
const lotPath = l => `/lotti/${l.id}-${slugify(l.title)}/`;
const catPath = c => `/stock/${c.slug}/`;
const photo = p => `${SUPABASE_URL}/storage/v1/object/public/lot-photos/${p}`;
const flat = s => String(s || '').replace(/\s+/g, ' ').replace(/\s*•\s*/g, ' ').trim();
const short = (s, n = 155) => { s = flat(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '').replace(/[\s,;:–-]+$/, '') + '…' : s; };
// titolo per <title>: massimo ~62 caratteri tagliato a parola intera (Google mostra circa 60 caratteri)
const tt = (s, n = 62) => { s = flat(s); return s.length <= n ? s : s.slice(0, n + 1).replace(/\s+\S*$/, '').replace(/[\s,;:(–-]+$/, ''); };
const lc = s => String(s).charAt(0).toLowerCase() + String(s).slice(1);

// Descrizione con a capo e punti elenco "•" → paragrafi ed elenchi HTML
function fmt(text) {
  return String(text || '').trim().split(/\n\s*\n/).map(block => {
    const lines = block.split('\n').map(x => x.trim()).filter(Boolean);
    let out = '', ul = [];
    const flush = () => { if (ul.length) { out += `<ul>${ul.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`; ul = []; } };
    for (const ln of lines) {
      if (/^[•\-–*]\s*/.test(ln) && ln.length > 2) ul.push(ln.replace(/^[•\-–*]\s*/, ''));
      else { flush(); out += `<p>${esc(ln)}</p>`; }
    }
    flush();
    return out;
  }).join('\n');
}

const CSS = `*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:#f7f5f2;color:#3d3d3c;line-height:1.55;font-size:16px}
a{color:#c9512c}.w{max-width:960px;margin:0 auto;padding:0 16px}header{background:#fff;border-bottom:1.5px solid #e6e1da}
header .w{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px}header img{height:46px;width:auto;display:block}
nav.n{display:flex;gap:16px;flex-wrap:wrap;padding:0 16px 10px;max-width:960px;margin:0 auto;font-size:14px;font-weight:600}nav.n a{color:#3d3d3c;text-decoration:none}nav.n a:hover{color:#c9512c}
h1{font-size:30px;line-height:1.15;margin:18px 0 6px}h2{font-size:21px;margin:28px 0 8px}h3{font-size:17px;margin:18px 0 4px}.sub{color:#6d675c}
.bc{font-size:14px;margin:14px 0 0}.bc a{color:#6d675c}
.ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:14px 0}
.ph img{width:100%;height:auto;border-radius:12px;border:1.5px solid #e6e1da;background:#fff}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}td,th{padding:9px 10px;border-bottom:1px solid #e6e1da;text-align:left}
td.r,th.r{text-align:right}.cta{display:inline-block;background:#c9512c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:11px;font-weight:700;margin:6px 8px 6px 0}
.cta.o{background:#fff;color:#3d3d3c;border:1.5px solid #3d3d3c}.box{background:#fff;border:1.5px solid #e6e1da;border-radius:14px;padding:16px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px}.card{background:#fff;border:1.5px solid #e6e1da;border-radius:14px;overflow:hidden;text-decoration:none;color:inherit;display:block}
.card img{width:100%;height:210px;object-fit:contain;background:#fff;display:block}.card div{padding:12px}.card b{display:block}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.chips a{background:#fff;border:1.5px solid #e6e1da;border-radius:999px;padding:6px 12px;text-decoration:none;color:#3d3d3c;font-size:14px;font-weight:600}
details{background:#fff;border:1.5px solid #e6e1da;border-radius:12px;padding:12px 14px;margin:8px 0}summary{font-weight:700;cursor:pointer}
footer{background:#3d3d3c;color:#ddd;font-size:13px;padding:22px 0;margin-top:40px}footer a{color:#fff}`;

const head = ({ title, desc, url, img, jsonld, robots }) => `<!DOCTYPE html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">
${robots ? `<meta name="robots" content="${robots}">` : '<meta name="robots" content="index, follow, max-image-preview:large">'}
<link rel="canonical" href="${url}"><link rel="icon" href="/logo.png">
<meta property="og:type" content="website"><meta property="og:site_name" content="Il Boss degli Stock"><meta property="og:locale" content="it_IT">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}"><meta property="og:image" content="${img || SITE + '/logo.png'}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>
<style>${CSS}</style></head><body>
<header><div class="w"><a href="/"><img src="/logo.png" alt="Il Boss degli Stock – stock e bancali per rivenditori" width="99" height="46"></a><a class="cta" href="/" style="margin:0">Vedi la vetrina</a></div>
<nav class="n" aria-label="Menu"><a href="/lotti/">Tutti i lotti</a><a href="/vendi-il-tuo-stock/">Vendi il tuo stock</a><a href="/contatti/">Contatti</a><a href="https://wa.me/${AZ.wa}">WhatsApp</a></nav></header>`;

const foot = cats => `<footer><div class="w"><b>Il Boss degli Stock</b> – stock, liquidazioni e bancali per rivenditori · Magazzino: ${AZ.magazzino} · Tel. e WhatsApp <a href="tel:+${AZ.wa}">${AZ.tel}</a> · <a href="mailto:${AZ.email}">${AZ.email}</a><br>
${cats?.length ? `Stock per categoria: ${cats.map(c => `<a href="${catPath(c)}">${esc(c.name)}</a>`).join(' · ')}<br>` : ''}
<a href="/lotti/">Tutti i lotti</a> · <a href="/vendi-il-tuo-stock/">Vendi il tuo stock</a> · <a href="/contatti/">Contatti</a><br>
${AZ.nome} · Sede legale ${AZ.legale} · P.IVA ${AZ.piva} · REA ${AZ.rea}</div></footer></body></html>`;

const ORG = {
  '@type': ['Organization', 'LocalBusiness'], '@id': SITE + '/#org', name: 'Il Boss degli Stock', legalName: AZ.nome, url: SITE + '/',
  logo: SITE + '/logo.png', image: SITE + '/logo.png', telephone: AZ.tel, email: AZ.email, vatID: 'IT' + AZ.piva, taxID: AZ.piva,
  description: 'Stock, liquidazioni, lotti e bancali di merce nuova per rivenditori, grossisti e negozi. Acquistiamo anche stock di magazzino.',
  address: { '@type': 'PostalAddress', streetAddress: 'Via Lombardia 19/D', postalCode: '41012', addressLocality: 'Carpi', addressRegion: 'MO', addressCountry: 'IT' },
  areaServed: ['IT', 'EU'], openingHours: ['Mo-Fr 10:00-13:00', 'Mo-Fr 15:00-18:00'],
  contactPoint: { '@type': 'ContactPoint', telephone: AZ.tel, email: AZ.email, contactType: 'sales', availableLanguage: ['it'] }
};
const WEBSITE = { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: 'Il Boss degli Stock', inLanguage: 'it-IT', publisher: { '@id': SITE + '/#org' } };
const crumbs = list => ({ '@type': 'BreadcrumbList', itemListElement: list.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) });

const card = l => `<a class="card" href="${lotPath(l)}">${l.photos?.length ? `<img src="${photo(l.photos[0])}" alt="${esc(l.title)}" loading="lazy">` : ''}<div><b>${esc(l.title)}</b><span class="sub">${l.pieces ? num(l.pieces) + ' pezzi' : 'Quantità su richiesta'}${l.status === 'venduto' ? ' · VENDUTO' : ''}</span></div></a>`;
const sellBox = `<div class="box"><h2 style="margin-top:0">Hai uno stock da vendere?</h2>Acquistiamo rimanenze di magazzino, fine serie, stock da fallimenti, resi e bancali. <a class="cta" href="/vendi-il-tuo-stock/">Proponi il tuo stock</a></div>`;

function lotPage(l, items, cat, related, usedCats) {
  const url = SITE + lotPath(l), imgs = (l.photos || []).map(photo);
  const desc = short(l.description || l.title);
  const sold = l.status === 'venduto';
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, WEBSITE, {
    '@type': 'ItemPage', '@id': url + '#page', url, name: l.title, description: desc, inLanguage: 'it-IT',
    isPartOf: { '@id': SITE + '/#website' }, publisher: { '@id': SITE + '/#org' },
    ...(imgs.length ? { primaryImageOfPage: { '@type': 'ImageObject', url: imgs[0] }, image: imgs.slice(0, 10) } : {}),
    datePublished: l.created_at || undefined
  }, crumbs([['Home', SITE + '/'], ['Lotti', SITE + '/lotti/'], ...(cat ? [[cat.name, SITE + catPath(cat)]] : []), [l.title, url]])] };
  return head({ title: `${tt(l.title)} | Il Boss degli Stock`, desc, url, img: imgs[0], jsonld }) + `
<main class="w"><p class="bc"><a href="/">Home</a> › <a href="/lotti/">Lotti</a>${cat ? ` › <a href="${catPath(cat)}">${esc(cat.name)}</a>` : ''}</p>
<h1>${esc(l.title)}</h1>
<p class="sub">${l.pieces ? num(l.pieces) + ' pezzi · ' : ''}${cat ? `<a href="${catPath(cat)}">${esc(cat.name)}</a> · ` : ''}Merce nuova · Magazzino a Carpi (MO)${sold ? ' · <b>VENDUTO</b>' : ''}</p>
${imgs.length ? `<div class="ph">${imgs.map((u, i) => `<img src="${u}" alt="${esc(l.title)} – foto ${i + 1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}>`).join('')}</div>` : ''}
${sold ? `<div class="box"><b>Questo lotto è stato venduto.</b> Guarda gli altri stock disponibili qui sotto o <a href="/contatti/">contattaci</a>: potremmo avere merce simile in arrivo.</div>`
  : `<div class="box"><b>Prezzi riservati ai rivenditori.</b> Registrati gratis con la tua partita IVA per vedere il prezzo e richiedere il lotto.<br>
<a class="cta" href="/#lotto-${l.id}">Vedi prezzo e richiedi</a><a class="cta o" href="https://wa.me/${AZ.wa}?text=${encodeURIComponent('Buongiorno, vorrei informazioni sul lotto: ' + l.title)}">Chiedi su WhatsApp</a></div>`}
<h2>Descrizione del lotto</h2>${fmt(l.description)}
${items.length ? `<h2>Composizione del lotto</h2><table><tr><th>Articolo</th><th class="r">Quantità</th></tr>${items.map(i => `<tr><td>${esc(i.name)}</td><td class="r">${i.qty ? num(i.qty) : '–'}</td></tr>`).join('')}</table>` : ''}
<h2>Come acquistare questo stock</h2><p>Vendiamo a rivenditori, grossisti, negozi, ambulanti ed e-commerce con partita IVA. La merce si può vedere su appuntamento nel nostro magazzino di Carpi (MO), con ritiro diretto o spedizione in Italia e all'estero. Chiamaci o scrivici su WhatsApp al <a href="tel:+${AZ.wa}">${AZ.tel}</a>, oppure scrivi a <a href="mailto:${AZ.email}">${AZ.email}</a>.</p>
${related.length ? `<h2>${cat && related.some(r => r.category === cat.slug) ? `Altri stock di ${esc(lc(cat.name))} e lotti disponibili` : 'Altri lotti disponibili'}</h2><div class="grid">${related.map(card).join('')}</div>` : ''}
${sellBox}
</main>` + foot(usedCats);
}

function catIntro(c, ls) {
  const n = ls.length, pezzi = ls.reduce((s, l) => s + (Number(l.pieces) || 0), 0);
  return `<p>In questa pagina trovi ${n === 1 ? 'lo stock' : `tutti i ${n} stock`} di <b>${esc(lc(c.name))}</b> disponibili ora nel nostro magazzino di Carpi (MO)${pezzi ? `, per un totale di oltre ${num(pezzi)} pezzi` : ''}. È merce nuova da liquidazioni, fine serie, rimanenze e fallimenti, venduta a lotti interi, mezzi lotti o bancali a rivenditori, grossisti, negozi, ambulanti ed e-commerce.</p>
<p>I prezzi sono riservati ai rivenditori: <a href="/">registrati gratis con la tua partita IVA</a> per vederli, oppure chiedi una quotazione su <a href="https://wa.me/${AZ.wa}?text=${encodeURIComponent('Buongiorno, vorrei informazioni sugli stock di ' + lc(c.name))}">WhatsApp</a>.</p>`;
}

function catPage(c, ls, usedCats) {
  const url = SITE + catPath(c);
  const desc = short(`Stock di ${lc(c.name)} all'ingrosso per rivenditori: ${ls.slice(0, 3).map(l => l.title).join('; ')}. Merce nuova, magazzino a Carpi (MO).`);
  const img = ls.find(l => l.photos?.length);
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, WEBSITE,
    { '@type': 'CollectionPage', '@id': url + '#page', url, name: `Stock ${c.name}`, description: desc, inLanguage: 'it-IT', isPartOf: { '@id': SITE + '/#website' },
      mainEntity: { '@type': 'ItemList', numberOfItems: ls.length, itemListElement: ls.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + lotPath(l), name: l.title })) } },
    crumbs([['Home', SITE + '/'], ['Lotti', SITE + '/lotti/'], [c.name, url]])] };
  return head({ title: `Stock ${lc(c.name)} all'ingrosso | Il Boss degli Stock`, desc, url, img: img ? photo(img.photos[0]) : null, jsonld }) + `
<main class="w"><p class="bc"><a href="/">Home</a> › <a href="/lotti/">Lotti</a> › ${esc(c.name)}</p>
<h1>Stock ${esc(lc(c.name))} per rivenditori</h1>
${catIntro(c, ls)}
<div class="grid">${ls.map(card).join('')}</div>
<h2>Altre categorie di stock</h2><div class="chips">${usedCats.filter(x => x.slug !== c.slug).map(x => `<a href="${catPath(x)}">${esc(x.name)}</a>`).join('')}</div>
${sellBox}
</main>` + foot(usedCats);
}

function listPage(lots, byCat, usedCats) {
  const url = SITE + '/lotti/';
  const active = lots.filter(l => l.status !== 'venduto');
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, WEBSITE,
    { '@type': 'CollectionPage', '@id': url + '#page', url, name: 'Stock e lotti disponibili', inLanguage: 'it-IT', isPartOf: { '@id': SITE + '/#website' },
      mainEntity: { '@type': 'ItemList', numberOfItems: lots.length, itemListElement: lots.map((l, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + lotPath(l), name: l.title })) } },
    crumbs([['Home', SITE + '/'], ['Lotti', url]])] };
  const first = lots.find(l => l.photos?.length);
  return head({ title: 'Stock e lotti di merce nuova per rivenditori | Il Boss degli Stock', desc: short(`Catalogo aggiornato di ${active.length} stock e lotti di merce nuova per rivenditori: ${usedCats.slice(0, 7).map(c => lc(c.name)).join(', ')} e altro. Magazzino a Carpi (MO).`), url, img: first ? photo(first.photos[0]) : null, jsonld }) + `
<main class="w"><p class="bc"><a href="/">Home</a> › Lotti</p><h1>Stock e lotti disponibili</h1>
<p>${active.length} stock di merce nuova per rivenditori, grossisti, negozi ed e-commerce: liquidazioni, fine serie, rimanenze di magazzino e fallimenti, a lotti interi, mezzi lotti o bancali. Prezzi riservati ai rivenditori registrati: <a href="/">apri la vetrina</a> e registrati gratis con la tua partita IVA.</p>
<div class="chips">${usedCats.map(c => `<a href="${catPath(c)}">${esc(c.name)}</a>`).join('')}</div>
${byCat.map(({ c, ls }) => `<h2><a href="${catPath(c)}" style="color:inherit">Stock ${esc(lc(c.name))}</a></h2><div class="grid">${ls.map(card).join('')}</div>`).join('')}
${sellBox}
</main>` + foot(usedCats);
}

const FAQ = [
  ['Chi può acquistare gli stock?', 'Vendiamo a rivenditori, negozi, grossisti, ambulanti, outlet ed e-commerce con partita IVA, in Italia e all\'estero.'],
  ['Come vedo i prezzi dei lotti?', 'Registrati gratis sul sito con i dati della tua azienda e la partita IVA. Verifichiamo la richiesta e attiviamo l\'account: da quel momento vedi i prezzi di tutti i lotti. Per fare prima scrivici su WhatsApp.'],
  ['Si può comprare solo una parte di un lotto?', 'Sì, oltre ai lotti interi vendiamo spesso mezzi lotti, singoli bancali o bancali misti. Le quantità minime sono indicate su ogni lotto o te le diamo su richiesta.'],
  ['Dove si trova la merce? Si può vedere?', 'Tutta la merce è nel nostro magazzino in Via Lombardia 19/D a Carpi (MO). Puoi venire a vederla e ritirarla su appuntamento, dal lunedì al venerdì.'],
  ['Spedite gli stock?', 'Sì, organizziamo la spedizione dei bancali in tutta Italia e all\'estero, oppure puoi ritirare direttamente in magazzino con il tuo mezzo.'],
  ['Acquistate stock di magazzino?', 'Sì: compriamo rimanenze, fine serie, stock da fallimenti e cessazioni di attività, resi e bancali di ogni genere. Mandaci foto, quantità e prezzo richiesto e ti rispondiamo in breve.']
];

function homeBlock(lots, usedCats) {
  const active = lots.filter(l => l.status !== 'venduto');
  return `<!--SEO--><section id="seoHome" class="wrap seo-home">
<h2>Stock, liquidazioni e bancali di merce nuova per rivenditori</h2>
<p><b>Il Boss degli Stock</b> è il marchio di ${AZ.nome} dedicato alla vendita all'ingrosso di stock: lotti di merce nuova da liquidazioni, fine serie, rimanenze di magazzino, fallimenti e cessazioni di attività. Vendiamo a rivenditori, negozi, grossisti, ambulanti, outlet ed e-commerce in tutta Italia e all'estero. Tutta la merce è visibile nel nostro magazzino di Carpi (MO).</p>
<h3>Stock per categoria</h3><div class="seo-chips">${usedCats.map(c => `<a href="${catPath(c)}">Stock ${esc(lc(c.name))}</a>`).join('')}</div>
<h3>Ultimi lotti disponibili</h3><ul class="seo-list">${active.map(l => `<li><a href="${lotPath(l)}">${esc(l.title)}</a></li>`).join('')}</ul>
<p><a href="/lotti/">Vedi il catalogo completo dei lotti</a></p>
<h3>Come funziona</h3><ol><li><b>Registrati gratis</b> con i dati della tua azienda e la partita IVA.</li><li><b>Approviamo l'account</b> e vedi i prezzi di tutti i lotti.</li><li><b>Richiedi il lotto</b> dal sito o su WhatsApp: vieni a vederlo a Carpi o te lo spediamo.</li></ol>
<h3>Vendi il tuo stock</h3><p>Acquistiamo stock di magazzino di ogni genere: rimanenze, fine serie, resi, bancali e merce da fallimenti. <a href="/vendi-il-tuo-stock/">Scopri come vendere il tuo stock</a>.</p>
<h3>Domande frequenti</h3>${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<p class="seo-contact">${AZ.nome} · Magazzino ${AZ.magazzino} · Tel. e WhatsApp <a href="tel:+${AZ.wa}">${AZ.tel}</a> · <a href="mailto:${AZ.email}">${AZ.email}</a> · <a href="/contatti/">Contatti</a></p>
</section><!--/SEO-->`;
}

function sellPage(usedCats) {
  const url = SITE + '/vendi-il-tuo-stock/';
  const desc = 'Vuoi vendere uno stock di magazzino? Acquistiamo rimanenze, fine serie, resi, bancali e merce da fallimenti. Valutazione rapida, pagamento e ritiro in tutta Italia.';
  const faq = [
    ['Che tipo di stock acquistate?', 'Merce nuova di quasi tutti i settori: casa, igiene, cartoleria, occhiali, giocattoli, illuminazione, ferramenta, abbigliamento, accessori, attrezzature professionali e molto altro. Valutiamo anche bancali misti e interi magazzini.'],
    ['Quanto tempo serve per una valutazione?', 'Di solito rispondiamo in breve tempo dopo aver ricevuto foto, quantità e prezzo richiesto.'],
    ['Venite a ritirare la merce?', 'Sì, organizziamo il ritiro in tutta Italia, oppure puoi consegnarla nel nostro magazzino di Carpi (MO).']
  ];
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, WEBSITE,
    { '@type': 'WebPage', '@id': url + '#page', url, name: 'Vendi il tuo stock', description: desc, inLanguage: 'it-IT', isPartOf: { '@id': SITE + '/#website' } },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    crumbs([['Home', SITE + '/'], ['Vendi il tuo stock', url]])] };
  return head({ title: 'Vendi il tuo stock di magazzino: acquistiamo rimanenze | Il Boss degli Stock', desc, url, jsonld }) + `
<main class="w"><p class="bc"><a href="/">Home</a> › Vendi il tuo stock</p>
<h1>Vendi il tuo stock di magazzino</h1>
<p>Hai merce ferma in magazzino? <b>Il Boss degli Stock</b> (${AZ.nome}) acquista stock di ogni genere da aziende, negozi, produttori, importatori e curatori fallimentari: rimanenze, fine serie, collezioni passate, resi, sovrapproduzioni, bancali misti e interi magazzini da cessazione di attività.</p>
<div class="box"><b>Mandaci la tua proposta:</b> foto della merce, quantità, tipo di imballo e prezzo richiesto.<br>
<a class="cta" href="/#proponi">Compila il modulo</a><a class="cta o" href="https://wa.me/${AZ.wa}?text=${encodeURIComponent('Buongiorno, ho uno stock da proporvi.')}">Scrivici su WhatsApp</a></div>
<h2>Come funziona</h2><ol><li><b>Ci invii la proposta</b> dal modulo o su WhatsApp, con foto, quantità e prezzo.</li><li><b>Valutiamo lo stock</b> e ti rispondiamo con un'offerta o con le nostre domande.</li><li><b>Ritiro e pagamento</b>: organizziamo il ritiro o lo porti nel magazzino di Carpi (MO).</li></ol>
<h2>Cosa acquistiamo</h2><p>Lavoriamo soprattutto con merce nuova e confezionata. Ecco le categorie che trattiamo più spesso:</p>
<div class="chips">${usedCats.map(c => `<a href="${catPath(c)}">${esc(c.name)}</a>`).join('')}</div>
<h2>Domande frequenti</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}
<h2>Contatti</h2><p>Telefono e WhatsApp <a href="tel:+${AZ.wa}">${AZ.tel}</a> · Email <a href="mailto:${AZ.email}">${AZ.email}</a> · ${AZ.orari}.<br>Magazzino: ${AZ.magazzino}.</p>
</main>` + foot(usedCats);
}

function contactPage(usedCats) {
  const url = SITE + '/contatti/';
  const desc = `Contatti Il Boss degli Stock (${AZ.nome}): magazzino in Via Lombardia 19/D a Carpi (MO), telefono e WhatsApp ${AZ.tel}, email ${AZ.email}. Visione merce su appuntamento.`;
  const jsonld = { '@context': 'https://schema.org', '@graph': [ORG, WEBSITE,
    { '@type': 'ContactPage', '@id': url + '#page', url, name: 'Contatti', description: desc, inLanguage: 'it-IT', isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#org' } },
    crumbs([['Home', SITE + '/'], ['Contatti', url]])] };
  const maps = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Via Lombardia 19/D, 41012 Carpi MO');
  return head({ title: 'Contatti e magazzino a Carpi (MO) | Il Boss degli Stock', desc: short(desc), url, jsonld }) + `
<main class="w"><p class="bc"><a href="/">Home</a> › Contatti</p>
<h1>Contatti</h1>
<p>Per informazioni sugli stock, quotazioni, visite in magazzino o per proporci la tua merce, contattaci nei giorni lavorativi (${AZ.orari}).</p>
<div class="box"><h2 style="margin-top:0">Telefono e WhatsApp</h2><p><a href="tel:+${AZ.wa}">${AZ.tel}</a></p>
<a class="cta" href="https://wa.me/${AZ.wa}?text=${encodeURIComponent('Buongiorno, vi contatto dal sito Il Boss degli Stock.')}">Scrivici su WhatsApp</a><a class="cta o" href="/#contatti">Modulo di contatto</a></div>
<div class="box"><h2 style="margin-top:0">Email</h2><p><a href="mailto:${AZ.email}">${AZ.email}</a></p></div>
<div class="box"><h2 style="margin-top:0">Magazzino e sede operativa</h2><p>${AZ.magazzino}<br>Visione della merce e ritiro su appuntamento.<br><a href="${maps}">Apri in Google Maps</a></p></div>
<div class="box"><h2 style="margin-top:0">Dati aziendali</h2><p>${AZ.nome}<br>Sede legale: ${AZ.legale}<br>P.IVA e C.F. ${AZ.piva} · REA ${AZ.rea}</p></div>
</main>` + foot(usedCats);
}

function llms(lots, cats, usedCats) {
  const cat = s => cats.find(c => c.slug === s)?.name || s;
  return `# Il Boss degli Stock

> Il Boss degli Stock (${SITE}) è il sito di ${AZ.nome} dedicato alla vendita di stock, liquidazioni, lotti e bancali di merce nuova a rivenditori, grossisti, negozi, ambulanti ed e-commerce in Italia e all'estero. Acquista anche stock di magazzino (rimanenze, fine serie, fallimenti, resi). Magazzino a Carpi (MO).

- Azienda: ${AZ.nome}, P.IVA ${AZ.piva}, sede legale ${AZ.legale}
- Magazzino e sede operativa: ${AZ.magazzino} (visione merce e ritiro su appuntamento)
- Contatti: telefono e WhatsApp ${AZ.tel}, email ${AZ.email}, ${AZ.orari}
- I prezzi sono riservati ai rivenditori registrati e approvati: per una quotazione contattare l'azienda.
- Vendi il tuo stock: ${SITE}/vendi-il-tuo-stock/

## Categorie

${usedCats.map(c => `- [Stock ${lc(c.name)}](${SITE}${catPath(c)})`).join('\n')}

## Lotti disponibili

${lots.filter(l => l.status !== 'venduto').map(l => `- [${l.title}](${SITE}${lotPath(l)}): ${cat(l.category)}. ${short(l.description, 260)}`).join('\n')}

## Pagine

- [Catalogo completo dei lotti](${SITE}/lotti/)
- [Vetrina e registrazione rivenditori](${SITE}/)
- [Vendi il tuo stock](${SITE}/vendi-il-tuo-stock/)
- [Contatti](${SITE}/contatti/)
`;
}

const main = async () => {
  const { lots, items, cats } = await load();
  const itemsBy = id => items.filter(i => i.lot_id === id).sort((a, b) => a.position - b.position);
  const catOf = s => cats.find(c => c.slug === s);
  const byCat = cats.map(c => ({ c, ls: lots.filter(l => l.category === c.slug) })).filter(x => x.ls.length);
  const usedCats = byCat.map(x => x.c);
  const active = lots.filter(l => l.status !== 'venduto');
  const newest = [...active].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id);

  // cartelle generate: vengono ricreate da zero a ogni esecuzione
  for (const d of ['lotti', 'stock', 'vendi-il-tuo-stock', 'contatti']) fs.rmSync(path.join(DOCS, d), { recursive: true, force: true });
  const write = (p, html) => { const f = path.join(DOCS, p, 'index.html'); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };

  for (const l of lots) {
    const same = active.filter(x => x.id !== l.id && x.category === l.category);
    const others = newest.filter(x => x.id !== l.id && x.category !== l.category);
    const related = [...same, ...others].slice(0, 6);
    write(lotPath(l), lotPage(l, itemsBy(l.id), catOf(l.category), related, usedCats));
  }
  for (const { c, ls } of byCat) write(catPath(c), catPage(c, ls, usedCats));
  write('/lotti/', listPage(lots, byCat, usedCats));
  write('/vendi-il-tuo-stock/', sellPage(usedCats));
  write('/contatti/', contactPage(usedCats));

  const today = new Date().toISOString().slice(0, 10);
  const day = s => (s || '').slice(0, 10) || today;
  const lastLot = lots.reduce((m, l) => day(l.created_at) > m ? day(l.created_at) : m, '2026-10-31');
  const urls = [
    { loc: SITE + '/', lm: lastLot, img: [SITE + '/logo.png'] },
    { loc: SITE + '/lotti/', lm: lastLot },
    ...usedCats.map(c => ({ loc: SITE + catPath(c), lm: byCat.find(x => x.c === c).ls.reduce((m, l) => day(l.created_at) > m ? day(l.created_at) : m, '2026-10-31') })),
    ...lots.map(l => ({ loc: SITE + lotPath(l), lm: day(l.created_at), img: (l.photos || []).slice(0, 20).map(photo) })),
    { loc: SITE + '/vendi-il-tuo-stock/', lm: '2026-11-09' },
    { loc: SITE + '/contatti/', lm: '2026-11-09' }
  ];
  fs.writeFileSync(path.join(DOCS, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(u => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lm}</lastmod>${(u.img || []).map(i => `<image:image><image:loc>${esc(i)}</image:loc></image:image>`).join('')}</url>`).join('\n')}
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
  fs.writeFileSync(path.join(DOCS, 'llms.txt'), llms(lots, cats, usedCats));

  // Home: blocco SEO statico (resta visibile sotto la vetrina) + dati strutturati
  const homeLd = `<!--ORGLD--><script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': [ORG, WEBSITE,
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }] }).replace(/</g, '\\u003c')}</script><!--/ORGLD-->`;
  const idx = path.join(DOCS, 'index.html');
  let s = fs.readFileSync(idx, 'utf8');
  if (!s.includes('<!--SEO-->') || !s.includes('<!--ORGLD-->')) throw new Error('Segnaposto SEO mancanti in index.html');
  s = s.replace(/<!--SEO-->[\s\S]*?<!--\/SEO-->/, () => homeBlock(newest, usedCats)).replace(/<!--ORGLD-->[\s\S]*?<!--\/ORGLD-->/, () => homeLd);
  fs.writeFileSync(idx, s);
  // 404: stessa app della home (serve per i vecchi link), ma esclusa dall'indice di Google
  const s404 = s.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">')
    .replace(/<link rel="canonical"[^>]*>\n?/, '');
  fs.writeFileSync(path.join(DOCS, '404.html'), s404.includes('noindex') ? s404 : s404.replace('<head>', '<head>\n<meta name="robots" content="noindex">'));
  console.log(`OK: ${lots.length} lotti, ${usedCats.length} categorie, sitemap con ${urls.length} URL`);
};
main().catch(e => { console.error(e); process.exit(1); });
