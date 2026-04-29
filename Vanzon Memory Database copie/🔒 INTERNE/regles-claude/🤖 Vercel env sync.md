---
name: feedback_vercel_env_sync
description: Toujours synchroniser .env.local et Vercel quand un token/secret est régénéré
type: feedback
---

Quand un token ou secret est régénéré (Sanity, Clerk, etc.), TOUJOURS mettre à jour les deux :
1. `.env.local` (local)
2. Vercel env vars (`npx vercel env rm/add`)

**Why:** Jules a dû régénérer le token Sanity 3 fois parce que seul `.env.local` était mis à jour, pas Vercel. La médiathèque marchait en local mais cassait en prod.

**How to apply:** Après toute modification de `.env.local` impliquant un secret, proposer systématiquement de synchroniser sur Vercel avec `npx vercel env rm KEY production -y && echo "$VALUE" | npx vercel env add KEY production`. Puis redéployer avec `npx vercel --prod`.
