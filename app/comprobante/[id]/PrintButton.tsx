"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        padding: "8px 16px", background: "#2563eb", color: "white",
        border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
      }}
    >
      Imprimir / Guardar PDF
    </button>
  );
}
