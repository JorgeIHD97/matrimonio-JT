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

const zoom05 = document.getElementById("zoom05");
const zoom1 = document.getElementById("zoom1");
const zoom2 = document.getElementById("zoom2");
const zoomSlider = document.getElementById("zoomSlider");

let stream = null;
let usandoFrontal = false;
let zoomActual = 1;
let zoomRealDisponible = false;


/* =========================
   INICIAR CÁMARA
========================= */

async function iniciarCamara() {

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  try {

    stream = await navigator.mediaDevices.getUserMedia({

      video: {
        facingMode: usandoFrontal ? "user" : "environment",

        /*
         * Pedimos la máxima resolución disponible.
         * El navegador elegirá la mejor que el dispositivo
         * pueda entregar.
         */
        width: {
          ideal: 9999
        },

        height: {
          ideal: 9999
        },

        frameRate: {
          ideal: 30,
          max: 60
        }
      },

      audio: false
    });

    video.srcObject = stream;

    await video.play();

    mostrarResolucionReal();

    detectarZoom();

  } catch (error) {

    console.error(error);

    /*
     * Algunos dispositivos pueden rechazar una solicitud
     * demasiado exigente. En ese caso hacemos un segundo
     * intento más compatible.
     */

    try {

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: usandoFrontal ? "user" : "environment"
        },
        audio: false
      });

      video.srcObject = stream;

      await video.play();

      mostrarResolucionReal();

      detectarZoom();

    } catch (error2) {

      console.error(error2);

      alert(
        "No pudimos acceder a la cámara. " +
        "Verifica que hayas permitido el acceso a la cámara."
      );
    }
  }
}


/* =========================
   RESOLUCIÓN REAL
========================= */

function mostrarResolucionReal() {

  if (!stream) return;

  const track = stream.getVideoTracks()[0];

  if (!track) return;

  const ajustes = track.getSettings();

  console.log(
    "Resolución utilizada:",
    ajustes.width,
    "x",
    ajustes.height
  );
}


/* =========================
   DETECTAR ZOOM
========================= */

function detectarZoom() {

  zoomRealDisponible = false;

  if (!stream) return;

  const track = stream.getVideoTracks()[0];

  if (!track || !track.getCapabilities) return;

  const capacidades = track.getCapabilities();

  if (
    capacidades.zoom &&
    capacidades.zoom.min !== undefined &&
    capacidades.zoom.max !== undefined
  ) {

    zoomRealDisponible = true;

    zoomSlider.min = capacidades.zoom.min;
    zoomSlider.max = capacidades.zoom.max;

    zoomSlider.step =
      capacidades.zoom.step || 0.1;

    zoomSlider.value = zoomActual;
  }
}


/* =========================
   APLICAR ZOOM
========================= */

async function aplicarZoom(valor) {

  zoomActual = Number(valor);

  zoomSlider.value = zoomActual;

  if (!video) return;


  /*
   * Intentamos primero utilizar el zoom
   * real proporcionado por la cámara.
   */

  if (zoomRealDisponible && stream) {

    const track =
      stream.getVideoTracks()[0];

    try {

      await track.applyConstraints({

        advanced: [
          {
            zoom: zoomActual
          }
        ]

      });

      video.style.transform = "none";

      return;

    } catch (error) {

      console.log(
        "El zoom nativo no está disponible."
      );
    }
  }


  /*
   * Respaldo mediante zoom digital.
   */

  if (usandoFrontal) {

    video.style.transform =
      scale(${zoomActual}) scaleX(-1);

  } else {

    video.style.transform =
      scale(${zoomActual});
  }
}


/* =========================
   BOTONES DE ZOOM
========================= */

zoom05.addEventListener(
  "click",
  () => aplicarZoom(0.5)
);

zoom1.addEventListener(
  "click",
  () => aplicarZoom(1)
);

zoom2.addEventListener(
  "click",
  () => aplicarZoom(2)
);


/* =========================
   DESLIZADOR
========================= */

zoomSlider.addEventListener(
  "input",
  () => {

    aplicarZoom(
      zoomSlider.value
    );

  }
);


/* =========================
   ABRIR CÁMARA
========================= */

abrirCamara.addEventListener(
  "click",
  async () => {

    inicio.classList.add("oculto");

    camara.classList.remove("oculto");

    await iniciarCamara();

  }
);


/* =========================
   CAMBIAR CÁMARA
========================= */

cambiarCamara.addEventListener(
  "click",
  async () => {

    usandoFrontal = !usandoFrontal;

    zoomActual = 1;

    await iniciarCamara();

  }
);


/* =========================
   TOMAR FOTO
========================= */

tomarFoto.addEventListener(
  "click",
  () => {

    if (!video.videoWidth) {
      return;
    }

    /*
     * Utilizamos la resolución real del video
     * para conservar la mayor cantidad de
     * información posible.
     */

    const videoWidth =
      video.videoWidth;

    const videoHeight =
      video.videoHeight;


    /*
     * Mantendremos el resultado en 9:16.
     *
     * Usamos la mayor área posible de la
     * imagen original sin deformarla.
     */

    const proporcion = 9 / 16;

    let ancho;
    let alto;

    if (
      videoWidth / videoHeight >
      proporcion
    ) {

      alto = videoHeight;
      ancho = Math.round(
        alto * proporcion
      );

    } else {

      ancho = videoWidth;
      alto = Math.round(
        ancho / proporcion
      );
    }


    const canvas =
      document.createElement("canvas");

    canvas.width = ancho;
    canvas.height = alto;

    const ctx =
      canvas.getContext("2d", {
        alpha: false
      });


    /*
     * Coordenadas del recorte 9:16.
     */

    const sx =
      (videoWidth - ancho) / 2;

    const sy =
      (videoHeight - alto) / 2;


    /*
     * Cámara frontal:
     * la fotografía queda reflejada
     * como un selfie normal.
     */

    if (usandoFrontal) {

      ctx.translate(ancho, 0);

      ctx.scale(-1, 1);

      ctx.drawImage(
        video,
        sx,
        sy,
        ancho,
        alto,
        0,
        0,
        ancho,
        alto
      );

    } else {

      ctx.drawImage(
        video,
        sx,
        sy,
        ancho,
        alto,
        0,
        0,
        ancho,
        alto
      );
    }


    /*
     * Agregar el marco.
     */

    const marco =
      new Image();

    marco.onload = () => {

      ctx.setTransform(
        1, 0, 0, 1, 0, 0
      );

      ctx.drawImage(
        marco,
        0,
        0,
        ancho,
        alto
      );


      /*
       * PNG a máxima calidad.
       */

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


/* =========================
   OTRA FOTO
========================= */

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


/* =========================
   COMPARTIR
========================= */

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

      console.error(error);

    }

  }
);
