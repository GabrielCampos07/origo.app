import { formatExerciseDose, type ProgramExercise } from "@/lib/hep";

type Props = {
  exercise: ProgramExercise;
  index: number;
  interactive?: boolean;
  completed?: boolean;
  setsChecked?: number;
  completing?: boolean;
  onToggleSet?: (setIndex: number) => void;
  onComplete?: () => void;
};

export function ExerciseRow({
  exercise,
  index,
  interactive = false,
  completed = false,
  setsChecked = 0,
  completing = false,
  onToggleSet,
  onComplete,
}: Props) {
  const dose = formatExerciseDose(exercise);
  const setCount = exercise.sets && exercise.sets > 0 ? exercise.sets : 0;

  return (
    <article
      className={`rounded-lg border p-4 ${
        completed ? "border-teal-200 bg-teal-50/60" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            completed ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          {completed ? "✓" : index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{exercise.name}</h3>
          {dose ? <p className="mt-0.5 text-sm text-slate-600">{dose}</p> : null}
          {exercise.notes ? <p className="mt-2 text-sm text-slate-600">{exercise.notes}</p> : null}
          {exercise.precautions ? (
            <p className="mt-2 text-sm text-amber-800">
              <span className="font-medium">Cuidado:</span> {exercise.precautions}
            </p>
          ) : null}

          {interactive && setCount > 0 ? (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
                Séries
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: setCount }, (_, setIndex) => {
                  const checked = completed || setIndex < setsChecked;
                  return (
                    <button
                      key={setIndex}
                      type="button"
                      disabled={completed || completing}
                      onClick={() => onToggleSet?.(setIndex)}
                      className={`h-9 min-w-9 rounded-md border px-2.5 text-sm font-medium transition-colors ${
                        checked
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-teal-500"
                      } disabled:cursor-not-allowed`}
                      aria-pressed={checked}
                    >
                      {setIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {interactive && !completed ? (
            <button
              type="button"
              disabled={completing || !exercise.id}
              onClick={onComplete}
              className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
            >
              {completing ? "Registrando…" : "Marcar exercício"}
            </button>
          ) : null}

          {interactive && completed ? (
            <p className="mt-3 text-sm font-medium text-teal-800">Exercício concluído</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
