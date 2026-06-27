import Link from "next/link";
import { getClientes } from "@/lib/actions/clientes";
import { formatDateShort, getMoneda } from "@/lib/format";

export default async function ClientesPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const searchParams = await props.searchParams;
  const [clientes, moneda] = await Promise.all([
    getClientes(searchParams.q),
    getMoneda(),
  ]);

  return (
    <>
      <header className="content-header">
        <h1>Clientes</h1>
        <Link href="/dashboard/clientes/nuevo" className="btn-primary btn-sm">
          Nuevo cliente
        </Link>
      </header>
      <div className="content-body">
        <form className="search-bar" method="GET">
          <input
            name="q"
            type="search"
            placeholder="Buscar por nombre, teléfono o email..."
            defaultValue={searchParams.q ?? ""}
          />
          <button type="submit" className="btn-primary btn-sm">
            Buscar
          </button>
        </form>

        {clientes.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron clientes.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Órdenes</th>
                  <th>Registrado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nombre}</td>
                    <td>{c.telefono ?? "-"}</td>
                    <td>{c.email ?? "-"}</td>
                    <td>{c._count.ordenes}</td>
                    <td>{formatDateShort(c.createdAt, moneda)}</td>
                    <td>
                      <Link
                        href={`/dashboard/clientes/${c.id}`}
                        className="btn-link"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
