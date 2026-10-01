import { Toaster as Sonner, type ToasterProps } from "sonner"

// Avisos breves (acciones registradas). Plano y con la paleta: fondo blanco, texto Ford Blue, borde Skyview.
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    style={
      {
        "--normal-bg": "#FFFFFF",
        "--normal-text": "#00095B",
        "--normal-border": "#066FEF",
        "--border-radius": "16px",
      } as React.CSSProperties
    }
    toastOptions={{ style: { boxShadow: "none", fontSize: "16px" } }}
    {...props}
  />
)

export { Toaster }
