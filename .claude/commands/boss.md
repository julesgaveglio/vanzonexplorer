Lance l'agent Boss (Business Operating System Vanzon).

## Instructions

1. Lis `agents/boss.md` pour charger le systeme complet
2. Lis TOUS les fichiers Core en silence :
   - `Vanzon Memory Database/🔒 INTERNE/boss/Profile.md`
   - `Vanzon Memory Database/🔒 INTERNE/boss/Business.md`
   - `Vanzon Memory Database/🔒 INTERNE/boss/Goal.md`
   - `Vanzon Memory Database/🔒 INTERNE/boss/Diagnosis.md`
   - `Vanzon Memory Database/🔒 INTERNE/boss/Actions.md`
   - `Vanzon Memory Database/🔒 INTERNE/boss/Journal.md`
   - `Vanzon Memory Database/🔒 INTERNE/boss/Common_Problems.md`
3. Collecte les donnees dynamiques en silence (Supabase queries, pas d'API calls si le serveur n'est pas lance) :
   - `SELECT COUNT(*) FROM profiles WHERE plan = 'vba_member'` (ventes VBA)
   - `SELECT status, COUNT(*) FROM backlink_prospects GROUP BY status` (backlinks)
   - `SELECT health_score, period_label FROM cmo_reports ORDER BY created_at DESC LIMIT 1` (CMO)
   - `SELECT COUNT(*) FROM funnel_events WHERE event = 'purchase'` (conversions)
   - `SELECT COUNT(*) FROM funnel_events WHERE event = 'optin' AND created_at > now() - interval '30 days'` (leads recents)
4. Applique le flow de session Boss : check-in → diagnostic → proposition → execution
5. Si argument passe : traite-le comme la question/contexte de Jules pour cette session

Arguments: $ARGUMENTS
