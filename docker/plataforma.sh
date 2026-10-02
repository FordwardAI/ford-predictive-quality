#!/bin/sh
# Arranca la plataforma dentro del contenedor: con los CSV de Ford si están montados en /datos, si no, la demo.
CSV="/datos/Dataset QLS Inspección Adicional.csv"
CATALOGO="/datos/Códigos de catálogo.csv"
if [ -f "$CSV" ] && [ -f "$CATALOGO" ]; then
  exec python -m plataforma.servidor --csv "$CSV" --catalogo "$CATALOGO" --host 0.0.0.0 --puerto 8765
fi
exec python -m plataforma.servidor --host 0.0.0.0 --puerto 8765
