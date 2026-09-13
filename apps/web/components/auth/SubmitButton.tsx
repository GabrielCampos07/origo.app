type Props = {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

export function SubmitButton({ loading, disabled, children }: Props) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:bg-teal-700/60"
    >
      {loading ? (
        <>
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
          Aguarde…
        </>
      ) : (
        children
      )}
    </button>
  );
}
