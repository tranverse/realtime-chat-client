import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Image, Paperclip, RefreshCw, Send, Smile, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/lib/errors";
import type { ChatMessage, CreateMessagePayload } from "@/types/api";
import { limitChatImages, validateChatImage } from "./imageUpload";
import { mediaApi } from "./mediaApi";
import { useChatPreferences } from "../settings/preferences";

interface MessageComposerProps {
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (payload: CreateMessagePayload) => Promise<void>;
  onTyping: (typing: boolean) => void;
  disabled?: boolean;
}

export function MessageComposer({
  replyingTo,
  onCancelReply,
  onSend,
  onTyping,
  disabled,
}: MessageComposerProps) {
  const { preferences } = useChatPreferences();
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [failedImages, setFailedImages] = useState<File[]>([]);
  const typingTimer = useRef<number | undefined>(undefined);
  const imageInput = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      window.clearTimeout(typingTimer.current);
      onTyping(false);
    },
    [onTyping],
  );

  function changed(value: string) {
    setContent(value);
    onTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => onTyping(false), 1_500);
  }

  async function sendImages(files: File[]) {
    if (files.length === 0 || uploading) return;
    setUploading(true);
    setFailedImages([]);
    try {
      const results = await Promise.allSettled(files.map(mediaApi.uploadImage));
      const uploaded = results.flatMap((result) =>
        result.status === "fulfilled" ? [result.value] : [],
      );
      const rejectedFiles = files.filter(
        (_, index) => results[index].status === "rejected",
      );
      if (uploaded.length === 0)
        throw new Error("None of the selected images could be uploaded.");
      await onSend({
        content: content.trim(),
        type: "IMAGE",
        replyToMessageId: replyingTo?.id ?? null,
        attachments: uploaded.map(({ fileUrl, fileType, fileSize }) => ({
          fileUrl,
          fileType,
          fileSize,
        })),
      });
      setContent("");
      onCancelReply();
      onTyping(false);
      setFailedImages(rejectedFiles);
      if (rejectedFiles.length > 0)
        toast.warning(
          `${rejectedFiles.length} image${rejectedFiles.length === 1 ? "" : "s"} could not be uploaded. The others were sent.`,
        );
    } catch (error) {
      setFailedImages(files);
      toast.error(
        getErrorMessage(error, "Some images could not be sent. You can retry."),
      );
    } finally {
      setUploading(false);
    }
  }

  function chooseImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const selection = limitChatImages(files);
    const error = selection.files.map(validateChatImage).find(Boolean);
    if (error) {
      toast.error(error);
      return;
    }
    if (selection.omitted > 0)
      toast.warning(
        `Only 10 images can be sent at once. ${selection.omitted} image${selection.omitted === 1 ? " was" : "s were"} not selected.`,
      );
    void sendImages(selection.files);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!content.trim() || uploading) return;
    try {
      await onSend({
        content: content.trim(),
        type: "TEXT",
        replyToMessageId: replyingTo?.id ?? null,
        attachments: [],
      });
      setContent("");
      onCancelReply();
      onTyping(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      preferences.enterToSend &&
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229
    ) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-3 pb-3 sm:px-5 sm:pb-4">
      {replyingTo && (
        <div className="mx-auto flex max-w-5xl items-center gap-3 border-b border-slate-100 px-2 py-2 text-sm">
          <RefreshCw className="text-indigo-500" size={16} />
          <span className="min-w-0 flex-1">
            <strong className="block text-xs text-slate-700">
              Replying to {replyingTo.sender.name}
            </strong>
            <small className="block truncate text-slate-400">
              {replyingTo.content || "Image message"}
            </small>
          </span>
          <Button size="icon" variant="ghost" onClick={onCancelReply}>
            Cancel reply
            <X size={16} />
          </Button>
        </div>
      )}
      {failedImages.length > 0 && (
        <div className="mx-auto mt-2 flex max-w-5xl items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-red-700">
          <Image size={18} />
          <span className="min-w-0 flex-1 text-xs">
            <strong className="block">Images were not sent</strong>
            <small>Your selection is ready to retry.</small>
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={uploading}
            onClick={() => void sendImages(failedImages)}
            leftIcon={<RefreshCw size={14} />}
          >
            Retry
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setFailedImages([])}
          >
            Dismiss
            <X size={16} />
          </Button>
        </div>
      )}
      <form
        className="mx-auto mt-2 flex max-w-5xl items-end gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
        onSubmit={submit}
      >
        <input
          ref={imageInput}
          className="sr-only"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={chooseImages}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled || uploading}
          onClick={() => imageInput.current?.click()}
        >
          Send images
          <Image size={18} />
        </Button>
        <Button
          className="hidden sm:inline-flex"
          type="button"
          size="icon"
          variant="ghost"
          disabled
          title="File attachments are coming soon"
        >
          Attach a file
          <Paperclip size={18} />
        </Button>
        <textarea
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-slate-900 outline-none placeholder:text-slate-400"
          rows={1}
          maxLength={5000}
          aria-label="Message"
          placeholder={uploading ? "Uploading images…" : "Type a message"}
          value={content}
          disabled={disabled || uploading}
          onChange={(event) => changed(event.target.value)}
          onKeyDown={keyDown}
        />
        <Button
          className="hidden sm:inline-flex"
          type="button"
          size="icon"
          variant="ghost"
          disabled={uploading}
          onClick={() => setContent((value) => `${value} ✨`)}
        >
          Add emoji
          <Smile size={18} />
        </Button>
        <Button
          className="rounded-xl"
          type="submit"
          size="icon"
          loading={uploading}
          disabled={disabled || uploading || !content.trim()}
        >
          Send
          <Send size={18} />
        </Button>
      </form>
      {uploading && (
        <p className="mx-auto mt-1 max-w-5xl px-2 text-xs text-slate-400">
          Uploading and sending images securely…
        </p>
      )}
    </div>
  );
}
