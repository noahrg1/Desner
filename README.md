# Desner Sport 580 — NZ sales site

Static site, no build step. Vercel serves it as-is.

## Deploy
1. Put these files at the root of a new GitHub repo (index.html at the top level).
2. Commit and push with GitHub Desktop.
3. In Vercel: Add New → Project → import the repo → Framework preset "Other" → Deploy.

## Edit
- Price, email, phone, viewing location: `config.js`
- Your own photos: drop them in `/images`, then list them in `config.js` under `gallery`
- Copy: `index.html`
- Hotspot descriptions on the fit-out image: `main.js` (the `SPOTS` list)
