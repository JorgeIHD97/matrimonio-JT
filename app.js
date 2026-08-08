const inicio = document.getElementById("inicio");
const camara = document.getElementById("camara");
const resultado = document.getElementById("resultado");
const abrirCamara = document.getElementById("abrirCamara");
const cambiarCamara = document.getElementById("cambiarCamara");
const tomarFoto = document.getElementById("tomarFoto");
const otraFoto = document.getElementById("otraFoto");
const video = document.getElementById("video");
const fotoFinal = document.getElementById("fotoFinal");
const descargar = document.getElementById("descargar");
const compartir = document.getElementById("compartir");
let stream = null;
let usandoFrontal = false;
let zoomActual = 1;
/* =====================================
   INFORMACIÓN DE LAS CÁMARAS
===================================== */
async function listarCamaras() {
  try {
    const dispositivos =
      await navigator.mediaDevices.enumerateDevices();
    const camaras =
      dispositivos.filter(
        dispositivo =>
          dispositivo.kind === "videoinput"
      );
    console.log("=================================");
    console.log("CÁMARAS DETECTADAS POR SAFARI");
    console.log("=================================");
    camaras.forEach((camara, indice) => {
      console.log(
        "Cámara #" + (indice + 1)
      );
      console.log(
        "Nombre:",
        camara.label || "Sin nombre"
      );
      console.log(
        "Device ID:",
        camara.deviceId
      );
      console.log(
        "Group ID:",
        camara.groupId
      );
      console.log("---------------------------------");
    });
  } catch (error) {
    console.error(
      "Error enumerando cámaras:",
      error
    );
  }
}
/* =====================================
   MOSTRAR INFORMACIÓN REAL DE LA CÁMARA
===================================== */
function mostrarInformacionCamara(track) {
  if (!track) {
    return;
  }
  const settings =
    track.getSettings();
  const capabilities =
    track.getCapabilities
      ? track.getCapabilities()
      : {};
  console.log("");
  console.log("=================================");
  console.log("CÁMARA ACTUALMENTE UTILIZADA");
  console.log("=================================");
  console.log(
    "Device ID:",
    settings.deviceId || "No disponible"
  );
  console.log(
    "Group ID:",
    settings.groupId || "No disponible"
  );
  console.log(
    "Resolución:",
    settings.width,
    "x",
    settings.height
  );
  console.log(
    "Relación de aspecto:",
    settings.aspectRatio
  );
  console.log(
    "Facing mode:",
    settings.facingMode
  );
  console.log(
    "Frame rate:",
    settings.frameRate
  );
  console.log(
    "Zoom actual:",
    settings.zoom
  );
  console.log(
    "Zoom soportado:",
    capabilities.zoom || "No disponible"
  );
  console.log(
    "Resoluciones disponibles:",
    capabilities.width || "No disponible"
  );
  console.log(
    "Alturas disponibles:",
    capabilities.height || "No disponible"
  );
  console.log(
    "================================="
  );
  /*
   * Mostrar también la información
   * directamente en pantalla.
   */
  let mensaje = "";
  mensaje +=
    "Cámara detectada\n\n";
  mensaje +=
    "Resolución: " +
    (settings.width || "?") +
    " × " +
    (settings.height || "?") +
    "\n";
  mensaje +=
    "Relación: " +
    (settings.aspectRatio || "?") +
    "\n";
  mensaje +=
    "Cámara: " +
    (settings.facingMode || "?") +
    "\n";
  mensaje +=
    "Zoom: " +
    (settings.zoom || "1") +
    "\n\n";
  mensaje +=
    "Revisa también la consola de Safari.";
  console.log(mensaje);
}
/* =====================================
   INICIAR CÁMARA
===================================== */
async function iniciarCamara() {
  if (stream) {
    stream
      .getTracks()
      .forEach(track => track.stop());
    stream = null;
  }
  try {
    /*
     * IMPORTANTE:
     *
     * NO seleccionamos todavía un
     * deviceId específico.
     *
     * Primero necesitamos saber cuál
     * cámara está escogiendo Safari.
     */
    const constraints = {
      video: {
        facingMode:
          usandoFrontal
            ? { ideal: "user" }
            : { ideal: "environment" },
        /*
         * No forzamos recorte.
         */
        aspectRatio: {
          ideal: 9 / 16
        },
        /*
         * Resolución como preferencia.
         */
        width: {
          ideal: 1440
        },
        height: {
          ideal: 2560
        },
        frameRate: {
          ideal: 30
        }
      },
      audio: false
    };
    console.log(
      "Solicitando cámara..."
    );
    console.log(
      constraints
    );
    stream =
      await navigator.mediaDevices
        .getUserMedia(constraints);
    video.srcObject =
      stream;
    await video.play();
    const track =
      stream.getVideoTracks()[0];
    mostrarInformacionCamara(track);
    /*
     * Eliminar cualquier transformación
     * visual que pudiera producir zoom.
     */
    video.style.transform =
      "none";
    /*
     * Volvemos a enumerar las cámaras
     * después de obtener permiso.
     *
     * Esto es importante porque Safari
     * puede revelar los nombres después
     * de conceder acceso.
     */
    await listarCamaras();
  } catch (error) {
    console.error(
      "Error iniciando cámara:",
      error
    );
    /*
     * Segundo intento compatible.
     */
    try {
      stream =
        await navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode:
                usandoFrontal
                  ? "user"
                  : "environment"
            },
            audio: false
          });
      video.srcObject =
        stream;
      await video.play();
      const track =
        stream.getVideoTracks()[0];
      mostrarInformacionCamara(track);
      video.style.transform =
        "none";
      await listarCamaras();
    } catch (error2) {
      console.error(
        error2
      );
      alert(
        "No pudimos acceder a la cámara. " +
        "Verifica los permisos de cámara."
      );
    }
  }
}
/* =====================================
   ABRIR CÁMARA
===================================== */
abrirCamara.addEventListener(
  "click",
  async () => {
    inicio.classList.add(
      "oculto"
    );
    camara.classList.remove(
      "oculto"
    );
    zoomActual = 1;
    await iniciarCamara();
  }
);
/* =====================================
   CAMBIAR CÁMARA
===================================== */
cambiarCamara.addEventListener(
  "click",
  async () => {
    usandoFrontal =
      !usandoFrontal;
    zoomActual = 1;
    await iniciarCamara();
  }
);
/* =====================================
   TOMAR FOTO
===================================== */
tomarFoto.addEventListener(
  "click",
  () => {
    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }
    const ancho =
      video.videoWidth;
    const alto =
      video.videoHeight;
    const canvas =
      document.createElement(
        "canvas"
      );
    canvas.width =
      ancho;
    canvas.height =
      alto;
    const ctx =
      canvas.getContext(
        "2d"
      );
    /*
     * Cámara frontal:
     * mantener efecto espejo.
     */
    if (usandoFrontal) {
      ctx.translate(
        ancho,
        0
      );
      ctx.scale(
        -1,
        1
      );
    }
    /*
     * Capturar EXACTAMENTE
     * el video recibido.
     */
    ctx.drawImage(
      video,
      0,
      0,
      ancho,
      alto
    );
    /*
     * Cargar marco.
     */
    const marco =
      new Image();
    marco.onload = () => {
      ctx.setTransform(
        1,
        0,
        0,
        1,
        0,
        0
      );
      ctx.drawImage(
        marco,
        0,
        0,
        ancho,
        alto
      );
      const imagen =
        canvas.toDataURL(
          "image/png"
        );
      fotoFinal.src =
        imagen;
      descargar.href =
        imagen;
      camara.classList.add(
        "oculto"
      );
      resultado.classList.remove(
        "oculto"
      );
      if (stream) {
        stream
          .getTracks()
          .forEach(
            track =>
              track.stop()
          );
        stream = null;
      }
    };
    marco.src =
      "marco.png";
  }
);
/* =====================================
   OTRA FOTO
===================================== */
otraFoto.addEventListener(
  "click",
  async () => {
    resultado.classList.add(
      "oculto"
    );
    camara.classList.remove(
      "oculto"
    );
    zoomActual = 1;
    await iniciarCamara();
  }
);
/* =====================================
   COMPARTIR
===================================== */
compartir.addEventListener(
  "click",
  async () => {
    try {
      const respuesta =
        await fetch(
          fotoFinal.src
        );
      const blob =
        await respuesta.blob();
      const archivo =
        new File(
          [blob],
          "J-T-15-08-2026.png",
          {
            type: "image/png"
          }
        );
      if (
        navigator.canShare &&
        navigator.canShare({
          files: [archivo]
        })
      ) {
        await navigator.share({
          files: [archivo],
          title:
            "J & T · 15.08.2026",
          text:
            "Un recuerdo de nuestro día 🤍"
        });
      } else {
        alert(
          "Guarda la foto y compártela " +
          "desde tu galería."
        );
      }
    } catch (error) {
      console.error(
        error
      );
    }
  }
);
/* =====================================
   INICIO
===================================== */
listarCamaras();
