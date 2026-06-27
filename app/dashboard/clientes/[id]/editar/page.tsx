import { notFound } from "next/navigation";
import { getCliente } from "@/lib/actions/clientes";
import { EditarClienteForm } from "./EditarClienteForm";

export default async function EditarClientePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  return (
    <>
      <header className="content-header">
        <h1>Editar cliente</h1>
      </header>
      <div className="content-body">
        <EditarClienteForm
          id={id}
          defaultValues={{
            nombre: cliente.nombre,
            telefono: cliente.telefono ?? null,
            email: cliente.email ?? null,
            documento: cliente.documento ?? null,
            notas: cliente.notas ?? null,
          }}
        />
      </div>
    </>
  );
}
