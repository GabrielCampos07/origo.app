"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Alert } from "@/components/auth/Alert";
import { ProShell } from "@/components/professional/ProShell";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useProfessionalAuth } from "@/lib/use-professional-auth";
import {
  createMyExercise,
  createProfessionalProgram,
  getProfessionalStudent,
  listMyExercises,
  searchExerciseCatalog,
  updateProfessionalProgram,
  type CatalogExerciseItem,
  type ProfessionalExerciseItem,
  type ProgramExercise,
} from "@/lib/professional";
import { roleLabels } from "@/lib/role-labels";

type DraftExercise = ProgramExercise & { clientKey: string };
type LibraryTab = "catalog" | "mine";

function nextKey() {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyDraft(orderIndex: number): DraftExercise {
  return {
    clientKey: nextKey(),
    id: "",
    orderIndex,
    name: "",
    sets: "3",
    reps: "10",
    notes: "",
    precautions: "",
    catalogItemId: "",
    professionalExerciseId: "",
    videoUrl: "",
    thumbnailUrl: "",
    photoUrls: [],
    cuesPt: "",
    source: "custom",
    hasLogs: false,
  };
}

function collectTags(items: Array<{ categoryTags: string[] }>): string[] {
  const set = new Set<string>();
  for (const item of items) {
    for (const tag of item.categoryTags) {
      if (tag.trim()) set.add(tag.trim());
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function groupByTag<T extends { categoryTags: string[]; namePt: string }>(
  items: T[],
  activeTag: string
): Array<{ tag: string; items: T[] }> {
  const filtered = activeTag
    ? items.filter((item) => item.categoryTags.includes(activeTag))
    : items;
  const map = new Map<string, T[]>();
  for (const item of filtered) {
    const tags = item.categoryTags.length > 0 ? item.categoryTags : ["Sem categoria"];
    for (const tag of tags) {
      if (activeTag && tag !== activeTag) continue;
      const list = map.get(tag) ?? [];
      list.push(item);
      map.set(tag, list);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "pt-BR"))
    .map(([tag, groupItems]) => ({
      tag,
      items: [...groupItems].sort((a, b) => a.namePt.localeCompare(b.namePt, "pt-BR")),
    }));
}

function sourceBadge(exercise: DraftExercise) {
  if (exercise.source === "catalog" || exercise.catalogItemId) {
    return { label: "catálogo", className: "bg-teal-50 text-teal-800" };
  }
  if (exercise.source === "professional" || exercise.professionalExerciseId) {
    return { label: "meus", className: "bg-indigo-50 text-indigo-800" };
  }
  return { label: "texto livre", className: "bg-slate-100 text-slate-700" };
}

export default function HepEditorPage() {
  const params = useParams();
  const studentId = typeof params.id === "string" ? params.id : "";
  const { loading: authLoading } = useProfessionalAuth();

  const [programId, setProgramId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [studentCategory, setStudentCategory] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [phaseLabel, setPhaseLabel] = useState("");
  const [targetSessionsPerWeek, setTargetSessionsPerWeek] = useState("3");
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [libraryTab, setLibraryTab] = useState<LibraryTab>("catalog");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryTag, setLibraryTag] = useState("");
  const [catalogItems, setCatalogItems] = useState<CatalogExerciseItem[]>([]);
  const [myItems, setMyItems] = useState<ProfessionalExerciseItem[]>([]);
  const [librarySearching, setLibrarySearching] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newPhotoUrls, setNewPhotoUrls] = useState("");
  const [newCues, setNewCues] = useState("");
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [addToHepAfterCreate, setAddToHepAfterCreate] = useState(true);

  useEffect(() => {
    if (authLoading || !studentId) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      const result = await getProfessionalStudent(studentId);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      setStudentName(result.data.name);
      setStudentCategory(result.data.category || null);
      const program = result.data.program;
      if (!program) {
        setProgramId(null);
        setTitle("Programa HEP");
        setPhaseLabel("");
        setTargetSessionsPerWeek("3");
        setExercises([]);
        setError(null);
        setLoading(false);
        return;
      }
      setProgramId(program.id);
      setTitle(program.title);
      setPhaseLabel(program.phaseLabel);
      setTargetSessionsPerWeek(String(program.targetSessionsPerWeek || 3));
      setExercises(
        program.exercises.map((exercise) => ({
          ...exercise,
          clientKey: exercise.id || nextKey(),
        }))
      );
      setError(null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, studentId]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLibrarySearching(true);
      if (libraryTab === "catalog") {
        const result = await searchExerciseCatalog({
          q: libraryQuery.trim() || undefined,
          tag: libraryTag || undefined,
        });
        if (cancelled) return;
        setLibrarySearching(false);
        if (!result.ok) {
          setLibraryError(result.message);
          setCatalogItems([]);
          return;
        }
        setLibraryError(null);
        setCatalogItems(result.data);
      } else {
        const result = await listMyExercises({
          q: libraryQuery.trim() || undefined,
          tag: libraryTag || undefined,
        });
        if (cancelled) return;
        setLibrarySearching(false);
        if (!result.ok) {
          setLibraryError(result.message);
          setMyItems([]);
          return;
        }
        setLibraryError(null);
        setMyItems(result.data);
      }
    }, libraryQuery.trim() ? 250 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [libraryQuery, libraryTag, libraryTab]);

  const canSave = useMemo(() => title.trim().length > 0, [title]);

  const availableTags = useMemo(
    () => collectTags(libraryTab === "catalog" ? catalogItems : myItems),
    [libraryTab, catalogItems, myItems]
  );

  const catalogGroups = useMemo(
    () => groupByTag(catalogItems, libraryTag),
    [catalogItems, libraryTag]
  );
  const myGroups = useMemo(() => groupByTag(myItems, libraryTag), [myItems, libraryTag]);

  function updateExercise(clientKey: string, patch: Partial<DraftExercise>) {
    setExercises((current) =>
      current.map((exercise) => (exercise.clientKey === clientKey ? { ...exercise, ...patch } : exercise))
    );
  }

  function addExercise() {
    setExercises((current) => [...current, emptyDraft(current.length)]);
  }

  function addFromCatalog(item: CatalogExerciseItem) {
    setExercises((current) => [
      ...current,
      {
        ...emptyDraft(current.length),
        name: item.namePt,
        catalogItemId: item.id,
        professionalExerciseId: "",
        videoUrl: item.videoUrl,
        thumbnailUrl: item.thumbnailUrl ?? "",
        photoUrls: [],
        cuesPt: item.cuesPt ?? "",
        notes: "",
        source: "catalog",
        sets: "3",
        reps: "10",
      },
    ]);
    setSuccess(`Adicionado do catálogo: ${item.namePt}`);
  }

  function addFromMine(item: ProfessionalExerciseItem) {
    setExercises((current) => [
      ...current,
      {
        ...emptyDraft(current.length),
        name: item.namePt,
        catalogItemId: "",
        professionalExerciseId: item.id,
        videoUrl: item.videoUrl ?? "",
        thumbnailUrl: item.photoUrls[0] ?? "",
        photoUrls: item.photoUrls,
        cuesPt: item.cuesPt ?? "",
        notes: "",
        source: "professional",
        sets: "3",
        reps: "10",
      },
    ]);
    setSuccess(`Adicionado dos seus exercícios: ${item.namePt}`);
  }

  function removeExercise(exercise: DraftExercise) {
    setSuccess(null);
    if (exercise.hasLogs) {
      setError(
        "Este exercício já tem sessão registrada e não pode ser removido. Ajuste o texto ou as séries, mas mantenha o item."
      );
      return;
    }
    setError(null);
    setExercises((current) => current.filter((item) => item.clientKey !== exercise.clientKey));
  }

  async function onCreateMine() {
    setError(null);
    setSuccess(null);
    if (!newName.trim()) {
      setError("Informe o nome do novo exercício.");
      return;
    }
    const tags = newTags
      .split(/[,;]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    const photoUrls = newPhotoUrls
      .split(/\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    setCreatingExercise(true);
    const result = await createMyExercise({
      namePt: newName.trim(),
      categoryTags: tags,
      videoUrl: newVideoUrl.trim() || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      cuesPt: newCues.trim() || undefined,
    });
    setCreatingExercise(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setMyItems((current) =>
      [...current, result.data].sort((a, b) => a.namePt.localeCompare(b.namePt, "pt-BR"))
    );
    if (addToHepAfterCreate) {
      addFromMine(result.data);
    } else {
      setSuccess(`Exercício criado: ${result.data.namePt}`);
    }
    setShowNewForm(false);
    setNewName("");
    setNewTags("");
    setNewVideoUrl("");
    setNewPhotoUrls("");
    setNewCues("");
    setLibraryTab("mine");
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const target = Number(targetSessionsPerWeek);
    if (!title.trim()) {
      setError("Informe o título do programa.");
      return;
    }
    if (!Number.isInteger(target) || target < 1 || target > 14) {
      setError("A meta semanal deve ser um número inteiro entre 1 e 14.");
      return;
    }
    if (
      exercises.some(
        (exercise) =>
          !exercise.name.trim() && !exercise.catalogItemId && !exercise.professionalExerciseId
      )
    ) {
      setError("Todo exercício precisa de um nome (ou item de biblioteca).");
      return;
    }

    const parsedExercises: Array<{
      id?: string;
      orderIndex: number;
      name: string;
      sets: number;
      reps: string;
      notes: string;
      precautions: string;
      catalogItemId?: string;
      professionalExerciseId?: string;
    }> = [];

    for (const [index, exercise] of exercises.entries()) {
      const sets = Number(exercise.sets);
      if (!Number.isInteger(sets) || sets < 1 || sets > 50) {
        setError(`Séries do exercício ${index + 1} deve ser um número inteiro entre 1 e 50.`);
        return;
      }
      if (!exercise.reps.trim()) {
        setError(`Informe as repetições do exercício ${index + 1}.`);
        return;
      }
      parsedExercises.push({
        id: exercise.id || undefined,
        orderIndex: index,
        name: exercise.name.trim(),
        sets,
        reps: exercise.reps.trim(),
        notes: exercise.notes.trim(),
        precautions: exercise.precautions.trim(),
        ...(exercise.catalogItemId ? { catalogItemId: exercise.catalogItemId } : {}),
        ...(exercise.professionalExerciseId
          ? { professionalExerciseId: exercise.professionalExerciseId }
          : {}),
      });
    }

    const payload = {
      title: title.trim(),
      phaseLabel: phaseLabel.trim(),
      targetSessionsPerWeek: target,
      exercises: parsedExercises,
    };

    const existingProgramId = programId;
    setSaving(true);
    const result = existingProgramId
      ? await updateProfessionalProgram(existingProgramId, payload)
      : await createProfessionalProgram(studentId, payload);
    setSaving(false);

    if (!result.ok) {
      setError(result.message);
      if (existingProgramId && /sessão registrada/i.test(result.message)) {
        const reload = await getProfessionalStudent(studentId);
        if (reload.ok && reload.data.program) {
          setExercises(
            reload.data.program.exercises.map((exercise) => ({
              ...exercise,
              clientKey: exercise.id || nextKey(),
            }))
          );
        }
      }
      return;
    }

    setProgramId(result.data.id);
    setTitle(result.data.title);
    setPhaseLabel(result.data.phaseLabel);
    setTargetSessionsPerWeek(String(result.data.targetSessionsPerWeek));
    setExercises(
      result.data.exercises.map((exercise) => ({
        ...exercise,
        clientKey: exercise.id || nextKey(),
      }))
    );
    setSuccess(
      existingProgramId
        ? `Programa salvo. O ${roleLabels(studentCategory).studentSingular} verá as mudanças no próximo acesso.`
        : `Programa criado. O ${roleLabels(studentCategory).studentSingular} já pode executar as sessões.`
    );
  }

  return (
    <ProShell
      title="Editar HEP"
      subtitle={
        studentName
          ? programId
            ? `Programa de ${studentName}`
            : `Criar o primeiro programa de ${studentName}`
          : "Título, fase, meta semanal e exercícios (catálogo, biblioteca ou texto livre)."
      }
      backHref={studentId ? `/alunos/${studentId}` : "/alunos"}
      backLabel="Voltar à ficha"
      category={studentCategory}
    >
      {loading ? <PageSkeleton variant="detail" /> : null}

      {!loading ? (
        <form onSubmit={onSubmit} className="space-y-6">
          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
              Título
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Fase
              <input
                value={phaseLabel}
                onChange={(event) => setPhaseLabel(event.target.value)}
                disabled={saving}
                placeholder="Ex.: Fortalecimento"
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Sessões por semana
              <input
                type="number"
                min={1}
                max={14}
                value={targetSessionsPerWeek}
                onChange={(event) => setTargetSessionsPerWeek(event.target.value)}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
          </div>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Exercícios</h2>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewForm((open) => !open)}
                  disabled={saving}
                  className="text-sm font-medium text-indigo-700 hover:text-indigo-900 disabled:text-slate-400"
                >
                  {showNewForm ? "Fechar formulário" : "+ Novo exercício"}
                </button>
                <button
                  type="button"
                  onClick={addExercise}
                  disabled={saving}
                  className="text-sm font-medium text-teal-700 hover:text-teal-900 disabled:text-slate-400"
                >
                  + Texto livre
                </button>
              </div>
            </div>

            {showNewForm ? (
              <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Novo exercício</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                    Nome
                    <input
                      value={newName}
                      onChange={(event) => setNewName(event.target.value)}
                      disabled={creatingExercise}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                    Tags (separadas por vírgula)
                    <input
                      value={newTags}
                      onChange={(event) => setNewTags(event.target.value)}
                      disabled={creatingExercise}
                      placeholder="Ex.: glúteo, joelho"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                    URL do vídeo
                    <input
                      value={newVideoUrl}
                      onChange={(event) => setNewVideoUrl(event.target.value)}
                      disabled={creatingExercise}
                      placeholder="https://"
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                    URLs das fotos (uma por linha ou vírgula)
                    <textarea
                      value={newPhotoUrls}
                      onChange={(event) => setNewPhotoUrls(event.target.value)}
                      disabled={creatingExercise}
                      rows={2}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                    Dicas / cues
                    <textarea
                      value={newCues}
                      onChange={(event) => setNewCues(event.target.value)}
                      disabled={creatingExercise}
                      rows={2}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                    />
                  </label>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={addToHepAfterCreate}
                    onChange={(event) => setAddToHepAfterCreate(event.target.checked)}
                    disabled={creatingExercise}
                  />
                  Adicionar ao programa após criar
                </label>
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={creatingExercise}
                    onClick={onCreateMine}
                    className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    {creatingExercise ? "Criando…" : "Salvar exercício"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex gap-1 rounded-lg bg-slate-200/70 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLibraryTab("catalog");
                    setLibraryTag("");
                  }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                    libraryTab === "catalog"
                      ? "bg-white text-teal-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Catálogo Origo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLibraryTab("mine");
                    setLibraryTag("");
                  }}
                  className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${
                    libraryTab === "mine"
                      ? "bg-white text-indigo-800 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Meus exercícios
                </button>
              </div>

              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Buscar
                <input
                  value={libraryQuery}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                  disabled={saving}
                  placeholder={
                    libraryTab === "catalog"
                      ? "Ex.: ponte, agachamento, prancha…"
                      : "Buscar nos seus exercícios…"
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </label>

              {availableTags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLibraryTag("")}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      !libraryTag
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 ring-1 ring-slate-200"
                    }`}
                  >
                    Todas
                  </button>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setLibraryTag(tag === libraryTag ? "" : tag)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        libraryTag === tag
                          ? "bg-teal-700 text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : null}

              {librarySearching ? <p className="mt-2 text-xs text-slate-500">Buscando…</p> : null}
              {libraryError ? <p className="mt-2 text-xs text-rose-700">{libraryError}</p> : null}

              <div className="mt-3 max-h-64 space-y-3 overflow-y-auto">
                {(libraryTab === "catalog" ? catalogGroups : myGroups).map((group) => (
                  <div key={group.tag}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {group.tag}
                    </p>
                    <ul className="space-y-1">
                      {group.items.map((item) => (
                        <li key={`${group.tag}-${item.id}`}>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              libraryTab === "catalog"
                                ? addFromCatalog(item as CatalogExerciseItem)
                                : addFromMine(item as ProfessionalExerciseItem)
                            }
                            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-800 hover:bg-white disabled:opacity-50"
                          >
                            <span>
                              <span className="font-medium">{item.namePt}</span>
                              {item.categoryTags.length ? (
                                <span className="ml-2 text-xs text-slate-500">
                                  {item.categoryTags.join(", ")}
                                </span>
                              ) : null}
                            </span>
                            <span className="shrink-0 text-xs font-medium text-teal-700">
                              Adicionar
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!librarySearching &&
                !libraryError &&
                (libraryTab === "catalog" ? catalogItems : myItems).length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {libraryTab === "mine"
                      ? "Você ainda não tem exercícios. Use “Novo exercício”."
                      : "Nenhum item encontrado."}
                  </p>
                ) : null}
              </div>
            </div>

            <p className="mb-4 text-xs text-slate-500">
              Exercícios com sessão já registrada não podem ser apagados — a API recusa o hard-delete
              para preservar o histórico.
            </p>

            {exercises.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                Nenhum exercício. Use o catálogo, seus exercícios ou adicione em texto livre.
              </p>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => {
                  const badge = sourceBadge(exercise);
                  return (
                    <fieldset
                      key={exercise.clientKey}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <legend className="px-1 text-sm font-medium text-slate-700">
                        Exercício {index + 1}
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-normal ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        {exercise.hasLogs ? (
                          <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-normal text-amber-800">
                            com histórico
                          </span>
                        ) : null}
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                          Nome
                          <input
                            value={exercise.name}
                            onChange={(event) =>
                              updateExercise(exercise.clientKey, { name: event.target.value })
                            }
                            disabled={saving}
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          Séries
                          <input
                            value={exercise.sets}
                            onChange={(event) =>
                              updateExercise(exercise.clientKey, { sets: event.target.value })
                            }
                            disabled={saving}
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          Repetições
                          <input
                            value={exercise.reps}
                            onChange={(event) =>
                              updateExercise(exercise.clientKey, { reps: event.target.value })
                            }
                            disabled={saving}
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                          Notas
                          <textarea
                            value={exercise.notes}
                            onChange={(event) =>
                              updateExercise(exercise.clientKey, { notes: event.target.value })
                            }
                            disabled={saving}
                            rows={2}
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
                          Precauções
                          <textarea
                            value={exercise.precautions}
                            onChange={(event) =>
                              updateExercise(exercise.clientKey, {
                                precautions: event.target.value,
                              })
                            }
                            disabled={saving}
                            rows={2}
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          />
                        </label>
                      </div>
                      <div className="mt-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeExercise(exercise)}
                          disabled={saving}
                          className="text-sm text-rose-700 hover:text-rose-900 disabled:text-slate-400"
                        >
                          Remover
                        </button>
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            )}
          </section>

          <button
            type="submit"
            disabled={saving || !canSave}
            className="rounded-lg bg-teal-700 px-5 py-2.5 font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Salvando…" : programId ? "Salvar programa" : "Criar programa"}
          </button>
        </form>
      ) : null}
    </ProShell>
  );
}
