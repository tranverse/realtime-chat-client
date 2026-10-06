import { useState } from "react";
import { cn } from "../../lib/cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-violet-400 to-purple-600",
  "from-teal-400 to-cyan-600",
  "from-blue-400 to-blue-600",
  "from-amber-400 to-orange-500",
];

const sizeClasses = {
  xs: "size-7 rounded-md text-[10px]",
  sm: "size-9 rounded-lg text-xs",
  md: "size-11 rounded-xl text-sm",
  lg: "size-14 rounded-xl text-base",
  xl: "size-[72px] rounded-2xl text-xl",
};

const statusSizeClasses = {
  xs: "size-2",
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
  xl: "size-4",
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  size = "md",
  online,
  className,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const gradient =
    gradients[
      Math.abs([...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)) %
        gradients.length
    ];

return (
  <div
    className={cn(
      "relative flex-none shrink-0 grow-0 aspect-square",
      sizeClasses[size],
      className,
    )}
    title={name}
  >
    <div
      className={cn(
        "flex size-full items-center justify-center overflow-hidden",
        "rounded-[inherit]",
        "bg-gradient-to-br",
        "font-semibold text-white",
        "ring-1 ring-black/5",
        gradient,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="block size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center">
          {initials(name)}
        </span>
      )}
    </div>

    {online !== undefined && (
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5",
          "rounded-full border-2 border-white",
          "dark:border-slate-900",
          statusSizeClasses[size],
          online ? "bg-emerald-500" : "bg-slate-400",
        )}
        aria-label={online ? "Online" : "Offline"}
      />
    )}
  </div>
);
}
