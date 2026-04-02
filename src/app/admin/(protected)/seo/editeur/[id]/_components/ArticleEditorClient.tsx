"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";

interface Draft {
  id: string;
  title: string;
  html_content: string;
  excerpt: string;
  target_url: string;
  status: "draft" | "queued" | "archived";
}

interface Props {
  draft: Draft;
}

// ── Bouton toolbar ────────────────────────────────────────────────────────────
function TBtn({ active, onClick, title, children }: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors
        ${active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-200 mx-0.5" />;
}

export default function ArticleEditorClient({ draft }: Props) {
  const router = useRouter();
  const [title, setTitle]       = useState(draft.title);
  const [excerpt, setExcerpt]   = useState(draft.excerpt);
  const [targetUrl, setTargetUrl] = useState(draft.target_url);
  const [mode, setMode]         = useState<"wysiwyg" | "html">("wysiwyg");
  const [htmlValue, setHtmlValue] = useState(draft.html_content);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [linkUrl, setLinkUrl]   = useState("https://");
  const [linkText, setLinkText] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Tiptap editor ───────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" } }),
      Placeholder.configure({ placeholder: "Commencez à rédiger votre article…" }),
    ],
    content: draft.html_content,
    onUpdate({ editor }) {
      setHtmlValue(editor.getHTML());
      autoSave();
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none focus:outline-none min-h-[400px] px-1",
      },
    },
  });

  // ── Auto-save ───────────────────────────────────────────────────────────────
  const autoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      handleSave(true);
    }, 2500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  // Sync html mode → editor
  function handleHtmlChange(val: string) {
    setHtmlValue(val);
    autoSave();
  }

  function syncHtmlToEditor() {
    if (editor && mode === "html") {
      editor.commands.setContent(htmlValue, { emitUpdate: false });
    }
  }

  function switchMode(next: "wysiwyg" | "html") {
    if (next === "html" && editor) {
      setHtmlValue(editor.getHTML());
    }
    if (next === "wysiwyg" && editor) {
      editor.commands.setContent(htmlValue, { emitUpdate: false });
    }
    setMode(next);
  }

  function flash(type: "ok" | "err", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave(silent = false) {
    if (!silent) setSaving(true);
    const currentHtml = mode === "wysiwyg" ? (editor?.getHTML() ?? htmlValue) : htmlValue;

    await fetch(`/api/admin/seo/drafts/${draft.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, html_content: currentHtml, excerpt, target_url: targetUrl }),
    });

    if (!silent) {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  // ── Publier directement sur Sanity ──────────────────────────────────────────
  async function handlePublish() {
    if (!confirm("Publier cet article directement sur vanzonexplorer.com ?")) return;
    await handleSave(true);
    setPublishing(true);
    const res = await fetch(`/api/admin/seo/drafts/${draft.id}/publish`, { method: "POST" });
    setPublishing(false);
    const data = await res.json();
    if (!res.ok) {
      flash("err", data.error ?? "Erreur lors de la publication");
      return;
    }
    setPublishedUrl(data.url);
  }

  // ── Link insertion ──────────────────────────────────────────────────────────
  function openLinkModal() {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    setLinkText(selectedText);
    const existingHref = editor.getAttributes("link").href;
    setLinkUrl(existingHref || "https://");
    setLinkModal(true);
  }

  function applyLink() {
    if (!editor) return;
    if (!linkUrl || linkUrl === "https://") {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl, target: "_blank" }).run();
    }
    setLinkModal(false);
  }

  function removeLink() {
    editor?.chain().focus().unsetLink().run();
    setLinkModal(false);
  }

  const isPublished = draft.status === "archived";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/seo/editeur")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour
        </button>
        <div className="flex-1" />
        {saved && <span className="text-xs text-emerald-600 font-medium">Sauvegardé ✓</span>}
        {isPublished && <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-semibold">Publié</span>}
        <button
          onClick={() => handleSave()}
          disabled={saving}
          className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="px-4 py-2 bg-[#4D5FEC] hover:bg-[#3B4FD4] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          {publishing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {publishing ? "Publication…" : "Publier sur le site"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${feedback.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {feedback.msg}
        </div>
      )}

      {/* Metadata fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Titre de l&apos;article</label>
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); autoSave(); }}
            className="w-full text-xl font-bold text-slate-900 border-0 border-b border-slate-200 pb-2 focus:outline-none focus:border-blue-500 bg-transparent"
            placeholder="Titre de l'article"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Extrait / Résumé</label>
            <textarea
              value={excerpt}
              onChange={(e) => { setExcerpt(e.target.value); autoSave(); }}
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Résumé court de l'article…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">URL de backlink cible</label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => { setTargetUrl(e.target.value); autoSave(); }}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="https://vanzonexplorer.com/…"
            />
          </div>
        </div>
      </div>

      {/* Editor card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Mode toggle */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 bg-slate-50">
          <div className="flex gap-1">
            {(["wysiwyg", "html"] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors
                  ${mode === m ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
              >
                {m === "wysiwyg" ? "✏️ Éditeur" : "<> HTML"}
              </button>
            ))}
          </div>
          {mode === "html" && (
            <button
              onClick={() => { syncHtmlToEditor(); setMode("wysiwyg"); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Appliquer et voir le rendu →
            </button>
          )}
        </div>

        {/* Toolbar WYSIWYG */}
        {mode === "wysiwyg" && editor && (
          <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200 flex-wrap">
            {/* Undo / Redo */}
            <TBtn onClick={() => editor.chain().focus().undo().run()} title="Annuler (Ctrl+Z)">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            </TBtn>
            <TBtn onClick={() => editor.chain().focus().redo().run()} title="Rétablir (Ctrl+Y)">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" /></svg>
            </TBtn>
            <Divider />

            {/* Heading */}
            <TBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Titre H1">
              <span className="text-xs font-bold">H1</span>
            </TBtn>
            <TBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre H2">
              <span className="text-xs font-bold">H2</span>
            </TBtn>
            <TBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre H3">
              <span className="text-xs font-bold">H3</span>
            </TBtn>
            <Divider />

            {/* Formatting */}
            <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras (Ctrl+B)">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3V6.5zm3.5 9H10V14h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" /></svg>
            </TBtn>
            <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique (Ctrl+I)">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" /></svg>
            </TBtn>
            <TBtn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné (Ctrl+U)">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" /></svg>
            </TBtn>
            <Divider />

            {/* Lists */}
            <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /><circle cx="1.5" cy="6" r="1.5" fill="currentColor" /><circle cx="1.5" cy="12" r="1.5" fill="currentColor" /><circle cx="1.5" cy="18" r="1.5" fill="currentColor" /></svg>
            </TBtn>
            <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" /></svg>
            </TBtn>
            <TBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Citation">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" /></svg>
            </TBtn>
            <Divider />

            {/* Link — bouton principal */}
            <TBtn active={editor.isActive("link")} onClick={openLinkModal} title="Insérer / modifier un lien (Ctrl+K)">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </TBtn>
            {editor.isActive("link") && (
              <TBtn onClick={removeLink} title="Supprimer le lien">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </TBtn>
            )}
            <Divider />

            {/* Copy HTML */}
            <TBtn
              onClick={() => {
                const html = editor.getHTML();
                navigator.clipboard.writeText(html);
                flash("ok", "HTML copié dans le presse-papiers ✓");
              }}
              title="Copier le HTML"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </TBtn>
          </div>
        )}

        {/* Editor content */}
        <div className="p-6">
          {mode === "wysiwyg" ? (
            <EditorContent editor={editor} />
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-2">Éditez le HTML directement. Cliquez sur &ldquo;Appliquer et voir le rendu&rdquo; pour visualiser.</p>
              <textarea
                value={htmlValue}
                onChange={(e) => handleHtmlChange(e.target.value)}
                className="w-full h-[500px] font-mono text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y bg-slate-50 text-slate-700"
                spellCheck={false}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(htmlValue);
                    flash("ok", "HTML copié ✓");
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Copier HTML
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal insertion lien */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editor?.isActive("link") ? "Modifier le lien" : "Insérer un lien"}
            </h3>

            {linkText && (
              <div className="mb-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Texte du lien</label>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 truncate">
                  {linkText}
                </div>
              </div>
            )}

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">URL</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyLink(); if (e.key === "Escape") setLinkModal(false); }}
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://vanzonexplorer.com/…"
              />
              <p className="text-[11px] text-slate-400 mt-1">Le lien s&apos;ouvrira dans un nouvel onglet.</p>
            </div>

            <div className="flex gap-2 justify-end">
              {editor?.isActive("link") && (
                <button onClick={removeLink} className="px-3 py-2 text-sm text-red-500 hover:text-red-700 transition-colors mr-auto">
                  Supprimer
                </button>
              )}
              <button onClick={() => setLinkModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Annuler
              </button>
              <button
                onClick={applyLink}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal succès publication */}
      {publishedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Article publié !</h3>
            <p className="text-sm text-slate-500 mb-6">
              L&apos;article est maintenant en ligne sur Vanzon Explorer.
            </p>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
              <svg className="w-4 h-4 text-[#4D5FEC] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs text-slate-600 font-mono truncate flex-1">{publishedUrl}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(publishedUrl); }}
                title="Copier le lien"
                className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setPublishedUrl(null); router.push("/admin/seo/editeur"); }}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
              >
                Retour à la liste
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2.5 bg-[#4D5FEC] hover:bg-[#3B4FD4] text-white text-sm font-semibold rounded-xl transition-colors text-center"
              >
                Voir l&apos;article →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Tiptap styles */}
      <style>{`
        .ProseMirror h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin: 1.5rem 0 0.75rem; line-height: 1.2; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 1.25rem 0 0.5rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; color: #334155; margin: 1rem 0 0.5rem; }
        .ProseMirror p { color: #374151; margin: 0 0 0.875rem; line-height: 1.75; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; margin: 0 0 0.875rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; margin: 0 0 0.875rem; }
        .ProseMirror li { color: #374151; margin-bottom: 0.35rem; line-height: 1.65; }
        .ProseMirror blockquote { border-left: 3px solid #3b82f6; margin: 1rem 0; padding: 0.5rem 1rem; background: #eff6ff; color: #1d4ed8; font-style: italic; border-radius: 0 0.375rem 0.375rem 0; }
        .ProseMirror a { color: #2563eb; text-decoration: underline; cursor: pointer; }
        .ProseMirror a:hover { color: #1d4ed8; }
        .ProseMirror strong { font-weight: 600; color: #0f172a; }
        .ProseMirror table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
        .ProseMirror th, .ProseMirror td { border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; }
        .ProseMirror th { background: #f8fafc; font-weight: 600; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #94a3b8; pointer-events: none; height: 0; }
        .ProseMirror:focus { outline: none; }
      `}</style>
    </div>
  );
}
