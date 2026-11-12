# KMZrev

Mapa de centros de transformación a partir de un archivo **KMZ / KML**, para ir marcándolos como **realizados** desde el móvil.

**App:** https://jdevgpt.github.io/kmzrev/

## Instalar en el móvil
Abre https://jdevgpt.github.io/kmzrev/ en **Chrome** (Android) → menú ⋮ → **Instalar aplicación** (también aparece en el Menú de la app). En iPhone: Safari → Compartir → **Añadir a pantalla de inicio**.
Una vez instalada se abre como una app y **funciona sin cobertura**.

## Mapas sin cobertura
Botón de **capas** del mapa: Callejero, **Ortofoto PNOA (IGN)**, **Mapa IGN**, Satélite y parcelas del **Catastro** (solo con conexión).
Con Ortofoto PNOA o Mapa IGN elegido, en "Mapas sin cobertura" puedes descargar **alrededor de tus puntos** o **lo que ves en pantalla**, con tres niveles de detalle. Hazlo con wifi.

## Uso
1. Abre la app y pulsa **Cargar KMZ / KML**.
2. Toca un centro en el mapa (o búscalo en **Lista**) y pulsa **Pendiente → Realizado**. Se pone la fecha de hoy (editable) y puedes añadir observaciones.
3. Cada punto se ve con **el icono y el color que trae el KMZ** y su nombre al lado. Los realizados llevan un ✔ verde. Filtra por Todos / Pendientes / Realizados.
   - Botón **Aa**: muestra u oculta los nombres (se ven al acercar el mapa).
   - Botón **Tipos**: lista los distintos iconos del KMZ con su avance y permite ocultar tipos.
   - Los puntos sin icono propio salen como círculo naranja (pendiente) o verde (realizado).
4. **Reubicar un punto** desde su ficha: **Aquí (mi GPS)** lo coloca donde estás, o **Mover en el mapa** para dejarlo bajo la cruz roja. Siempre se puede volver a la posición original.
5. **Crear puntos nuevos** con el botón **+**: coloca la cruz en el mapa (o pulsa GPS para ir a tu posición), pon nombre, elige el tipo de icono y la carpeta. Los puntos creados se pueden editar o eliminar desde su ficha, se mantienen al volver a cargar el KMZ y salen en las exportaciones. También puedes empezar sin KMZ.
6. **Cómo llegar** abre la ruta en Google Maps. El botón de ubicación muestra dónde estás y ordena la lista por cercanía.

El estado se guarda en el propio dispositivo. Desde el **Menú**:
- **Exportar KMZ**: con los iconos originales, las posiciones corregidas y los realizados marcados con ✔, para Google Earth. Si vuelves a abrir ese KMZ en la app (en otro móvil, por ejemplo), recupera qué centros estaban hechos.
- **Exportar Excel (CSV)**: listado con estado, fecha y observaciones.
- **Copia de seguridad / Restaurar**: archivo `.json` con todo.

Volver a cargar el KMZ (por ejemplo, uno actualizado) conserva el estado de los centros que coincidan.

### Cargar un KMZ fijo
Si subes al repositorio un archivo llamado `centros.kmz` (o `centros.kml`), la app lo carga automáticamente la primera vez que se abre en cada dispositivo.

---
JDev
