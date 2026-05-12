"use client";
import { useState, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { Modal } from "./modal";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const VARIANT_MAP = {
  danger:  { icon: "text-red-400",    btn: "bg-red-600 hover:bg-red-700 text-white" },
  warning: { icon: "text-yellow-400", btn: "bg-yellow-600 hover:bg-yellow-700 text-white" },
  info:    { icon: "text-blue-400",   btn: "bg-blue-600 hover:bg-blue-700 text-white" },
};

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const styles = VARIANT_MAP[variant];

  return (
    <Modal open={open} onClose={onCancel} maxWidth="sm">
      <div className="p-6 text-center">
        <AlertTriangle className={`w-10 h-10 mx-auto mb-4 ${styles.icon}`} />
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:text-white min-w-[90px]"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`min-w-[90px] ${styles.btn}`}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useConfirm() {
  const [state, setState] = useState<
    (ConfirmOptions & { resolve: (v: boolean) => void }) | null
  >(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const ConfirmDialogComponent = state ? (
    <ConfirmDialog
      open={!!state}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      variant={state.variant}
      loading={loading}
    />
  ) : null;

  return { confirm, ConfirmDialogComponent, setConfirmLoading: setLoading };
}
