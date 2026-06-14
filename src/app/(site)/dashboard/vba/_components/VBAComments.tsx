"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { MessageCircle, Trash2, Loader2, ChevronDown, Reply } from "lucide-react";
import { addComment, deleteComment } from "../_actions";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
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

// --------------- Comment Input ---------------

function CommentInput({
  onSubmit,
  placeholder,
  avatarUrl,
  name,
  autoFocus,
  compact,
}: {
  onSubmit: (text: string) => void;
  placeholder: string;
  avatarUrl: string | null;
  name: string;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;
    const text = content;
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    startTransition(() => {
      onSubmit(text);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const avatarSize = compact ? "sm" : "md";

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <UserAvatar avatarUrl={avatarUrl} name={name} size={avatarSize} />
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={2000}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
          className={`w-full pr-12 text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-colors placeholder:text-slate-400 ${
            compact ? "px-3 py-2.5 text-[13px]" : "px-4 py-3"
          }`}
        />
        <button
          type="submit"
          disabled={!content.trim() || isPending}
          className={`absolute right-1.5 rounded-lg text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 ${
            compact ? "bottom-1.5 p-1.5" : "bottom-2 p-2"
          }`}
          style={{
            background:
              content.trim() && !isPending
                ? "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)"
                : "#cbd5e1",
          }}
        >
          {isPending ? (
            <Loader2 className={`animate-spin ${compact ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
            >
              <path
                d="M5.4 21.6L22 12L5.4 2.4L7.8 10.8L16 12L7.8 13.2L5.4 21.6Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}

// --------------- Single Comment ---------------

function CommentItem({
  comment,
  replies,
  currentUserId,
  isAdmin,
  lessonId,
  currentUserProfile,
}: {
  comment: Comment;
  replies: Comment[];
  currentUserId: string;
  isAdmin: boolean;
  lessonId: string;
  currentUserProfile: Props["currentUserProfile"];
}) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replying, setReplying] = useState(false);

  const canDelete = isAdmin || comment.user_id === currentUserId;
  const displayName =
    comment.profile?.display_name ||
    comment.profile?.full_name ||
    "Membre VBA";

  const currentDisplayName =
    currentUserProfile.display_name ||
    currentUserProfile.full_name ||
    "Membre VBA";

  if (deleted) return null;

  const handleDelete = () => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      setDeleted(true);
    });
  };

  const handleReply = async (text: string) => {
    await addComment(lessonId, text, comment.id);
    setReplying(false);
    setShowReplies(true);
  };

  const replyCount = replies.length;

  return (
    <div>
      {/* Main comment */}
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

          {/* Reply button */}
          <button
            onClick={() => setReplying(!replying)}
            className="mt-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
          >
            <Reply className="w-3 h-3" />
            Répondre
          </button>
        </div>
      </div>

      {/* Replies section */}
      {replyCount > 0 && (
        <div className="ml-11 mt-2">
          {/* Toggle replies — Instagram style */}
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors mb-2"
          >
            <span className="w-6 h-px bg-slate-300" />
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showReplies ? "rotate-180" : ""}`}
            />
            {showReplies
              ? "Masquer les réponses"
              : replyCount === 1
                ? "Voir 1 réponse"
                : `Voir ${replyCount} réponses`}
          </button>

          {/* Replies list */}
          {showReplies && (
            <div className="space-y-4 border-l-2 border-slate-100 pl-4">
              {replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reply form */}
      {replying && (
        <div className="ml-11 mt-3">
          <CommentInput
            onSubmit={handleReply}
            placeholder={`Répondre à ${displayName}...`}
            avatarUrl={currentUserProfile.avatar_url}
            name={currentDisplayName}
            autoFocus
            compact
          />
        </div>
      )}
    </div>
  );
}

// --------------- Reply Item ---------------

function ReplyItem({
  reply,
  currentUserId,
  isAdmin,
}: {
  reply: Comment;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [deleted, setDeleted] = useState(false);

  const canDelete = isAdmin || reply.user_id === currentUserId;
  const displayName =
    reply.profile?.display_name ||
    reply.profile?.full_name ||
    "Membre VBA";

  if (deleted) return null;

  const handleDelete = () => {
    if (!confirm("Supprimer cette réponse ?")) return;
    startTransition(async () => {
      await deleteComment(reply.id);
      setDeleted(true);
    });
  };

  return (
    <div className="flex gap-2.5 group">
      <UserAvatar
        avatarUrl={reply.profile?.avatar_url ?? null}
        name={displayName}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-slate-900 truncate">
            {displayName}
          </span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {formatRelativeTime(reply.created_at)}
          </span>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="ml-auto opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-all p-1 -m-1"
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-[13px] text-slate-600 whitespace-pre-line break-words">
          {reply.content}
        </p>
      </div>
    </div>
  );
}

// --------------- Main Component ---------------

export default function VBAComments({
  lessonId,
  initialComments,
  currentUserId,
  isAdmin,
  currentUserProfile,
}: Props) {
  const displayName =
    currentUserProfile.display_name ||
    currentUserProfile.full_name ||
    "Membre VBA";

  // Separate root comments from replies
  const rootComments = initialComments.filter((c) => !c.parent_id);
  const repliesByParent = new Map<string, Comment[]>();
  for (const c of initialComments) {
    if (c.parent_id) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  }

  const totalCount = initialComments.length;

  const handleNewComment = async (text: string) => {
    await addComment(lessonId, text);
  };

  return (
    <div className="border-t border-slate-100 pt-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-5 h-5 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Commentaires
          {totalCount > 0 && (
            <span className="ml-1.5 text-slate-300">({totalCount})</span>
          )}
        </h3>
      </div>

      {/* Main comment form */}
      <div className="mb-6">
        <CommentInput
          onSubmit={handleNewComment}
          placeholder="Poser une question ou partager un retour..."
          avatarUrl={currentUserProfile.avatar_url}
          name={displayName}
        />
      </div>

      {/* Comments list */}
      {rootComments.length > 0 ? (
        <div className="space-y-6">
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) ?? []}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              lessonId={lessonId}
              currentUserProfile={currentUserProfile}
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
