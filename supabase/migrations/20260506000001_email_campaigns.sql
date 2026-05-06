-- Email campaigns & send tracking
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  campaign_name TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_campaigns_public_read" ON email_campaigns FOR SELECT USING (true);
CREATE POLICY "email_sends_public_read" ON email_sends FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_email_sends_email ON email_sends(email);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);

-- Seed: Email général Book
INSERT INTO email_campaigns (name, subject, body_html)
VALUES (
  'Email général Book',
  '30min pour parler van ?',
  '<p>Salut {{firstname}},</p>
<p>J''ai vu que tu t''intéressais aux <b>vans aménagés</b>.</p>
<p>Cette semaine, j''ouvre quelques créneaux de <b>30 minutes</b> pour échanger avec des personnes qui songent à se lancer dans un projet d''aménagement de van. L''idée c''est simple : répondre à toutes tes questions. <b>C''est complètement gratuit.</b></p>
<p><b>Qu''est-ce que j''y gagne ?</b></p>
<p>Mon objectif est tout simplement d''échanger avec des personnes en projet de van aménagé et d''apprendre de vos questionnements tout en vous aidant. Ça m''aide à améliorer et créer le meilleur accompagnement possible pour mon projet personnel <b>Van Business Academy</b>. Rassure-toi, je n''ai rien à te vendre. Je sais que les gens sont souvent réticents, et c''est normal.</p>
<p>Alors profite-en !😁 Clic en dessous pour programmer ton appel.</p>
<p style="margin:28px 0;text-align:center;"><a href="https://calendly.com/vanzonexplorer/new-meeting?utm_source=email&utm_medium=broadcast&utm_campaign=appel-offert" target="_blank" style="display:inline-block;background:#0F172A;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:16px;font-weight:700;">☎️ 30min Offert</a></p>
<p>À très vite,</p>
<p>Jules</p>'
);
