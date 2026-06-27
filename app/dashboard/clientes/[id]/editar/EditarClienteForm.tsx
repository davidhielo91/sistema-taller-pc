"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateCliente } from "@/lib/actions/clientes";

interface Props {
  id: string;
  defaultValues: {
    nombre: string;
    telefono: string | null;
    email: string | null;
    documento: string | null;
    notas: string | null;
  };
}

interface ActionState {
  errors?: Record<string, string[]>;
  success?: boolean;
}

export function EditarClienteForm({ id, defaultValues }: Props) {
  const router = useRouter();

  const [state, action, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateCliente(id, formData);
      if (result.success) {
        router.push(`/dashboard/clientes/${id}`);
        router.refresh();
      }
      return result;
    },
    undefined
  );

  const actionState = state as ActionState | undefined;

  return (
    <form action={action} className="form-card">
      <div className="form-group">
        <label htmlFor="nombre">Nombre *</label>
        <input
          id="nombre"
          name="nombre"
          required
          defaultValue={defaultValues.nombre}
        />
        {actionState?.errors?.nombre && (
          <p className="field-error">{actionState.errors.nombre[0]}</p>
        )}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={defaultValues.telefono ?? ""}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={defaultValues.email ?? ""}
          />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="documento">Documento</label>
        <input
          id="documento"
          name="documento"
          defaultValue={defaultValues.documento ?? ""}
        />
      </div>
      <div className="form-group">
        <label htmlFor="notas">Notas</label>
        <textarea
          id="notas"
          name="notas"
          rows={3}
          defaultValue={defaultValues.notas ?? ""}
        />
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
        >
          Cancelar
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
