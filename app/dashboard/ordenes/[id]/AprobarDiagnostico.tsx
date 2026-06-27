"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aprobarDiagnostico } from "@/lib/actions/diagnosticos";

export function AprobarDiagnostico({
  diagnosticoId,
}: {
  diagnosticoId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleAprobar = async (aprobado: boolean) => {
    setError(null);
    setPending(true);
    try {
      const result = await aprobarDiagnostico(diagnosticoId, aprobado);
      if ("message" in result && result.message) {
        setError(result.message);
      } else {
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="aprobar-actions">
      <button
        type="button"
        className="btn-primary btn-sm"
        disabled={pending}
        onClick={() => handleAprobar(true)}
      >
        {pending ? "..." : "Aprobar"}
      </button>
      <button
        type="button"
        className="btn-secondary btn-sm"
        disabled={pending}
        onClick={() => handleAprobar(false)}
      >
        {pending ? "..." : "Rechazar"}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
