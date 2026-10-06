import {
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  Reply,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/ui/Button";
import type { ChatMessage } from "../../types/api";
import { ImageMessage } from "./ImageMessage";

interface Props {
  message: ChatMessage;
  mine: boolean;
  canDelete: boolean;
  receipt: string | null;
  onReply: () => void;
  onEdit: (content: string) => void;
  onDelete: () => void;
  showAuthor?: boolean;
}

export function MessageBubble({
  message,
  mine,
  canDelete,
  receipt,
  onReply,
  onEdit,
  onDelete,
  showAuthor = true,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content ?? "");
  const deleted = message.content === null && message.attachments.length === 0;

  return (
    <article
      className={
        mine
          ? "group relative ml-auto flex w-fit max-w-[85%] flex-col items-end py-0.5 sm:max-w-[68%]"
          : "group relative mr-auto flex w-fit max-w-[85%] flex-col items-start py-0.5 sm:max-w-[68%]"
      }
      data-sequence={message.sequence}
    >
      {!mine && showAuthor && (
        <span className="mb-1 px-2 text-[11px] font-medium text-slate-500">
          {message.sender.name}
        </span>
      )}
      <div
        className={`${mine ? "rounded-2xl rounded-br-md bg-indigo-600 text-white" : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800"} ${deleted ? "italic opacity-70" : ""} min-w-[72px] max-w-full px-3.5 py-2 shadow-sm`}
      >
        {message.replyTo && (
          <div
            className={
              mine
                ? "mb-2 border-l-2 border-white/50 pl-2 text-xs text-indigo-100"
                : "mb-2 border-l-2 border-indigo-300 pl-2 text-xs text-slate-500"
            }
          >
            <strong className="block truncate">
              {message.replyTo.sender.name}
            </strong>
            <span className="block truncate">
              {message.replyTo.content ?? "Deleted message"}
            </span>
          </div>
        )}
        {editing ? (
          <form
            className="message-edit"
            onSubmit={(event) => {
              event.preventDefault();
              if (draft.trim()) {
                onEdit(draft.trim());
                setEditing(false);
              }
            }}
          >
            <input
              autoFocus
              maxLength={5000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="button"
              onClick={() => {
                setDraft(message.content ?? "");
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button type="submit">Save</button>
          </form>
        ) : (
          <>
            {deleted ? (
              <p>Message deleted</p>
            ) : (
              message.content && <p>{message.content}</p>
            )}
            <ImageMessage attachments={message.attachments} />
            {message.attachments.some(
              (attachment) => !attachment.fileType.startsWith("image/"),
            ) && (
              <div className="message-attachments">
                {message.attachments
                  .filter(
                    (attachment) => !attachment.fileType.startsWith("image/"),
                  )
                  .map((attachment) => (
                    <a
                      key={attachment.id ?? attachment.fileUrl}
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="file-attachment"
                    >
                      <FileText size={20} />
                      <span>
                        <strong>
                          {attachment.fileUrl.split("/").at(-1) || "Attachment"}
                        </strong>
                        <small>
                          {attachment.fileType}
                          {attachment.fileSize
                            ? ` · ${formatSize(attachment.fileSize)}`
                            : ""}
                        </small>
                      </span>
                      <Download size={16} />
                    </a>
                  ))}
              </div>
            )}
          </>
        )}
        <time
          className={
            mine
              ? "mt-1 block text-right text-[10px] text-indigo-200"
              : "mt-1 block text-right text-[10px] text-slate-400"
          }
        >
          {new Intl.DateTimeFormat("en", {
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(message.createdAt))}
          {message.editedAt && " · edited"}
        </time>
      </div>
      {receipt && (
        <span className="mt-1 px-1 text-[10px] font-medium text-slate-400">
          {receipt}
        </span>
      )}
      {!deleted && (
        <div
          className={
            mine
              ? "absolute right-full top-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              : "absolute left-full top-1 flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
          }
        >
          <Button size="icon" variant="ghost" onClick={onReply}>
            Reply
            <Reply size={14} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setMenuOpen((value) => !value)}
          >
            More actions
            <MoreHorizontal size={15} />
          </Button>
          {menuOpen && (
            <div className="absolute top-9 z-20 min-w-32 rounded-xl border border-slate-200 bg-white p-1 text-xs text-slate-700 shadow-xl">
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"
                onClick={() => {
                  onReply();
                  setMenuOpen(false);
                }}
              >
                <Reply size={13} /> Reply
              </button>
              {mine && (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  <Pencil size={13} /> Edit
                </button>
              )}
              {canDelete && (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    onDelete();
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
