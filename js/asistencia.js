/**
 * Lógica de negocio para el procesamiento de marcas de asistencia
 * y clasificación de turnos y horarios.
 */

function obtenerHora(fechaHora) {
    return fechaHora.split(" ")[1].substring(0, 5);
}

function obtenerFecha(fechaHora) {
    const fecha = fechaHora.split(" ")[0];
    const partes = fecha.split("/");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function horaMinutos(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

// ========================================
// TURNOS Y HORARIOS DEFINIDOS
// ========================================
const TURNOS = {
    MATUTINO: {
        inicio: 6 * 60,   // 06:00
        fin: 14 * 60      // 14:00
    },
    VESPERTINO: {
        inicio: 14 * 60,  // 14:00
        fin: 22 * 60      // 22:00
    },
    NOCTURNO: {
        inicio: 22 * 60,  // 22:00
        fin: 6 * 60       // 06:00 (del día siguiente)
    }
};

// ========================================
// AJUSTAR FECHA PARA EL TURNO NOCTURNO
// ========================================
function ajustarFechaNocturno(fechaStr, hm, turno) {
    if (turno !== "NOCTURNO") {
        return fechaStr;
    }

    // Si marca entre 00:00 y 06:59 (419 minutos), pertenece al día anterior laboral
    if (hm <= 419) {
        const partes = fechaStr.split("/");
        const fecha = new Date(partes[2], partes[1] - 1, partes[0]);
        fecha.setDate(fecha.getDate() - 1);

        const dia = String(fecha.getDate()).padStart(2, "0");
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const anio = fecha.getFullYear();

        return `${dia}/${mes}/${anio}`;
    }

    return fechaStr;
}

// ========================================
// VALIDACIONES DE ENTRADAS Y SALIDAS
// ========================================
function esEntrada(hm, turno) {
    const t = TURNOS[turno];
    if (turno === "NOCTURNO") {
        return (hm >= t.inicio || hm <= 360);
    }
    // ± 2 horas del inicio del turno
    return Math.abs(hm - t.inicio) <= 120;
}

function esSalida(hm, turno) {
    const t = TURNOS[turno];
    if (turno === "NOCTURNO") {
        return (hm <= t.fin || hm >= 1320);
    }
    // Desde 2 horas antes de finalizar en adelante
    return hm >= t.fin - 120;
}

// ========================================
// PROCESAR MARCAS
// ========================================
function procesarAsistencia(registros, mapaEmpleados) {
    const mapa = {};

    registros.forEach(r => {
        const usuarioLimpio = r.usuario ? r.usuario.trim().toUpperCase() : "";
        const info = mapaEmpleados[usuarioLimpio];
        
        let nombre = "Empleado No Registrado";
        let puesto = "Sin registrar";
        let turno = "MATUTINO";
        let lugar = "VERSALLES";
        let registrado = false;

        if (info) {
            nombre = info.nombre;
            puesto = info.puesto;
            turno = info.turno;
            lugar = info.lugar || "VERSALLES";
            registrado = true;
        }

        const hora = obtenerHora(r.fechaHora);
        const hm = horaMinutos(hora);
        let fecha = obtenerFecha(r.fechaHora);

        // Ajuste nocturno si es aplicable
        fecha = ajustarFechaNocturno(fecha, hm, turno);

        const llave = usuarioLimpio + "_" + fecha;

        if (!mapa[llave]) {
            mapa[llave] = {
                usuario: usuarioLimpio,
                nombre: nombre,
                puesto: puesto,
                turno: registrado ? turno : "DESCONOCIDO",
                lugar: registrado ? lugar : "DESCONOCIDO",
                fecha: fecha,
                entrada: "-",
                salida: "-",
                registrado: registrado
            };
        }

        if (registrado) {
            // Lógica con turno conocido
            if (esEntrada(hm, turno)) {
                if (mapa[llave].entrada === "-" || hm < horaMinutos(mapa[llave].entrada)) {
                    mapa[llave].entrada = hora;
                }
            }
            if (esSalida(hm, turno)) {
                if (mapa[llave].salida === "-" || hm > horaMinutos(mapa[llave].salida)) {
                    mapa[llave].salida = hora;
                }
            }
        } else {
            // Heurística para empleados no registrados (desconocidos)
            if (mapa[llave].entrada === "-") {
                // Si es la primera marca del día y es temprano, asumimos entrada
                if (hm < 840) { // Antes de las 14:00
                    mapa[llave].entrada = hora;
                } else {
                    mapa[llave].salida = hora;
                }
            } else {
                const entradaHm = horaMinutos(mapa[llave].entrada);
                if (hm > entradaHm) {
                    mapa[llave].salida = hora;
                } else {
                    // Intercambiar si la marca nueva es más temprana
                    mapa[llave].salida = mapa[llave].entrada;
                    mapa[llave].entrada = hora;
                }
            }
        }
    });

    return Object.values(mapa);
}
