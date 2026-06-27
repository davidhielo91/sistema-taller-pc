"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createOrden } from "@/lib/actions/ordenes";
import { createCliente } from "@/lib/actions/clientes";

export default function NuevaOrdenPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientes, setClientes] = useState<
    { id: string; nombre: string; telefono: string | null }[]
  >([]);
  const [selectedCliente, setSelectedCliente] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [searching, setSearching] = useState(false);

  const searchClientes = useCallback(async (q: string) => {
    if (!q.trim()) {
      setClientes([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/clientes/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setClientes(data);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    searchClientes(val);
  };

  const selectClient = (c: { id: string; nombre: string }) => {
    setSelectedCliente(c);
    setShowSearch(false);
    setShowNewClient(false);
  };

  const handleNewClient = async (formData: FormData) => {
    const result = await createCliente(formData);
    if (result.success && result.cliente) {
      selectClient(result.cliente);
    }
    return result;
  };

  return (
    <>
      <header className="content-header">
        <h1>Nueva orden de recepción</h1>
      </header>
      <div className="content-body">
        {/* Client Selection */}
        <div className="form-card form-card-section">
          <h2>Cliente</h2>

          {selectedCliente ? (
            <div className="selected-client">
              <span>
                <strong>{selectedCliente.nombre}</strong>
              </span>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setSelectedCliente(null);
                  setShowSearch(true);
                }}
              >
                Cambiar cliente
              </button>
            </div>
          ) : showNewClient ? (
            <div className="new-client-form">
              <p className="text-muted">Datos del nuevo cliente:</p>
              <form id="new-client-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cli_nombre">Nombre *</label>
                    <input id="cli_nombre" name="nombre" required />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cli_telefono">Teléfono</label>
                    <input id="cli_telefono" name="telefono" type="tel" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cli_email">Email</label>
                    <input id="cli_email" name="email" type="email" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cli_documento">Documento</label>
                    <input id="cli_documento" name="documento" />
                  </div>
                </div>
              </form>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={async () => {
                  const form = document.getElementById(
                    "new-client-form"
                  ) as HTMLFormElement;
                  if (!form) return;
                  const fd = new FormData(form);
                  await handleNewClient(fd);
                }}
              >
                Usar este cliente
              </button>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  setShowNewClient(false);
                  setShowSearch(true);
                }}
              >
                Buscar cliente existente
              </button>
            </div>
          ) : showSearch ? (
            <div className="client-search">
              <div className="form-group">
                <label htmlFor="search">Buscar cliente</label>
                <input
                  id="search"
                  type="search"
                  placeholder="Escriba nombre o teléfono..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              {searching && <p className="text-muted">Buscando...</p>}
              {clientes.length > 0 && (
                <ul className="client-list">
                  {clientes.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="client-list-item"
                        onClick={() => selectClient(c)}
                      >
                        <strong>{c.nombre}</strong>
                        {c.telefono && (
                          <span className="text-muted">{c.telefono}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {searchQuery && !searching && clientes.length === 0 && (
                <p className="text-muted">
                  No se encontraron clientes.{" "}
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      setShowNewClient(true);
                      setShowSearch(false);
                    }}
                  >
                    Crear nuevo cliente
                  </button>
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Order Form */}
        {selectedCliente && (
          <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); await createOrden(fd); }} className="form-card">
            <input type="hidden" name="clienteId" value={selectedCliente.id} />
            <h2>Datos del equipo</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tipoEquipo">Tipo de equipo *</label>
                <select id="tipoEquipo" name="tipoEquipo" required>
                  <option value="">Seleccione...</option>
                  <option value="Laptop">Laptop</option>
                  <option value="PC de escritorio">PC de escritorio</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Impresora">Impresora</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="marca">Marca</label>
                <input id="marca" name="marca" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="modelo">Modelo</label>
                <input id="modelo" name="modelo" />
              </div>
              <div className="form-group">
                <label htmlFor="serie">Número de serie</label>
                <input id="serie" name="serie" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="accesorios">Accesorios</label>
              <textarea
                id="accesorios"
                name="accesorios"
                rows={2}
                placeholder="Cargador, mochila, mouse, etc."
              />
            </div>

            <h2>Recepción</h2>

            <div className="form-group">
              <label htmlFor="fallaReportada">Falla reportada *</label>
              <textarea
                id="fallaReportada"
                name="fallaReportada"
                rows={3}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="estadoFisico">Estado físico</label>
              <textarea
                id="estadoFisico"
                name="estadoFisico"
                rows={2}
                placeholder="Golpes, rayones, piezas dañadas, etc."
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fechaPrometida">Fecha prometida</label>
                <input
                  id="fechaPrometida"
                  name="fechaPrometida"
                  type="date"
                />
              </div>
              <div className="form-group">
                <label htmlFor="contrasenaEquipo">Contraseña del equipo</label>
                <input
                  id="contrasenaEquipo"
                  name="contrasenaEquipo"
                  type="password"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="notasRecepcion">Notas de recepción</label>
              <textarea
                id="notasRecepcion"
                name="notasRecepcion"
                rows={2}
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
              <button type="submit" className="btn-primary">
                Registrar ingreso
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
