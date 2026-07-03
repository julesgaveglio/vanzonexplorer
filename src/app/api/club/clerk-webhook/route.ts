// Alias legacy — l'URL configurée dans le dashboard Clerk pointe encore ici.
// Handler réel : /api/clerk-webhook (sync Clerk → Supabase profiles, pas lié au club).
// À supprimer une fois l'endpoint mis à jour dans le dashboard Clerk.
export { POST } from "../../clerk-webhook/route";
