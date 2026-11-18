"use strict";

// Elementos que conectan JavaScript con el HTML.
const seccionAdopcion = document.getElementById("adopcion");
const listaAnimales = document.getElementById("lista-animales");
const mensajeCarga = document.getElementById("mensaje-carga");
const mensajeError = document.getElementById("mensaje-error");
const textoError = document.getElementById("texto-error");
const formularioBusqueda = document.getElementById("formulario-busqueda");
const campoBusqueda = document.getElementById("buscar-animal");
const botonTema = document.getElementById("cambiar-tema");
const botonReintentar = document.getElementById("reintentar-carga");
const botonesFiltro = document.querySelectorAll("[data-filtro]");

// Variables para almacenar los datos y el estado actual.
let animales = [];
let animalesFiltradosActuales = [];
let categoriaSeleccionada = "todos";
let indiceMazo = 0;
const favoritos = new Set();

// Convierte valores en texto seguro para insertarlos en HTML.
function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&")
        .replaceAll("<", "<")
        .replaceAll(">", ">")
        .replaceAll('"', "")
        .replaceAll("'", "'");
}

// Normaliza texto para que la búsqueda no dependa de mayúsculas o tildes.
function normalizar(valor) {
    return String(valor ?? "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Crea la ventana de detalles si todavía no existe.
function crearVentanaDetalles() {
    let ventana = document.querySelector(".ventana-detalles");
    if (ventana) return ventana;

    ventana = document.createElement("dialog");
    ventana.className = "ventana-detalles";
    ventana.setAttribute("aria-labelledby", "detalle-nombre");
    ventana.innerHTML = `
        <div class="ventana-detalles__contenido">
            <button class="ventana-detalles__cerrar" type="button" aria-label="Cerrar detalles">×</button>
            <img class="ventana-detalles__imagen" alt="" hidden>
            <h2 class="ventana-detalles__nombre" id="detalle-nombre"></h2>
            <p class="ventana-detalles__tipo"></p><p class="ventana-detalles__edad"></p>
            <p class="ventana-detalles__genero"></p><p class="ventana-detalles__ubicacion"></p>
            <a class="ventana-detalles__enlace" target="_blank" rel="noopener noreferrer" hidden>Ver publicación original</a>
        </div>`;
    document.body.appendChild(ventana);
    ventana.querySelector(".ventana-detalles__cerrar").addEventListener("click", () => ventana.close());
    ventana.addEventListener("click", (evento) => {
        if (evento.target === ventana) ventana.close();
    });
    return ventana;
}

// Rellena la ventana emergente con la información del animal elegido.
function mostrarDetalles(idAnimal) {
    const animal = animales.find((item) => String(item.id) === String(idAnimal));
    if (!animal) return;

    const ventana = crearVentanaDetalles();
    const imagen = ventana.querySelector(".ventana-detalles__imagen");
    const enlace = ventana.querySelector(".ventana-detalles__enlace");
    ventana.querySelector(".ventana-detalles__nombre").textContent = animal.nombre || "Animal sin nombre";
    ventana.querySelector(".ventana-detalles__tipo").textContent = `Tipo: ${animal.tipo || "No informado"}`;
    ventana.querySelector(".ventana-detalles__edad").textContent = `Edad: ${animal.edad || "No informada"}`;
    ventana.querySelector(".ventana-detalles__genero").textContent = `Género: ${animal.genero || "No informado"}`;
    ventana.querySelector(".ventana-detalles__ubicacion").textContent = `Ubicación: ${[animal.comuna, animal.region].filter(Boolean).join(", ") || "No informada"}`;

    if (animal.imagen) {
        imagen.src = animal.imagen;
        imagen.alt = `Fotografía de ${animal.nombre || "un animal"}`;
        imagen.hidden = false;
        imagen.onerror = () => { imagen.hidden = true; };
    } else {
        imagen.removeAttribute("src");
        imagen.hidden = true;
    }
    if (animal.url) {
        enlace.href = animal.url;
        enlace.hidden = false;
    } else {
        enlace.removeAttribute("href");
        enlace.hidden = true;
    }
    if (!ventana.open) ventana.showModal();
}

// Crea una tarjeta individual con botones "Anterior", "Detalles" y "Siguiente".
function crearTarjeta(animal, posicion) {
    const id = escaparHTML(animal.id);
    const nombre = escaparHTML(animal.nombre || "Animal sin nombre");
    const tipo = escaparHTML(animal.tipo || "Animal");
    const edad = escaparHTML(animal.edad || "Edad no informada");
    const ubicacion = escaparHTML([animal.comuna, animal.region].filter(Boolean).join(", ") || "Ubicación no informada");
    const esFavorito = favoritos.has(String(animal.id));
    const imagenHTML = animal.imagen
        ? `<img src="${escaparHTML(animal.imagen)}" alt="Fotografía de ${nombre}" loading="lazy">`
        : `<div class="adopcion__imagen-sin-foto" role="img" aria-label="Sin fotografía disponible">🐾<span>Sin fotografía</span></div>`;
    const enlaceHTML = animal.url
        ? `<a class="adopcion__enlace-original" href="${escaparHTML(animal.url)}" target="_blank" rel="noopener noreferrer">Publicación original</a>` : "";

    const tarjeta = document.createElement("article");
    tarjeta.className = "adopcion__tarjeta-animal";
    tarjeta.dataset.idAnimal = id;
    tarjeta.dataset.posicion = String(posicion);
    tarjeta.innerHTML = `
        <button class="adopcion__boton-favorito" type="button" data-accion="favorito" data-id="${id}" aria-pressed="${esFavorito}" aria-label="${esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}">${esFavorito ? "♥" : "♡"}</button>
        ${imagenHTML}<p class="adopcion__etiqueta">${tipo}</p><h3>${nombre}</h3>
        <p><strong>Edad:</strong> ${edad}</p><p><strong>Ubicación:</strong> ${ubicacion}</p>
        <div class="adopcion__acciones-tarjeta">
            <button class="adopcion__boton-anterior" type="button" data-accion="anterior">← Anterior</button>
            <button class="adopcion__boton-detalles" type="button" data-accion="detalles" data-id="${id}">Detalles</button>
            <button class="adopcion__boton-siguiente" type="button" data-accion="siguiente">Siguiente →</button>
        </div>${enlaceHTML}`;
    return tarjeta;
}

// Muestra los animales guardados en favoritos (con foto completa sin recortes)
function mostrarFavoritos() {
    const contenedorFavoritos = document.getElementById("lista-favoritos");
    if (!contenedorFavoritos) return;
    
    contenedorFavoritos.replaceChildren();

    const animalesFavoritos = animales.filter(animal => favoritos.has(String(animal.id)));

    if (animalesFavoritos.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "favoritos__vacio";
        mensaje.textContent = "Aún no tienes animales guardados en favoritos.";
        contenedorFavoritos.appendChild(mensaje);
        return;
    }

    animalesFavoritos.forEach(animal => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "beneficios__tarjeta";
        tarjeta.style.textAlign = "left";
        
        const nombre = escaparHTML(animal.nombre || "Sin nombre");
        const tipo = escaparHTML(animal.tipo || "Animal");
        const edad = escaparHTML(animal.edad || "No informada");
        const imagenSrc = animal.imagen ? escaparHTML(animal.imagen) : "";

        tarjeta.innerHTML = `
            ${imagenSrc ? `<img src="${imagenSrc}" alt="Foto de ${nombre}" style="width:100%; height:200px; object-fit:contain; background-color:#eaeaea; border-radius:12px; margin-bottom:12px;">` : ""}
            <span class="adopcion__etiqueta">${tipo}</span>
            <h3 style="color:var(--color-acento); margin: 8px 0;">${nombre}</h3>
            <p><strong>Edad:</strong> ${edad}</p>
            <button class="adopcion__boton-detalles" type="button" data-accion="detalles" data-id="${escaparHTML(animal.id)}" style="margin-top:12px; width:100%; padding:10px; border:0; border-radius:8px; background:var(--color-acento); color:#fff; font-weight:bold;">Ver detalles</button>
        `;
        contenedorFavoritos.appendChild(tarjeta);
    });
}

// Aplica los filtros de disponibilidad, categoría y nombre.
function obtenerAnimalesFiltrados() {
    const busqueda = normalizar(campoBusqueda.value);
    return animales.filter((animal) => {
        const disponible = normalizar(animal.estado) === "adopcion";
        const tipo = normalizar(animal.tipo);
        const coincideCategoria = categoriaSeleccionada === "todos" || tipo.includes(categoriaSeleccionada);
        const coincideNombre = normalizar(animal.nombre).includes(busqueda);
        return disponible && coincideCategoria && coincideNombre;
    });
}

// Dibuja la tarjeta principal y las dos tarjetas que quedan detrás.
function mostrarAnimales(reiniciarMazo = false) {
    animalesFiltradosActuales = obtenerAnimalesFiltrados();
    if (reiniciarMazo) indiceMazo = 0;
    if (indiceMazo >= animalesFiltradosActuales.length) indiceMazo = 0;
    listaAnimales.replaceChildren();

    if (animalesFiltradosActuales.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "adopcion__mensaje-vacio";
        mensaje.textContent = "No encontramos animales con esos criterios. Prueba otra búsqueda o categoría.";
        listaAnimales.appendChild(mensaje);
        return;
    }

    for (let posicion = 0; posicion < Math.min(3, animalesFiltradosActuales.length); posicion++) {
        const indice = (indiceMazo + posicion) % animalesFiltradosActuales.length;
        listaAnimales.appendChild(crearTarjeta(animalesFiltradosActuales[indice], posicion));
    }
}

// Descarga los animales desde la API de Huachitos.
async function cargarAnimales() {
    mensajeCarga.hidden = false;
    mensajeError.hidden = true;
    mensajeCarga.textContent = "Cargando animales...";
    listaAnimales.replaceChildren();

    try {
        const respuesta = await fetch(seccionAdopcion.dataset.apiUrl);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
        const resultado = await respuesta.json();
        if (!Array.isArray(resultado.data)) throw new Error("Formato de respuesta inesperado");
        animales = resultado.data;
        indiceMazo = 0;
        mostrarAnimales(true);
        mostrarFavoritos();
        mensajeCarga.hidden = true;
    } catch (error) {
        console.error("No se pudieron cargar los animales:", error);
        mensajeCarga.hidden = true;
        mensajeError.hidden = false;
        textoError.textContent = "No pudimos cargar los perfiles. Comprueba tu conexión e inténtalo nuevamente.";
    }
}

// Cambia entre el tema claro y el oscuro.
function cambiarTema() {
    const oscuro = document.body.classList.toggle("modo-oscuro");
    botonTema.setAttribute("aria-pressed", String(oscuro));
    botonTema.textContent = oscuro ? "☀️" : "🌙";
}

formularioBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mostrarAnimales(true);
});

botonesFiltro.forEach((boton) => {
    boton.addEventListener("click", () => {
        categoriaSeleccionada = boton.dataset.filtro;
        botonesFiltro.forEach((otro) => {
            const activo = otro === boton;
            otro.classList.toggle("categorias__boton--activo", activo);
            otro.setAttribute("aria-pressed", String(activo));
        });
        mostrarAnimales(true);
    });
});

listaAnimales.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    if (boton.dataset.accion === "siguiente") {
        if (animalesFiltradosActuales.length > 1) {
            indiceMazo = (indiceMazo + 1) % animalesFiltradosActuales.length;
            mostrarAnimales();
        }
        return;
    }
    if (boton.dataset.accion === "anterior") {
        if (animalesFiltradosActuales.length > 1) {
            indiceMazo = (indiceMazo - 1 + animalesFiltradosActuales.length) % animalesFiltradosActuales.length;
            mostrarAnimales();
        }
        return;
    }
    if (boton.dataset.accion === "favorito") {
        const id = String(boton.dataset.id);
        if (favoritos.has(id)) favoritos.delete(id);
        else favoritos.add(id);
        mostrarAnimales();
        mostrarFavoritos();
        return;
    }
    if (boton.dataset.accion === "detalles") mostrarDetalles(boton.dataset.id);
});

// Listener para los botones de detalles dentro de la sección de Favoritos
document.getElementById("lista-favoritos").addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;
    if (boton.dataset.accion === "detalles") mostrarDetalles(boton.dataset.id);
});

botonTema.addEventListener("click", cambiarTema);
botonReintentar.addEventListener("click", cargarAnimales);
cargarAnimales();