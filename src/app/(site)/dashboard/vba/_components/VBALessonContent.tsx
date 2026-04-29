"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import {
  Pencil,
  X,
  Save,
  Bold,
  Heading2,
  Heading3,
  List,
  ImagePlus,
  Loader2,
} from "lucide-react";

interface Props {
  lessonId: string;
  initialContent: string | null;
  isAdmin: boolean;
}

export default function VBALessonContent({
  lessonId,
  initialContent,
  isAdmin,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState(initialContent ?? "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-xl max-w-full" },
      }),
    ],
    content: content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm prose-slate max-w-none min-h-[200px] focus:outline-none px-4 py-3",
      },
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    const html = editor.getHTML();

    try {
      const res = await fetch("/api/admin/vba/lesson-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, content: html }),
      });

      if (!res.ok) throw new Error("Erreur sauvegarde");

      setContent(html);
      setIsEditing(false);
    } catch (err) {
      alert("Erreur lors de la sauvegarde : " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [editor, lessonId]);

  const handleImageUpload = useCallback(async () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("lessonId", lessonId);

        const res = await fetch("/api/admin/vba/lesson-content", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload échoué");

        const { url } = await res.json();
        editor.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        alert("Erreur upload : " + (err as Error).message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [editor, lessonId]);

  const handleCancel = useCallback(() => {
    editor?.commands.setContent(content || "");
    setIsEditing(false);
  }, [editor, content]);

  // Read-only mode: show content if it exists
  if (!isEditing) {
    return (
      <div className="relative">
        {/* Edit button — admin only */}
        {isAdmin && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute -top-2 right-0 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Modifier le contenu"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}

        {/* Published content */}
        {content ? (
          <div
            className="prose prose-sm prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : isAdmin ? (
          <button
            onClick={() => setIsEditing(true)}
            className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
          >
            + Ajouter du contenu sous cette vidéo
          </button>
        ) : null}
      </div>
    );
  }

  // Edit mode: TipTap editor
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor?.isActive("heading", { level: 2 })}
          title="Titre H2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor?.isActive("heading", { level: 3 })}
          title="Titre H3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
          title="Liste"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <ToolbarButton
          onClick={handleImageUpload}
          disabled={uploading}
          title="Ajouter une image"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
        </ToolbarButton>

        {/* Right side: Save / Cancel */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-gold inline-flex items-center gap-1 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active
          ? "bg-slate-200 text-slate-900"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
