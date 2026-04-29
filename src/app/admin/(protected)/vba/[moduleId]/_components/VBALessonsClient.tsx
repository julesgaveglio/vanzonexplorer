"use client";

import { useState } from "react";
import {
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";

interface Resource {
  type: "pdf" | "image" | "link";
  url: string;
  label: string;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  bunny_video_id: string | null;
  bunny_library_id: string | null;
  duration_seconds: number | null;
  description: string | null;
  resources: Resource[];
  order: number;
  is_published: boolean;
  created_at: string;
  transcript?: string | null;
}

const inputCls =
  "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition-colors";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VBALessonsClient({
  moduleId,
  initialLessons,
}: {
  moduleId: string;
  initialLessons: Lesson[];
}) {
  const [lessons, setLessons] = useState(initialLessons);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [captionLoading, setCaptionLoading] = useState<string | null>(null);
  const [captionStatus, setCaptionStatus] = useState<string>("");

  async function generateCaptions(lessonId: string) {
    if (!confirm("Générer les sous-titres et chapitres pour cette leçon ?")) return;
    setCaptionLoading(lessonId);
    setCaptionStatus("Démarrage...");

    try {
      const res = await fetch("/api/admin/vba/generate-captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });

      if (!res.ok) throw new Error("Erreur API");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") setCaptionStatus(data.message);
            if (data.type === "done") {
              setCaptionStatus(`Terminé — ${data.chaptersCount} chapitres`);
              setLessons((prev) =>
                prev.map((l) =>
                  l.id === lessonId ? { ...l, transcript: "generated" } : l
                )
              );
            }
            if (data.type === "error") throw new Error(data.message);
          } catch { /* skip parse errors */ }
        }
      }
    } catch (err) {
      setCaptionStatus(`Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setTimeout(() => {
        setCaptionLoading(null);
        setCaptionStatus("");
      }, 3000);
    }
  }

  function openNewForm() {
    setEditingLesson({
      id: "",
      module_id: moduleId,
      title: "",
      slug: "",
      bunny_video_id: null,
      bunny_library_id: process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || null,
      duration_seconds: null,
      description: null,
      resources: [],
      order: 0,
      is_published: false,
      created_at: "",
    });
    setIsNew(true);
  }

  function openEditForm(lesson: Lesson) {
    setEditingLesson({ ...lesson });
    setIsNew(false);
  }

  async function saveLesson() {
    if (!editingLesson || !editingLesson.title.trim()) return;
    setActionLoading("save");

    try {
      if (isNew) {
        const res = await fetch("/api/admin/vba/lessons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module_id: moduleId,
            title: editingLesson.title,
            bunny_video_id: editingLesson.bunny_video_id,
            bunny_library_id: editingLesson.bunny_library_id,
            description: editingLesson.description,
            resources: editingLesson.resources,
            duration_seconds: editingLesson.duration_seconds,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLessons((prev) => [...prev, data.lesson]);
      } else {
        const res = await fetch("/api/admin/vba/lessons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingLesson.id,
            title: editingLesson.title,
            bunny_video_id: editingLesson.bunny_video_id,
            bunny_library_id: editingLesson.bunny_library_id,
            description: editingLesson.description,
            resources: editingLesson.resources,
            duration_seconds: editingLesson.duration_seconds,
            is_published: editingLesson.is_published,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLessons((prev) =>
          prev.map((l) => (l.id === data.lesson.id ? data.lesson : l))
        );
      }
      setEditingLesson(null);
      setIsNew(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteLesson(id: string) {
    if (!confirm("Supprimer cette leçon ?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/vba/lessons?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur");
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  }

  async function togglePublished(lesson: Lesson) {
    setActionLoading(lesson.id);
    try {
      const res = await fetch("/api/admin/vba/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lesson.id,
          is_published: !lesson.is_published,
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      setLessons((prev) =>
        prev.map((l) =>
          l.id === lesson.id ? { ...l, is_published: !l.is_published } : l
        )
      );
    } catch {
      alert("Erreur");
    } finally {
      setActionLoading(null);
    }
  }

  async function reorder(id: string, direction: "up" | "down") {
    const idx = lessons.findIndex((l) => l.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === lessons.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...lessons];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];
    const reordered = updated.map((l, i) => ({ ...l, order: i }));
    setLessons(reordered);

    await Promise.all([
      fetch("/api/admin/vba/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[idx].id, order: idx }),
      }),
      fetch("/api/admin/vba/lessons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[swapIdx].id, order: swapIdx }),
      }),
    ]);
  }

  // Resource helpers for the edit form
  function addResource() {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      resources: [
        ...editingLesson.resources,
        { type: "link", url: "", label: "" },
      ],
    });
  }

  function updateResource(
    index: number,
    field: keyof Resource,
    value: string
  ) {
    if (!editingLesson) return;
    const updated = [...editingLesson.resources];
    updated[index] = { ...updated[index], [field]: value };
    setEditingLesson({ ...editingLesson, resources: updated });
  }

  function removeResource(index: number) {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      resources: editingLesson.resources.filter((_, i) => i !== index),
    });
  }

  // Edit form
  if (editingLesson) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {isNew ? "Nouvelle leçon" : "Modifier la leçon"}
          </h2>
          <button
            onClick={() => {
              setEditingLesson(null);
              setIsNew(false);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              Titre
            </label>
            <input
              type="text"
              value={editingLesson.title}
              onChange={(e) =>
                setEditingLesson({ ...editingLesson, title: e.target.value })
              }
              placeholder="Titre de la leçon"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                Bunny Video ID
              </label>
              <input
                type="text"
                value={editingLesson.bunny_video_id ?? ""}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    bunny_video_id: e.target.value,
                  })
                }
                placeholder="ex: a1b2c3d4-e5f6-..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1.5 block">
                Bunny Library ID
              </label>
              <input
                type="text"
                value={editingLesson.bunny_library_id ?? ""}
                onChange={(e) =>
                  setEditingLesson({
                    ...editingLesson,
                    bunny_library_id: e.target.value,
                  })
                }
                placeholder="Pré-rempli depuis .env si configuré"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              Durée (secondes)
            </label>
            <input
              type="number"
              value={editingLesson.duration_seconds ?? ""}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  duration_seconds: e.target.value
                    ? parseInt(e.target.value)
                    : null,
                })
              }
              placeholder="ex: 420 (= 7 minutes)"
              className={inputCls + " max-w-xs"}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">
              Description
            </label>
            <textarea
              value={editingLesson.description ?? ""}
              onChange={(e) =>
                setEditingLesson({
                  ...editingLesson,
                  description: e.target.value,
                })
              }
              placeholder="Texte affiché sous la vidéo..."
              className={inputCls + " resize-none"}
              rows={4}
            />
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-600">
                Ressources
              </label>
              <button
                type="button"
                onClick={addResource}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </button>
            </div>

            {editingLesson.resources.length === 0 ? (
              <p className="text-xs text-slate-400">
                Aucune ressource. Cliquez sur &quot;Ajouter&quot; pour en créer.
              </p>
            ) : (
              <div className="space-y-2">
                {editingLesson.resources.map((resource, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl"
                  >
                    <select
                      value={resource.type}
                      onChange={(e) =>
                        updateResource(i, "type", e.target.value)
                      }
                      className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                      <option value="link">Lien</option>
                    </select>
                    <input
                      type="text"
                      value={resource.label}
                      onChange={(e) =>
                        updateResource(i, "label", e.target.value)
                      }
                      placeholder="Label"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <input
                      type="url"
                      value={resource.url}
                      onChange={(e) =>
                        updateResource(i, "url", e.target.value)
                      }
                      placeholder="URL"
                      className="flex-[2] px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeResource(i)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={saveLesson}
            disabled={actionLoading === "save" || !editingLesson.title.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {actionLoading === "save" ? "..." : "Enregistrer"}
          </button>
          <button
            onClick={() => {
              setEditingLesson(null);
              setIsNew(false);
            }}
            className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <button
        onClick={openNewForm}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nouvelle leçon
      </button>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">Aucune leçon dans ce module.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">
                  #
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Leçon
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-20">
                  Durée
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-24">
                  Vidéo
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-24">
                  Statut
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lessons.map((lesson, idx) => (
                <tr
                  key={lesson.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => reorder(lesson.id, "up")}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorder(lesson.id, "down")}
                        disabled={idx === lessons.length - 1}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => openEditForm(lesson)}
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors text-left"
                    >
                      {lesson.title}
                    </button>
                    {lesson.resources?.length > 0 && (
                      <span className="ml-2 text-xs text-slate-400">
                        {lesson.resources.length} ressource
                        {lesson.resources.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-500">
                    {formatDuration(lesson.duration_seconds)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {lesson.bunny_video_id ? (
                        <>
                          <span className="text-xs text-emerald-600 font-medium">OK</span>
                          {lesson.transcript ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">CC</span>
                          ) : (
                            <button
                              onClick={() => generateCaptions(lesson.id)}
                              disabled={captionLoading === lesson.id}
                              className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors font-medium"
                              title="Générer sous-titres & chapitres"
                            >
                              {captionLoading === lesson.id ? "..." : "CC"}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                    {captionLoading === lesson.id && (
                      <p className="text-[10px] text-blue-500 mt-1 animate-pulse">{captionStatus}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => togglePublished(lesson)}
                      disabled={actionLoading === lesson.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        lesson.is_published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {lesson.is_published ? (
                        <>
                          <Eye className="w-3 h-3" /> Publié
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Brouillon
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditForm(lesson)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => deleteLesson(lesson.id)}
                        disabled={actionLoading === lesson.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
