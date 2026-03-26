type AsyncActionButtonProps = {
  onClick: () => void;
  idleLabel: string;
  loadingLabel?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  idleTitle?: string;
  disabledTitle?: string;
  loadingTitle?: string;
};

export function AsyncActionButton({
  onClick,
  idleLabel,
  loadingLabel = "Loading...",
  isLoading = false,
  isDisabled = false,
  className = "",
  idleTitle,
  disabledTitle,
  loadingTitle,
}: AsyncActionButtonProps) {
  const blocked = isLoading || isDisabled;
  const title = isLoading
    ? (loadingTitle ?? loadingLabel)
    : isDisabled
      ? (disabledTitle ?? idleTitle ?? idleLabel)
      : (idleTitle ?? idleLabel);

  return (
    <button
      type="button"
      className={`px-3 py-1.5 border rounded transition-colors inline-flex items-center justify-center gap-2 text-center align-middle ${className} ${blocked ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => { if (!blocked) onClick(); }}
      disabled={blocked}
      title={title}
    >
      {isLoading ? (
        <>
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <span>{idleLabel}</span>
      )}
    </button>
  );
}
