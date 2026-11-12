# KMZrev

Mapa de centros de transformación a partir de un archivo **KMZ / KML**, para ir marcándolos como **realizados** desde el móvil.

**App:** https://jdevgpt.github.io/kmzrev/

## Uso
1. Abre la app y pulsa **Cargar KMZ / KML**.
2. Toca un centro en el mapa (o búscalo en **Lista**) y pulsa **Pendiente → Realizado**. Se pone la fecha de hoy (editable) y puedes añadir observaciones.
3. Naranja = pendiente · Verde = realizado. Filtra por Todos / Pendientes / Realizados.
4. **Cómo llegar** abre la ruta en Google Maps. El botón de ubicación muestra dónde estás y ordena la lista por cercanía.

El estado se guarda en el propio dispositivo. Desde el **Menú**:
- **Exportar KMZ**: realizados en verde y pendientes en naranja, para Google Earth. Si vuelves a abrir ese KMZ en la app (en otro móvil, por ejemplo), recupera qué centros estaban hechos.
- **Exportar Excel (CSV)**: listado con estado, fecha y observaciones.
- **Copia de seguridad / Restaurar**: archivo `.json` con todo.

Volver a cargar el KMZ (por ejemplo, uno actualizado) conserva el estado de los centros que coincidan.

### Cargar un KMZ fijo
Si subes al repositorio un archivo llamado `centros.kmz` (o `centros.kml`), la app lo carga automáticamente la primera vez que se abre en cada dispositivo.

---
JDev
