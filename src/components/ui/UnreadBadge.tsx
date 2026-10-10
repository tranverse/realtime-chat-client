/** Fixed geometry shared by notification cards and conversation previews. */
export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={`${count} unread messages`}
      title={`${count} unread messages`}
      className="inline-flex size-7 min-h-7 min-w-7 shrink-0 grow-0 self-center items-center justify-center rounded-full bg-indigo-600 p-0 text-[10px] font-semibold leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
