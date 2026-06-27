"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { registrarPago } from "@/lib/actions/pagos";

export function PagoForm({
  ordenId,
  moneda,
}: {
  ordenId: string;
  moneda: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await registrarPago(formData);
      if (result?.success) {
        router.refresh();
        return undefined;
      }
      return result;
    },
    undefined
  );

  return (
    <form action={action}>
      <input type="hidden" name="ordenId" value={ordenId} />
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="monto">Monto ({moneda}) *</label>
          <input
            id="monto"
            name="monto"
            type="number"
            step="0.01"
            min="0.01"
            required
          />
          {state?.errors?.monto && (
            <p className="field-error">{state.errors.monto[0]}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="metodo">Método (opcional)</label>
          <input
            id="metodo"
            name="metodo"
            type="text"
            placeholder="Efectivo, transferencia, tarjeta..."
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="nota">Nota (opcional)</label>
        <input id="nota" name="nota" type="text" />
      </div>
      {state?.message && <p className="form-error">{state.message}</p>}
      <div className="form-actions">
        <button type="submit" disabled={pending} className="btn-primary btn-sm">
          {pending ? "Registrando..." : "Registrar abono"}
        </button>
      </div>
    </form>
  );
}
