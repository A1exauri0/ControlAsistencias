// ==========================================================================
// CONTROLADOR DE APLICACIÓN - CONTROL DE ASISTENCIAS (ESCRITORIO)
// ==========================================================================

// Estado global de la aplicación
const EstadoApp = {
  empleados: {}, // Catálogo de empleados (id -> {nombre, puesto, turno})
  marcas: [], // Historial completo de marcas [{usuario, fechaHora}]
  resumenGlobal: [], // Lista calculada de asistencias
  pestanaActiva: "dashboard",
  tema: "light",
};

// Listado de IDs de empleados base
const empleadosBase = ["AGDC", "EILG", "ARR", "DN", "JBCJ", "AAGV"];

// Elementos del DOM expuestos en español
const ElementosDOM = {
  // Navegación
  elementosMenu: document.querySelectorAll(".sidebar-item"),
  contenedoresPestana: document.querySelectorAll(".tab-content"),
  cambiadorTema: document.getElementById("themeToggle"),
  iconoTema: document.querySelector("#themeToggle i"),
  botonToggleNavbar: document.getElementById("navbarToggle"),
  contenedorCollapseNavbar: document.getElementById("navbarCollapse"),

  // Métricas
  contadorMatutino: document.getElementById("matutinoCount"),
  contadorVespertino: document.getElementById("vespertinoCount"),
  contadorNocturno: document.getElementById("nocturnoCount"),
  totalEmpleados: document.getElementById("totalEmpleados"),

  // Filtros de Reportes
  entradaBusqueda: document.getElementById("searchInput"),
  filtroTurno: document.getElementById("turnoFilter"),
  filtroLugar: document.getElementById("lugarFilter"),
  filtroFecha: document.getElementById("fechaFilter"),
  botonExportar: document.getElementById("btnExportar"),
  tablaResumen: document.getElementById("tablaResumen"),

  // Catálogo Empleados
  entradaBusquedaEmp: document.getElementById("searchEmpInput"),
  tablaEmpleados: document.getElementById("tablaEmpleados"),
  botonNuevoEmpleado: document.getElementById("btnNuevoEmpleado"),

  // Modal Empleado
  modalEmpleado: document.getElementById("modalEmpleado"),
  modalTitulo: document.getElementById("modalTitle"),
  modalFormulario: document.getElementById("modalForm"),
  modalCerrar: document.getElementById("modalClose"),
  botonCancelarModal: document.getElementById("btnCancelarModal"),
  empleadoId: document.getElementById("empId"),
  empleadoNombre: document.getElementById("empNombre"),
  empleadoPuesto: document.getElementById("empPuesto"),
  empleadoTurno: document.getElementById("empTurno"),
  empleadoLugar: document.getElementById("empLugar"),

  // Cargador
  zonaSubida: document.getElementById("uploadZone"),
  entradaArchivo: document.getElementById("fileInput"),

  // Contenedor de Notificaciones
  contenedorNotificaciones: document.getElementById("toastContainer"),
};

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  inicializarTema();
  cargarDatos();
  configurarEscuchadores();
  inicializarDatePicker();
  inicializarDropdownPersonalizado();
});

// Cargar tema inicial
function inicializarTema() {
  const temaGuardado = localStorage.getItem("theme") || "light";
  EstadoApp.tema = temaGuardado;
  if (temaGuardado === "dark") {
    document.body.classList.add("dark");
    ElementosDOM.iconoTema.className = "bi bi-sun-fill";
  } else {
    document.body.classList.remove("dark");
    ElementosDOM.iconoTema.className = "bi bi-moon-fill";
  }
}

// Escuchadores de eventos globales
function configurarEscuchadores() {
  // Navegación de pestañas
  ElementosDOM.elementosMenu.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = item.getAttribute("data-tab");
      cambiarPestana(tabId);
      // Cerrar menú móvil al hacer clic en una opción
      if (ElementosDOM.contenedorCollapseNavbar) {
        ElementosDOM.contenedorCollapseNavbar.classList.remove("open");
      }
    });
  });

  // Menú hamburguesa móvil de la navbar
  if (ElementosDOM.botonToggleNavbar) {
    ElementosDOM.botonToggleNavbar.addEventListener("click", () => {
      ElementosDOM.contenedorCollapseNavbar.classList.toggle("open");
    });
  }

  // Cambiar de tema
  ElementosDOM.cambiadorTema.addEventListener("click", () => {
    if (EstadoApp.tema === "light") {
      EstadoApp.tema = "dark";
      document.body.classList.add("dark");
      ElementosDOM.iconoTema.className = "bi bi-sun-fill";
    } else {
      EstadoApp.tema = "light";
      document.body.classList.remove("dark");
      ElementosDOM.iconoTema.className = "bi bi-moon-fill";
    }
    localStorage.setItem("theme", EstadoApp.tema);
  });

  // Filtros de reportes
  ElementosDOM.entradaBusqueda.addEventListener(
    "input",
    renderizarTablaAsistencias,
  );
  ElementosDOM.filtroTurno.addEventListener(
    "change",
    renderizarTablaAsistencias,
  );
  ElementosDOM.filtroFecha.addEventListener(
    "change",
    renderizarTablaAsistencias,
  );
  ElementosDOM.filtroLugar.addEventListener(
    "change",
    renderizarTablaAsistencias,
  );
  ElementosDOM.botonExportar.addEventListener("click", exportarExcel);

  // Búsqueda de empleados
  ElementosDOM.entradaBusquedaEmp.addEventListener(
    "input",
    renderizarTablaEmpleados,
  );

  // Modal de Empleados
  ElementosDOM.botonNuevoEmpleado.addEventListener("click", () =>
    abrirModalEmpleado(),
  );
  ElementosDOM.modalCerrar.addEventListener("click", cerrarModalEmpleado);
  ElementosDOM.botonCancelarModal.addEventListener(
    "click",
    cerrarModalEmpleado,
  );
  ElementosDOM.modalFormulario.addEventListener(
    "submit",
    manejarEnvioFormulario,
  );

  // Cerrar modal al hacer clic fuera del contenedor
  ElementosDOM.modalEmpleado.addEventListener("click", (e) => {
    if (e.target === ElementosDOM.modalEmpleado) {
      cerrarModalEmpleado();
    }
  });

  // Cargador de archivos (TXT)
  ElementosDOM.zonaSubida.addEventListener("click", () =>
    ElementosDOM.entradaArchivo.click(),
  );
  ElementosDOM.entradaArchivo.addEventListener(
    "change",
    manejarSeleccionArchivo,
  );

  // Drag & Drop para subir archivos
  ElementosDOM.zonaSubida.addEventListener("dragover", (e) => {
    e.preventDefault();
    ElementosDOM.zonaSubida.style.borderColor = "var(--primary)";
    ElementosDOM.zonaSubida.style.backgroundColor = "rgba(79, 70, 229, 0.04)";
  });

  ElementosDOM.zonaSubida.addEventListener("dragleave", () => {
    ElementosDOM.zonaSubida.style.borderColor = "var(--border-color)";
    ElementosDOM.zonaSubida.style.backgroundColor = "var(--bg-secondary)";
  });

  ElementosDOM.zonaSubida.addEventListener("drop", (e) => {
    e.preventDefault();
    ElementosDOM.zonaSubida.style.borderColor = "var(--border-color)";
    ElementosDOM.zonaSubida.style.backgroundColor = "var(--bg-secondary)";

    const archivos = e.dataTransfer.files;
    if (archivos.length > 0) {
      procesarArchivo(archivos[0]);
    }
  });
}

// ==========================================================================
// CARGAR DATOS DESDE LA API DE ELECTRON
// ==========================================================================

function cargarDatos() {
  window.api
    .obtenerDatos()
    .then((datos) => {
      if (datos.success) {
        EstadoApp.empleados = datos.empleados || {};
        EstadoApp.marcas = datos.marcas || [];

        // Recalcular asistencia en cliente
        recalcularAsistencia();
        renderizarTodo();
      } else {
        mostrarNotificacion(
          "Error al cargar datos locales: " + datos.error,
          "danger",
        );
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarNotificacion(
        "Error al comunicarse con la base de datos de escritorio",
        "danger",
      );
    });
}

function recalcularAsistencia() {
  EstadoApp.resumenGlobal = procesarAsistencia(
    EstadoApp.marcas,
    EstadoApp.empleados,
  );

  // Filtrar empleados base
  EstadoApp.resumenGlobal = EstadoApp.resumenGlobal.filter((r) => {
    return !empleadosBase.includes(r.usuario);
  });

  // Ordenar de más reciente a más antiguo por fecha
  EstadoApp.resumenGlobal.sort((a, b) => {
    const fechaA = a.fecha.split("/").reverse().join("-");
    const fechaB = b.fecha.split("/").reverse().join("-");
    if (fechaA !== fechaB) {
      return fechaB.localeCompare(fechaA);
    }
    return a.usuario.localeCompare(b.usuario);
  });
}

// Redibujar todos los paneles
function renderizarTodo() {
  renderizarDashboard();
  renderizarTablaAsistencias();
  renderizarTablaEmpleados();
}

// Pestañas
function cambiarPestana(tabId) {
  EstadoApp.pestanaActiva = tabId;

  // Actualizar menú activo
  ElementosDOM.elementosMenu.forEach((item) => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Mostrar sección correspondiente
  ElementosDOM.contenedoresPestana.forEach((content) => {
    if (content.id === tabId + "Tab") {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

// Para compatibilidad con botones inline en el HTML
window.cambiarPestana = cambiarPestana;

// ==========================================================================
// RENDERIZAR DASHBOARD
// ==========================================================================

function renderizarDashboard() {
  const matutino = new Set(
    EstadoApp.resumenGlobal
      .filter((r) => r.turno === "MATUTINO")
      .map((r) => r.usuario),
  ).size;

  const vespertino = new Set(
    EstadoApp.resumenGlobal
      .filter((r) => r.turno === "VESPERTINO")
      .map((r) => r.usuario),
  ).size;

  const nocturno = new Set(
    EstadoApp.resumenGlobal
      .filter((r) => r.turno === "NOCTURNO")
      .map((r) => r.usuario),
  ).size;

  const total = Object.keys(EstadoApp.empleados).filter(
    (id) => !empleadosBase.includes(id),
  ).length;

  ElementosDOM.contadorMatutino.innerText = matutino;
  ElementosDOM.contadorVespertino.innerText = vespertino;
  ElementosDOM.contadorNocturno.innerText = nocturno;
  ElementosDOM.totalEmpleados.innerText = total;
}

// ==========================================================================
// RENDERIZAR TABLA DE ASISTENCIAS
// ==========================================================================

function normalizarFechaInput(fechaInput) {
  if (!fechaInput) return "";
  if (fechaInput.includes("/")) return fechaInput;
  const [y, m, d] = fechaInput.split("-");
  return `${d}/${m}/${y}`;
}

function verificarCoincidenciaFecha(fechaRegistroStr, fechasSeleccionadas) {
  if (!fechasSeleccionadas || fechasSeleccionadas.length === 0) return true;
  
  const [d, m, y] = fechaRegistroStr.split("/").map(Number);
  const fechaReg = new Date(y, m - 1, d);
  fechaReg.setHours(0, 0, 0, 0);

  if (fechasSeleccionadas.length === 2) {
    const inicio = new Date(fechasSeleccionadas[0]);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fechasSeleccionadas[1]);
    fin.setHours(0, 0, 0, 0);
    return fechaReg >= inicio && fechaReg <= fin;
  } else if (fechasSeleccionadas.length === 1) {
    const inicio = new Date(fechasSeleccionadas[0]);
    inicio.setHours(0, 0, 0, 0);
    return fechaReg.getTime() === inicio.getTime();
  }
  return true;
}

function inicializarDatePicker() {
  flatpickr("#fechaFilter", {
    locale: "es",
    dateFormat: "d/m/Y",
    mode: "range",
    allowInput: true,
    onChange: function (selectedDates, dateStr) {
      if (selectedDates.length === 0 || selectedDates.length === 2) {
        renderizarTablaAsistencias();
      }
    },
  });
}

function conectarDropdownCustom(
  dropdownId,
  triggerId,
  menuId,
  inputId,
  onChange,
) {
  const dropdown = document.getElementById(dropdownId);
  const trigger = document.getElementById(triggerId);
  const menu = document.getElementById(menuId);
  const input = document.getElementById(inputId);
  const selectedText = trigger?.querySelector(".selected-value");

  if (!dropdown || !trigger || !menu || !input) return;

  // Abrir/cerrar dropdown al hacer clic en el trigger
  trigger.addEventListener("click", (e) => {
    e.stopPropagation();

    // Cerrar otros dropdowns abiertos
    document.querySelectorAll(".custom-dropdown").forEach((d) => {
      if (d !== dropdown) d.classList.remove("open");
    });

    dropdown.classList.toggle("open");
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener("click", () => {
    dropdown.classList.remove("open");
  });

  // Seleccionar opción
  const items = menu.querySelectorAll("li");
  items.forEach((item) => {
    item.addEventListener("click", () => {
      // Remover activo anterior y agregar a este
      const activeItem = menu.querySelector("li.active");
      if (activeItem) activeItem.classList.remove("active");
      item.classList.add("active");

      // Actualizar texto y valor
      if (selectedText) selectedText.innerText = item.innerText;
      input.value = item.dataset.value;

      // Cerrar menú
      dropdown.classList.remove("open");

      // Lanzar evento change
      input.dispatchEvent(new Event("change"));
      if (onChange) onChange(item.dataset.value);
    });
  });

  // Soporte para teclado (Enter o Espacio)
  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dropdown.classList.toggle("open");
    }
  });
}

function inicializarDropdownPersonalizado() {
  // Dropdown de Filtro de Turno (Reporte Diario)
  conectarDropdownCustom(
    "turnoDropdown",
    "turnoDropdownTrigger",
    "turnoDropdownMenu",
    "turnoFilter",
  );

  // Dropdown de Filtro de Lugar (Reporte Diario)
  conectarDropdownCustom(
    "lugarDropdown",
    "lugarDropdownTrigger",
    "lugarDropdownMenu",
    "lugarFilter",
  );

  // Dropdown de Turno en el Modal de Empleados
  conectarDropdownCustom(
    "modalTurnoDropdown",
    "modalTurnoDropdownTrigger",
    "modalTurnoDropdownMenu",
    "empTurno",
  );

  // Dropdown de Lugar en el Modal de Empleados
  conectarDropdownCustom(
    "modalLugarDropdown",
    "modalLugarDropdownTrigger",
    "modalLugarDropdownMenu",
    "empLugar",
  );
}

function renderizarTablaAsistencias() {
  ElementosDOM.tablaResumen.innerHTML = "";

  const filtroTexto = ElementosDOM.entradaBusqueda.value.toLowerCase();
  const turno = ElementosDOM.filtroTurno.value;
  const lugar = ElementosDOM.filtroLugar.value;
  
  const fp = document.getElementById("fechaFilter")?._flatpickr;
  const fechasSeleccionadas = fp ? fp.selectedDates : [];

  // Filtrar los datos en el cliente
  const datosFiltrados = EstadoApp.resumenGlobal.filter((r) => {
    const coincideTexto =
      r.nombre.toLowerCase().includes(filtroTexto) ||
      r.usuario.toLowerCase().includes(filtroTexto) ||
      r.puesto.toLowerCase().includes(filtroTexto) ||
      r.entrada.includes(filtroTexto) ||
      r.salida.includes(filtroTexto);

    const coincideTurno = !turno || r.turno === turno;
    const coincideLugar = !lugar || r.lugar === lugar;
    const coincideFecha = verificarCoincidenciaFecha(r.fecha, fechasSeleccionadas);

    return coincideTexto && coincideTurno && coincideLugar && coincideFecha;
  });

  // Generar las filas de la tabla
  if (datosFiltrados.length === 0) {
    ElementosDOM.tablaResumen.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                    No se encontraron registros de asistencia.
                </td>
            </tr>
        `;
    return;
  }

  datosFiltrados.forEach((r) => {
    let badgeTurno = "";
    if (r.turno === "MATUTINO")
      badgeTurno = '<span class="badge badge-primary">Matutino</span>';
    else if (r.turno === "VESPERTINO")
      badgeTurno = '<span class="badge badge-warning">Vespertino</span>';
    else if (r.turno === "NOCTURNO")
      badgeTurno = '<span class="badge badge-secondary">Nocturno</span>';
    else badgeTurno = '<span class="badge badge-danger">Desconocido</span>';

    let badgeRegistro = "";
    let accion = "";

    if (!r.registrado) {
      badgeRegistro = '<span class="badge badge-danger">Sin Registrar</span>';
      accion = `
                <button class="btn btn-primary btn-sm" onclick="registroRapido('${r.usuario}')">
                    <i class="bi bi-person-plus-fill"></i> Registrar
                </button>
            `;
    } else {
      badgeRegistro = '<span class="badge badge-success">Registrado</span>';
      accion = `<span style="color: var(--text-secondary); font-size: 0.85rem;">Correcto</span>`;
    }

    let badgeRetardo = "";
    if (r.retardo === true) {
      badgeRetardo = '<span class="badge badge-danger"><i class="bi bi-clock-fill me-1"></i>Retardo</span>';
    } else if (r.retardo === false) {
      badgeRetardo = '<span class="badge badge-success"><i class="bi bi-check-circle-fill me-1"></i>A tiempo</span>';
    } else {
      badgeRetardo = '<span style="color: var(--text-secondary);">-</span>';
    }

    const tr = document.createElement("tr");
    if (!r.registrado) {
      tr.classList.add("row-unregistered");
    }

    tr.innerHTML = `
            <td style="font-weight: 600;">${r.usuario}</td>
            <td>${r.nombre}</td>
            <td>${r.puesto}</td>
            <td>${r.fecha}</td>
            <td>${badgeTurno}</td>
            <td>${r.lugar || "-"}</td>
            <td style="font-weight: 500;">${r.entrada}</td>
            <td style="font-weight: 500;">${r.salida}</td>
            <td>${badgeRetardo}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    ${badgeRegistro} ${accion}
                </div>
            </td>
        `;

    ElementosDOM.tablaResumen.appendChild(tr);
  });
}

// Acción de registro rápido desde la tabla de marcas no registradas
window.registroRapido = function (id) {
  abrirModalEmpleado(id);
};

// ==========================================================================
// RENDERIZAR TABLA DE CATÁLOGO DE EMPLEADOS
// ==========================================================================

function renderizarTablaEmpleados() {
  ElementosDOM.tablaEmpleados.innerHTML = "";
  const filtroTexto = ElementosDOM.entradaBusquedaEmp.value.toLowerCase();

  const listaEmpleados = Object.entries(EstadoApp.empleados).map(
    ([id, datos]) => {
      return { id, ...datos };
    },
  );

  const filtrados = listaEmpleados.filter((e) => {
    if (empleadosBase.includes(e.id)) return false;
    return (
      e.id.toLowerCase().includes(filtroTexto) ||
      e.nombre.toLowerCase().includes(filtroTexto) ||
      e.puesto.toLowerCase().includes(filtroTexto) ||
      e.turno.toLowerCase().includes(filtroTexto) ||
      (e.lugar && e.lugar.toLowerCase().includes(filtroTexto))
    );
  });

  if (filtrados.length === 0) {
    ElementosDOM.tablaEmpleados.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 30px;">
                    No hay empleados registrados en el catálogo.
                </td>
            </tr>
        `;
    return;
  }

  filtrados.forEach((e) => {
    let badgeTurno = "";
    if (e.turno === "MATUTINO")
      badgeTurno = '<span class="badge badge-primary">Matutino</span>';
    else if (e.turno === "VESPERTINO")
      badgeTurno = '<span class="badge badge-warning">Vespertino</span>';
    else if (e.turno === "NOCTURNO")
      badgeTurno = '<span class="badge badge-secondary">Nocturno</span>';

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td style="font-weight: 600;">${e.id}</td>
            <td style="font-weight: 500;">${e.nombre}</td>
            <td>${e.puesto}</td>
            <td>${badgeTurno}</td>
            <td>${e.lugar || "-"}</td>
            <td>
                <div style="display:flex; gap: 8px;">
                    <button class="btn btn-secondary btn-sm" onclick="editarEmpleado('${e.id}')">
                        <i class="bi bi-pencil-square"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarEmpleado('${e.id}')">
                        <i class="bi bi-trash-fill"></i> Eliminar
                    </button>
                </div>
            </td>
        `;
    ElementosDOM.tablaEmpleados.appendChild(tr);
  });
}

// ==========================================================================
// MODAL DE REGISTRO / EDICIÓN DE EMPLEADOS
// ==========================================================================

// Sincronizar el dropdown visual de turnos en el modal
function actualizarUIModalTurno(valor) {
  const triggerText = document
    .getElementById("modalTurnoDropdownTrigger")
    ?.querySelector(".selected-value");
  const menu = document.getElementById("modalTurnoDropdownMenu");
  const input = document.getElementById("empTurno");

  if (!triggerText || !menu || !input) return;

  input.value = valor || "";

  // Remover activo anterior
  const activeItem = menu.querySelector("li.active");
  if (activeItem) activeItem.classList.remove("active");

  // Buscar y activar el correspondiente
  const item = menu.querySelector(`li[data-value="${valor || ""}"]`);
  if (item) {
    item.classList.add("active");
    triggerText.innerText = item.innerText;
  } else {
    const defaultItem = menu.querySelector('li[data-value=""]');
    if (defaultItem) defaultItem.classList.add("active");
    triggerText.innerText = "Selecciona un turno";
  }
}

// Sincronizar el dropdown visual de lugares en el modal
function actualizarUIModalLugar(valor) {
  const triggerText = document
    .getElementById("modalLugarDropdownTrigger")
    ?.querySelector(".selected-value");
  const menu = document.getElementById("modalLugarDropdownMenu");
  const input = document.getElementById("empLugar");

  if (!triggerText || !menu || !input) return;

  input.value = valor || "VERSALLES";

  // Remover activo anterior
  const activeItem = menu.querySelector("li.active");
  if (activeItem) activeItem.classList.remove("active");

  // Buscar y activar el correspondiente
  const item = menu.querySelector(`li[data-value="${valor || "VERSALLES"}"]`);
  if (item) {
    item.classList.add("active");
    triggerText.innerText = item.innerText;
  } else {
    const defaultItem = menu.querySelector('li[data-value="VERSALLES"]');
    if (defaultItem) defaultItem.classList.add("active");
    triggerText.innerText = "Versalles";
  }
}

function abrirModalEmpleado(presetId = "") {
  ElementosDOM.modalFormulario.reset();
  actualizarUIModalTurno("");
  actualizarUIModalLugar("VERSALLES");

  if (presetId) {
    // Registro rápido de ID desconocido
    ElementosDOM.modalTitulo.innerText = "Registrar Nuevo Empleado";
    ElementosDOM.empleadoId.value = presetId;
    ElementosDOM.empleadoId.readOnly = true; // No permitir cambiar el ID
  } else {
    ElementosDOM.modalTitulo.innerText = "Agregar Empleado al Catálogo";
    ElementosDOM.empleadoId.readOnly = false;
  }

  ElementosDOM.modalEmpleado.classList.add("open");
}

function cerrarModalEmpleado() {
  ElementosDOM.modalEmpleado.classList.remove("open");
}

window.editarEmpleado = function (id) {
  const emp = EstadoApp.empleados[id];
  if (!emp) return;

  ElementosDOM.modalTitulo.innerText = "Editar Empleado";
  ElementosDOM.empleadoId.value = id;
  ElementosDOM.empleadoId.readOnly = true; // No se edita la clave
  ElementosDOM.empleadoNombre.value = emp.nombre;
  ElementosDOM.empleadoPuesto.value = emp.puesto;
  actualizarUIModalTurno(emp.turno);
  actualizarUIModalLugar(emp.lugar || "VERSALLES");

  ElementosDOM.modalEmpleado.classList.add("open");
};

function manejarEnvioFormulario(e) {
  e.preventDefault();

  const id = ElementosDOM.empleadoId.value.trim();
  const nombre = ElementosDOM.empleadoNombre.value.trim().toUpperCase();
  const puesto = ElementosDOM.empleadoPuesto.value.trim().toUpperCase();
  const turno = ElementosDOM.empleadoTurno.value;
  const lugar = ElementosDOM.empleadoLugar.value;

  if (!id || !nombre || !turno || !lugar) {
    mostrarNotificacion(
      "Por favor completa todos los campos requeridos",
      "warning",
    );
    return;
  }

  const datosEmpleado = { id, nombre, puesto, turno, lugar };

  window.api
    .guardarEmpleado(datosEmpleado)
    .then((data) => {
      if (data.success) {
        mostrarNotificacion("Empleado guardado correctamente", "success");
        cerrarModalEmpleado();
        cargarDatos();
      } else {
        mostrarNotificacion("Error al guardar: " + data.error, "danger");
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarNotificacion(
        "Error de comunicación con el sistema de archivos",
        "danger",
      );
    });
}

window.eliminarEmpleado = function (id) {
  if (!confirm(`¿Estás seguro de que deseas eliminar al empleado ${id}?`)) {
    return;
  }

  window.api
    .eliminarEmpleado(id)
    .then((data) => {
      if (data.success) {
        mostrarNotificacion("Empleado eliminado", "success");
        cargarDatos();
      } else {
        mostrarNotificacion("Error al eliminar: " + data.error, "danger");
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarNotificacion(
        "Error de comunicación con el sistema de archivos",
        "danger",
      );
    });
};

// ==========================================================================
// SUBIDA DE ARCHIVOS (CARGA TXT)
// ==========================================================================

function manejarSeleccionArchivo(e) {
  const archivos = e.target.files;
  if (archivos.length > 0) {
    procesarArchivo(archivos[0]);
  }
}

function procesarArchivo(archivo) {
  if (!archivo.name.toLowerCase().endsWith(".txt")) {
    mostrarNotificacion("El archivo debe tener formato .txt o .TXT", "warning");
    return;
  }

  const lector = new FileReader();
  lector.onload = function (evt) {
    const texto = evt.target.result;
    const registros = analizarTXT(texto); // Llama a la lógica de parseo en parser.js

    if (registros.length === 0) {
      mostrarNotificacion(
        "No se encontraron registros de marcas en el archivo",
        "warning",
      );
      return;
    }

    // Subir archivo a la API local de Electron
    subirArchivo(registros);
  };
  lector.readAsText(archivo);
}

function subirArchivo(registros) {
  window.api
    .cargarArchivo(registros)
    .then((data) => {
      if (data.success) {
        if (data.added > 0) {
          mostrarNotificacion(
            `Se importaron ${data.added} nuevas marcas de asistencia.`,
            "success",
          );
        } else {
          mostrarNotificacion(
            "El archivo no contenía marcas nuevas, todo está al día.",
            "info",
          );
        }

        // Recargar datos y recalcular
        cargarDatos();

        // Cambiar automáticamente a la pestaña de reportes
        setTimeout(() => {
          cambiarPestana("reporte");
        }, 800);
      } else {
        mostrarNotificacion(
          "Error al importar marcas: " + data.error,
          "danger",
        );
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarNotificacion("Error al escribir las marcas en disco", "danger");
    });
}

// ==========================================================================
// EXPORTACIÓN A EXCEL (SHEETJS)
// ==========================================================================

function exportarExcel() {
  if (EstadoApp.resumenGlobal.length === 0) {
    mostrarNotificacion("No hay datos disponibles para exportar", "warning");
    return;
  }

  const filtroTexto = ElementosDOM.entradaBusqueda.value.toLowerCase();
  const turno = ElementosDOM.filtroTurno.value;
  const lugar = ElementosDOM.filtroLugar.value;

  const fp = document.getElementById("fechaFilter")?._flatpickr;
  const fechasSeleccionadas = fp ? fp.selectedDates : [];

  // Obtener los datos actualmente filtrados para exportar exactamente lo que ve el usuario
  const datosFiltrados = EstadoApp.resumenGlobal.filter((r) => {
    const coincideTexto =
      r.nombre.toLowerCase().includes(filtroTexto) ||
      r.usuario.toLowerCase().includes(filtroTexto) ||
      r.puesto.toLowerCase().includes(filtroTexto) ||
      r.entrada.includes(filtroTexto) ||
      r.salida.includes(filtroTexto);

    const coincideTurno = !turno || r.turno === turno;
    const coincideLugar = !lugar || r.lugar === lugar;
    const coincideFecha = verificarCoincidenciaFecha(r.fecha, fechasSeleccionadas);

    return coincideTexto && coincideTurno && coincideLugar && coincideFecha;
  });

  const datosExportacion = datosFiltrados.map((r) => ({
    "Usuario/Siglas": r.usuario,
    "Nombre Completo": r.nombre,
    "Puesto de Trabajo": r.puesto,
    Fecha: r.fecha,
    Turno: r.turno,
    Lugar: r.lugar,
    "Hora Entrada": r.entrada,
    "Hora Salida": r.salida,
    "Retardo": r.retardo === true ? "Retardo" : (r.retardo === false ? "A tiempo" : "-"),
    "Estatus Catálogo": r.registrado ? "Registrado" : "No Registrado",
  }));

  const hojaTrabajo = XLSX.utils.json_to_sheet(datosExportacion);
  const libroTrabajo = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libroTrabajo, hojaTrabajo, "Asistencia");

  // Ajustar anchos de columnas automáticamente
  const maximoValor = (arr, key) =>
    arr.reduce(
      (max, obj) => Math.max(max, obj[key] ? obj[key].toString().length : 0),
      key.length,
    );
  hojaTrabajo["!cols"] = Object.keys(datosExportacion[0] || {}).map((key) => ({
    wch: Math.max(maximoValor(datosExportacion, key) + 3, 10),
  }));

  XLSX.writeFile(libroTrabajo, "Reporte_Asistencia.xlsx");
  mostrarNotificacion("Reporte de Excel descargado con éxito", "success");
}

// ==========================================================================
// NOTIFICACIONES (TOAST)
// ==========================================================================

function mostrarNotificacion(mensaje, tipo = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;

  let icono = "bi-info-circle-fill";
  if (tipo === "success") icono = "bi-check-circle-fill";
  if (tipo === "danger") icono = "bi-exclamation-triangle-fill";
  if (tipo === "warning") icono = "bi-exclamation-circle-fill";

  toast.innerHTML = `
        <i class="bi ${icono}"></i>
        <span>${mensaje}</span>
    `;

  ElementosDOM.contenedorNotificaciones.appendChild(toast);

  // Eliminar notificación después de 4 segundos
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s reverse forwards";
    toast.addEventListener("animationend", () => {
      toast.remove();
    });
  }, 4000);
}
