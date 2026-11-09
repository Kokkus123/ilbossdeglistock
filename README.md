# Il Boss degli Stock

Sito www.ilbossdeglistock.it (Cloudflare Worker + Supabase).

- sito/: pagina del sito
- foto/: foto dei lotti

## SEO
- `scripts/genera-seo.mjs` (ogni ora via GitHub Actions) genera da Supabase: pagine dei lotti `/lotti/…`, pagine categoria `/stock/<categoria>/`, `/vendi-il-tuo-stock/`, `/contatti/`, `sitemap.xml` (con immagini), `robots.txt`, `llms.txt`, il blocco SEO della home e la `404.html` (copia della home con noindex).
- `scripts/indexnow.mjs` avvisa Bing delle pagine cambiate.
- In `docs/index.html` la funzione `slugify` deve restare uguale a quella dello script.
