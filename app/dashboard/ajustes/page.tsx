"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAjustes } from "@/lib/actions/ajustes";

export default function AjustesPage() {
  const router = useRouter();
  const [initial, setInitial] = useState<{
    nombreTaller: string;
    moneda: string;
    telefono: string | null;
    direccion: string | null;
    logoUrl: string | null;
    codigoPaisWhatsapp: string | null;
    mensajeWhatsappListo: string | null;
  } | null>(null);

  useEffect(() => {
    fetch("/api/ajustes")
      .then((r) => r.json())
      .then(setInitial);
  }, []);

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateAjustes(formData);
      if (result.success) {
        router.refresh();
        return undefined;
      }
      return result;
    },
    undefined
  );

  return (
    <>
      <header className="content-header">
        <h1>Ajustes del taller</h1>
      </header>
      <div className="content-body">
        <form action={action} className="form-card">
          <div className="form-group">
            <label htmlFor="nombreTaller">Nombre del taller *</label>
            <input
              id="nombreTaller"
              name="nombreTaller"
              defaultValue={initial?.nombreTaller ?? ""}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="moneda">Moneda (ISO 4217)</label>
              <input
                id="moneda"
                name="moneda"
                defaultValue={initial?.moneda ?? "MXN"}
                placeholder="MXN, ARS, COP, USD..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                name="telefono"
                defaultValue={initial?.telefono ?? ""}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <textarea
              id="direccion"
              name="direccion"
              rows={2}
              defaultValue={initial?.direccion ?? ""}
            />
          </div>
          <div className="form-group">
            <label htmlFor="logoUrl">URL del logo</label>
            <input
              id="logoUrl"
              name="logoUrl"
              defaultValue={initial?.logoUrl ?? ""}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigoPaisWhatsapp">Código de país WhatsApp</label>
              <input
                id="codigoPaisWhatsapp"
                name="codigoPaisWhatsapp"
                defaultValue={initial?.codigoPaisWhatsapp ?? ""}
                placeholder="52 (México), 54 (Argentina)…"
              />
              <span className="form-hint">
                Se antepone al teléfono del cliente si no empieza con +
              </span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="mensajeWhatsappListo">Mensaje WhatsApp (plantilla)</label>
            <textarea
              id="mensajeWhatsappListo"
              name="mensajeWhatsappListo"
              rows={3}
              defaultValue={initial?.mensajeWhatsappListo ?? ""}
              placeholder="Hola {cliente}, su {tipoEquipo} (folio #{folio}) está listo para recoger."
            />
            <span className="form-hint">
              Variables disponibles: {"{cliente}"}, {"{tipoEquipo}"}, {"{folio}"}
            </span>
          </div>

          {state?.message && <p className="form-error">{state.message}</p>}

          <div className="form-actions">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
