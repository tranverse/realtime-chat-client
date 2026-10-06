import {
  Children,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "../../lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  leftIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const childNodes = Children.toArray(children);
  const icon =
    size === "icon"
      ? childNodes.findLast((child) => isValidElement(child))
      : null;
  const accessibleLabel =
    size === "icon"
      ? childNodes.filter((child) => typeof child === "string").join(" ")
      : null;
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-indigo-600 text-white hover:bg-indigo-700",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" &&
          "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-sm",
        size === "icon" && "size-9 p-0",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="animate-spin" size={17} /> : leftIcon}
      {size !== "icon" && children}
      {size === "icon" && (
        <>
          <span className="sr-only">{accessibleLabel}</span>
          {!loading && icon}
        </>
      )}
    </button>
  );
}
