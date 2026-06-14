"use client";

import { useState, useTransition } from "react";
import { MessageCircle, Trash2, Send, Loader2 } from "lucide-react";
import { addComment, deleteComment } from "../_actions";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile: {
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Props {
  lessonId: string;
  initialComments: Comment[];
  currentUserId: string;
  isAdmin: boolean;
  currentUserProfile: {
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

function UserAvatar({
  avatarUrl,
  name,
  size = "md",
}: {
  avatarUrl: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const dimensions = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dimensions} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dimensions} rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-white`}
      style={{
        background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
      }}
    >
      {initials || "?"}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function CommentItem({
  comment,
  currentUserId,
  isAdmin,
}: {
  comment: Comment;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  const canDelete = isAdmin || comment.user_id === currentUserId;
  const displayName =
    comment.profile?.display_name ||
    comment.profile?.full_name ||
    "Membre VBA";

  if (deleted) return null;

  const handleDelete = () => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      setDeleted(true);
    });
  };

  return (
    <div className="flex gap-3 group">
      <UserAvatar
        avatarUrl={comment.profile?.avatar_url ?? null}
        name={displayName}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-900 truncate">
            {displayName}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {formatRelativeTime(comment.created_at)}
          </span>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-1 -m-1"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm text-slate-600 whitespace-pre-line break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

export default function VBAComments({
  lessonId,
  initialComments,
  currentUserId,
  isAdmin,
  currentUserProfile,
}: Props) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const displayName =
    currentUserProfile.display_name ||
    currentUserProfile.full_name ||
    "Membre VBA";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const text = content;
    setContent("");

    startTransition(async () => {
      await addComment(lessonId, text);
    });
  };

  return (
    <div className="border-t border-slate-100 pt-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-5 h-5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Commentaires
          {initialComments.length > 0 && (
            <span className="ml-1.5 text-slate-300">
              ({initialComments.length})
            </span>
          )}
        </h3>
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <UserAvatar
          avatarUrl={currentUserProfile.avatar_url}
          name={displayName}
        />
        <div className="flex-1 relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Poser une question ou partager un retour..."
            maxLength={2000}
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = target.scrollHeight + "px";
            }}
            className="w-full px-4 py-3 pr-12 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-colors placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!content.trim() || isPending}
            className="absolute right-2 bottom-2 p-2 rounded-lg text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background:
                content.trim() && !isPending
                  ? "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)"
                  : "#cbd5e1",
            }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Comments list */}
      {initialComments.length > 0 ? (
        <div className="space-y-5">
          {initialComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-6">
          Aucun commentaire pour le moment. Soyez le premier à partager !
        </p>
      )}
    </div>
  );
}
