import { Camera, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { mediaApi } from "@/features/chat/mediaApi";
import { validateChatImage } from "@/features/chat/imageUpload";
import { Avatar } from "./Avatar";

export function AvatarUpload({
  name,
  value,
  onChange,
  disabled,
}: {
  name: string;
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>();
  const [uploading, setUploading] = useState(false);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function selected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const error = validateChatImage(file);
    if (error) {
      toast.error(error);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const uploaded = await mediaApi.uploadImage(file);
      onChange(uploaded.fileUrl);
      toast.success("Image uploaded. Save to apply it.");
    } catch (uploadError) {
      setPreview(undefined);
      toast.error(
        getErrorMessage(uploadError, "The image could not be uploaded."),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="relative">
        <Avatar name={name} src={preview ?? value} size="xl" />
        {uploading && (
          <span className="absolute inset-0 grid place-items-center rounded-2xl bg-slate-950/55 text-white">
            <LoaderCircle className="animate-spin" size={20} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <strong className="block text-sm text-slate-900">Profile image</strong>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          JPEG, PNG, WebP, or GIF. Maximum 10 MB.
        </p>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => input.current?.click()}
          className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          <Camera size={14} />
          Choose image
        </button>
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={selected}
      />
    </div>
  );
}
