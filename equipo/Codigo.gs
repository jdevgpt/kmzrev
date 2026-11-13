/**
 * KMZrev · Sitio común del equipo (Google Apps Script)
 *
 * 1. Cambia la CLAVE de abajo por una contraseña que solo conozca tu equipo.
 * 2. Implementar → Nueva implementación → Aplicación web
 *      Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier usuario
 * 3. Copia la URL de la aplicación web y pégala en KMZrev (Trabajos → Equipo).
 *
 * Los datos se guardan en esta misma hoja de cálculo, en las pestañas
 * Trabajos, Estado, Estilos, Equipo y Archivos (esta última es interna, no la toques).
 */
const CLAVE = 'CAMBIA-ESTA-CLAVE';

const TAM_PARTE = 45000; // caracteres por celda (el límite de Google es 50.000)
const COLS = {
  Trabajos: ['Id', 'Nombre', 'Archivo', 'Puntos', 'Subido por', 'Subido', 'Partes'],
  Estado:   ['Trabajo', 'Id punto', 'Punto', 'Realizado', 'Fecha', 'Realizado por', 'Reservado por', 'Nº defectos', 'Códigos', 'Observaciones', 'Actualizado', 'Actualizado por', 'Datos (no tocar)'],
  Estilos:  ['Trabajo', 'Clave', 'Nombre', 'Actualizado', 'Actualizado por', 'Datos (no tocar)'],
  Equipo:   ['Nombre', 'Trabajo', 'Latitud', 'Longitud', 'Precisión (m)', 'Actualizado'],
  Archivos: ['Trabajo', 'Parte', 'Datos (no tocar)']
};

function doGet() {
  return salida({ ok: true, app: 'kmzrev', version: 1, mensaje: 'Sitio común de KMZrev funcionando' });
}

function doPost(e) {
  let q;
  try { q = JSON.parse(e.postData.contents); } catch (err) { return salida({ ok: false, error: 'Petición no válida' }); }
  if (CLAVE === 'CAMBIA-ESTA-CLAVE') return salida({ ok: false, error: 'Falta poner la CLAVE en el script' });
  if (String(q.clave || '') !== CLAVE) return salida({ ok: false, error: 'Clave de equipo incorrecta' });
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    switch (q.accion) {
      case 'probar':    return salida({ ok: true, ahora: Date.now() });
      case 'trabajos':  return salida({ ok: true, trabajos: listarTrabajos() });
      case 'subir':     return salida(subir(q));
      case 'descargar': return salida(descargar(q));
      case 'sync':      return salida(sincronizar(q));
      case 'renombrar': return salida(renombrar(q));
      case 'quitar':    return salida(quitar(q));
      default:          return salida({ ok: false, error: 'Acción desconocida' });
    }
  } catch (err) {
    return salida({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

/* ---------- utilidades ---------- */
function salida(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function hoja(nombre) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, COLS[nombre].length).setValues([COLS[nombre]]);
    h.setFrozenRows(1);
  }
  return h;
}
function filas(nombre) {
  const h = hoja(nombre), n = h.getLastRow();
  if (n < 2) return [];
  return h.getRange(2, 1, n - 1, COLS[nombre].length).getValues();
}
function anadir(nombre, nuevas) {
  if (!nuevas.length) return;
  const h = hoja(nombre);
  h.getRange(h.getLastRow() + 1, 1, nuevas.length, COLS[nombre].length).setValues(nuevas);
}
function fechaTexto(ms) { return Utilities.formatDate(new Date(ms), 'Europe/Madrid', 'dd/MM/yyyy HH:mm'); }
function parsear(t) { try { return JSON.parse(t); } catch (e) { return null; } }

/* ---------- trabajos ---------- */
function listarTrabajos() {
  return filas('Trabajos').filter(f => f[0]).map(f => ({ id: String(f[0]), nombre: f[1], archivo: f[2], puntos: f[3], por: f[4], subido: String(f[5]) }));
}

function subir(q) {
  const base = q.base;
  if (!base || !Array.isArray(base.puntos)) return { ok: false, error: 'No hay datos que subir' };
  const id = 't' + Date.now().toString(36);
  const texto = JSON.stringify(base);
  const partes = [];
  for (let i = 0; i < texto.length; i += TAM_PARTE) partes.push([id, partes.length, texto.substr(i, TAM_PARTE)]);
  anadir('Archivos', partes);
  anadir('Trabajos', [[id, q.nombre || base.archivo || 'Trabajo', base.archivo || '', base.puntos.length, q.por || '', fechaTexto(Date.now()), partes.length]]);
  return { ok: true, id: id, ahora: Date.now() };
}

function descargar(q) {
  const t = listarTrabajos().filter(x => x.id === q.trabajo)[0];
  if (!t) return { ok: false, error: 'Ese trabajo ya no existe en el equipo' };
  const partes = filas('Archivos').filter(f => String(f[0]) === q.trabajo).sort((a, b) => a[1] - b[1]).map(f => f[2]).join('');
  const base = parsear(partes);
  if (!base) return { ok: false, error: 'Los datos del trabajo están dañados' };
  const r = sincronizar({ trabajo: q.trabajo, desde: 0, cambios: [], estilos: [], nombre: q.nombre });
  r.trabajo = t; r.base = base;
  return r;
}

function renombrar(q) {
  const h = hoja('Trabajos'), fs = filas('Trabajos');
  for (let i = 0; i < fs.length; i++) if (String(fs[i][0]) === q.trabajo) { h.getRange(i + 2, 2).setValue(q.nombre); return { ok: true }; }
  return { ok: false, error: 'No encontrado' };
}

function quitar(q) {
  // Borra el trabajo y todos sus datos de la hoja
  ['Trabajos', 'Archivos', 'Estado', 'Estilos'].forEach(n => {
    const h = hoja(n), fs = filas(n), col = 0;
    for (let i = fs.length - 1; i >= 0; i--) if (String(fs[i][col]) === q.trabajo) h.deleteRow(i + 2);
  });
  return { ok: true };
}

/* ---------- sincronización ---------- */
function sincronizar(q) {
  const ahora = Date.now(), tid = String(q.trabajo || ''), quien = q.nombre || '';
  if (!tid) return { ok: false, error: 'Falta el trabajo' };

  // 1) Guardar los cambios de los puntos
  const hE = hoja('Estado'), fE = filas('Estado'), idxE = {};
  fE.forEach((f, i) => { if (String(f[0]) === tid) idxE[String(f[1])] = i; });
  const nuevasE = [];
  (q.cambios || []).forEach(c => {
    const p = c.p || {}, e = p.e || {}, defs = e.def || [];
    const fila = [tid, c.id, p.nombre || '', e.hecho ? 'Sí' : '', e.fecha || '', e.por || '', e.reserva ? e.reserva.por : '',
      defs.length || '', defs.map(d => d.c).join(', '), e.nota || '', fechaTexto(ahora), quien, ahora + '|' + JSON.stringify(p)];
    if (idxE[c.id] != null) { hE.getRange(idxE[c.id] + 2, 1, 1, fila.length).setValues([fila]); fE[idxE[c.id]] = fila; }
    else { idxE[c.id] = fE.length + nuevasE.length; nuevasE.push(fila); }
  });
  anadir('Estado', nuevasE);
  const todasE = fE.concat(nuevasE);

  // 2) Guardar los cambios de los tipos (estilos)
  const hS = hoja('Estilos'), fS = filas('Estilos'), idxS = {};
  fS.forEach((f, i) => { if (String(f[0]) === tid) idxS[String(f[1])] = i; });
  const nuevasS = [];
  (q.estilos || []).forEach(c => {
    const fila = [tid, c.k, (c.e && c.e.nombre) || (c.e && c.e.borrado ? '(eliminado)' : ''), fechaTexto(ahora), quien, ahora + '|' + JSON.stringify(c.e || {})];
    if (idxS[c.k] != null) { hS.getRange(idxS[c.k] + 2, 1, 1, fila.length).setValues([fila]); fS[idxS[c.k]] = fila; }
    else { idxS[c.k] = fS.length + nuevasS.length; nuevasS.push(fila); }
  });
  anadir('Estilos', nuevasS);
  const todasS = fS.concat(nuevasS);

  // 3) Posición de quien sincroniza
  if (quien) {
    const hQ = hoja('Equipo'), fQ = filas('Equipo');
    let i = fQ.findIndex(f => String(f[0]) === quien);
    const yo = q.yo;
    const fila = [quien, tid, yo ? yo.lat : '', yo ? yo.lng : '', yo ? Math.round(yo.acc || 0) : '', ahora];
    if (i >= 0) hQ.getRange(i + 2, 1, 1, fila.length).setValues([fila]); else anadir('Equipo', [fila]);
  }

  // 4) Devolver lo que ha cambiado desde la última vez
  const desde = Number(q.desde) || 0;
  const separa = t => { const s = String(t), k = s.indexOf('|'); return k < 0 ? [s, 0] : [s.substr(k + 1), Number(s.substr(0, k))]; };
  const puntos = [];
  todasE.forEach(f => {
    if (String(f[0]) !== tid) return;
    const [js, t] = separa(f[12]);
    if (t > desde) { const p = parsear(js); if (p) puntos.push({ id: String(f[1]), p: p, t: t }); }
  });
  const estilos = [];
  todasS.forEach(f => {
    if (String(f[0]) !== tid) return;
    const [js, t] = separa(f[5]);
    if (t > desde) { const e = parsear(js); if (e) estilos.push({ k: String(f[1]), e: e, t: t }); }
  });
  const equipo = filas('Equipo').filter(f => String(f[0]) !== quien && String(f[1]) === tid && Number(f[5]) > ahora - 3 * 3600 * 1000)
    .map(f => ({ nombre: f[0], lat: f[2] === '' ? null : Number(f[2]), lng: f[3] === '' ? null : Number(f[3]), acc: f[4], t: Number(f[5]) }));
  return { ok: true, ahora: ahora, puntos: puntos, estilos: estilos, equipo: equipo };
}
