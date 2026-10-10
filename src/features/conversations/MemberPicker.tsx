import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { userApi } from "@/features/profile/userApi";
import type { UserSummary } from "@/types/api";

export function MemberPicker({
  memberIds,
  pending,
  onAdd,
}: {
  memberIds: string[];
  pending: boolean;
  onAdd: (ids: string[], onSuccess: () => void) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const term = useDebouncedValue(search.trim());
  const users = useQuery({
    queryKey: ["users", "member-search", term],
    queryFn: ({ signal }) => userApi.search(term, 0, 20, signal),
    enabled: term.length > 1,
    staleTime: 30_000,
  });
  const selectedCandidates = selected.filter(
    (candidate) => !memberIds.includes(candidate.id),
  );
  return (
    <div className="space-y-3">
      <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
        <Search size={16} />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none"
          aria-label="Search people to add"
          placeholder="Search by name, username or email"
          value={search}
          disabled={pending}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div
        className="h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white"
        aria-label="People search results"
        aria-busy={users.isFetching}
      >
        {term.length < 2 ? (
          <p className="p-5 text-sm text-slate-500">
            Enter at least 2 characters to find people.
          </p>
        ) : term !== search.trim() || users.isFetching ? (
          <p className="p-5 text-sm text-slate-500" role="status">
            Searching people…
          </p>
        ) : users.isError ? (
          <div className="p-5 text-sm text-red-700" role="alert">
            People could not be loaded.
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void users.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : !users.data?.items.length ? (
          <p className="p-5 text-sm text-slate-500">
            No people found. Try a different name or username.
          </p>
        ) : (
          users.data.items.map((candidate) => {
            const member = memberIds.includes(candidate.id);
            const checked = selectedCandidates.some(
              (item) => item.id === candidate.id,
            );
            return (
              <button
                key={candidate.id}
                type="button"
                aria-label={`${candidate.name} @${candidate.username || candidate.email}${member ? " - Already a member" : ""}`}
                aria-pressed={checked}
                disabled={member || pending}
                onClick={() =>
                  setSelected((current) =>
                    checked
                      ? current.filter((item) => item.id !== candidate.id)
                      : [
                          ...current.filter((item) => item.id !== candidate.id),
                          candidate,
                        ],
                  )
                }
                className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left last:border-0 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 disabled:opacity-60"
              >
                <Avatar
                  name={candidate.name}
                  src={candidate.avatar}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">
                    {candidate.name}
                  </strong>
                  <small className="block truncate text-xs text-slate-500">
                    @{candidate.username || candidate.email}
                  </small>
                </span>
                {member ? (
                  <span className="text-xs text-slate-500">
                    Already a member
                  </span>
                ) : checked ? (
                  <Check size={17} className="text-indigo-600" />
                ) : (
                  <span className="text-xs text-indigo-600">Select</span>
                )}
              </button>
            );
          })
        )}
      </div>
      {selectedCandidates.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Selected people">
          {selectedCandidates.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              disabled={pending}
              onClick={() =>
                setSelected((current) =>
                  current.filter((item) => item.id !== candidate.id),
                )
              }
              className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700"
              aria-label={`Unselect ${candidate.name}`}
            >
              {candidate.name}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {selectedCandidates.length} selected
        </span>
        <Button
          size="sm"
          loading={pending}
          disabled={!selectedCandidates.length}
          onClick={() =>
            onAdd(
              selectedCandidates.map((item) => item.id),
              () => {
                setSelected([]);
                setSearch("");
              },
            )
          }
        >
          Add members
        </Button>
      </div>
    </div>
  );
}
