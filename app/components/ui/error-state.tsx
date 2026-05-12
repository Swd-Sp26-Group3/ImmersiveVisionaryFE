import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Retry",
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <AlertCircle className="w-8 h-8 text-red-400" />
      <p className="text-red-400 text-sm text-center max-w-sm">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
