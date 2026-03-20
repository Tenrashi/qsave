import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

const variants = {
  pending: {
    icon: Loader2,
    className: "flex items-center justify-center gap-2 py-4",
    iconClassName: "w-4 h-4 animate-spin",
  },
  success: {
    icon: CheckCircle,
    className:
      "flex items-center justify-center gap-2 py-4 text-green-600 dark:text-green-400",
    iconClassName: "w-4 h-4",
  },
  error: {
    icon: AlertCircle,
    className: "flex items-center justify-center gap-2 py-4 text-destructive",
    iconClassName: "w-4 h-4",
  },
} as const;

export type StatusMessageProps = {
  variant: keyof typeof variants;
  message: string;
};

export const StatusMessage = ({ variant, message }: StatusMessageProps) => {
  const { icon: Icon, className, iconClassName } = variants[variant];

  return (
    <div className={className}>
      <Icon className={iconClassName} />
      <span className="text-sm">{message}</span>
    </div>
  );
};
