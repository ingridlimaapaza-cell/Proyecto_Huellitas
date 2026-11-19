/* script.js */

const botonesCategoria = document.querySelectorAll(".categorias__boton");
const parrafoAdopcion =
    document.querySelector(".adopcion__lista-animales p") ||
    document.querySelector("#adopcion p");

function marcarBotonActivo(botonSeleccionado) {
    botonesCategoria.forEach((boton) => {
        boton.style.cursor = "pointer";
        boton.style.backgroundColor = "rgba(255, 255, 255, .75)";
        boton.style.color = "#50664c";
    });

    botonSeleccionado.style.backgroundColor = "#71866a";
    botonSeleccionado.style.color = "#ffffff";
}

function actualizarTextoAdopcion(textoBoton) {
    if (!parrafoAdopcion) return;

    const categoria = textoBoton.trim().toLowerCase();

    if (categoria === "todos los peluditos") {
        parrafoAdopcion.textContent =
            "Próximamente encontrarás aquí a nuestros peluditos disponibles para adopción.";
    } else {
        parrafoAdopcion.textContent =
            `Próximamente encontrarás aquí a nuestros ${categoria} disponibles para adopción.`;
    }
}

if (botonesCategoria.length > 0) {
    marcarBotonActivo(botonesCategoria[0]);
    actualizarTextoAdopcion(botonesCategoria[0].textContent);

    botonesCategoria.forEach((boton) => {
        boton.addEventListener("click", () => {
            marcarBotonActivo(boton);
            actualizarTextoAdopcion(boton.textContent);
        });
    });
}