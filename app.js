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


/* =====================================================
   INICIAR CÁMARA
===================================================== */

async function iniciarCamara() {

  if (stream) {

    stream
      .getTracks()
      .forEach(track => track.stop());

    stream = null;
  }

  try {

    /*
     * No forzamos resolución ni relación de aspecto.
     * Dejamos que Safari entregue el video de la cámara.
     */

    stream = await navigator.mediaDevices.getUserMedia({

      video: {
        facingMode: usandoFrontal
          ? "user"
          : "environment"
      },

      audio: false

    });


    video.srcObject = stream;

    /*
     * Nunca espejamos la cámara.
     */
    video.style.transform = "none";

    await video.play();


    /*
     * Intentamos quitar cualquier zoom
     * que Safari exponga como controlable.
     */

    const track = stream.getVideoTracks()[0];

    if (
      track &&
      track.getCapabilities
    ) {

      const capabilities =
        track.getCapabilities();

      if (
        capabilities.zoom &&
        capabilities.zoom.min !== undefined
      ) {

        try {

          await track.applyConstraints({

            advanced: [
              {
                zoom: capabilities.zoom.min
              }
            ]

          });

        } catch (error) {

          console.log(
            "El zoom no puede modificarse en este dispositivo."
          );

        }

      }

    }

  } catch (error) {

    console.error(
      "Error iniciando cámara:",
      error
    );

    alert(
      "No pudimos acceder a la cámara. " +
      "Verifica los permisos de Safari."
    );

  }

}


/* =====================================================
   ABRIR CÁMARA
===================================================== */

abrirCamara.addEventListener(
  "click",
  async () => {

    inicio.classList.add("oculto");

    camara.classList.remove("oculto");

    usandoFrontal = false;

    await iniciarCamara();

  }
);


/* =====================================================
   CAMBIAR CÁMARA
===================================================== */

cambiarCamara.addEventListener(
  "click",
  async () => {

    usandoFrontal = !usandoFrontal;

    await iniciarCamara();

  }
);


/* =====================================================
   TOMAR FOTO
===================================================== */

tomarFoto.addEventListener(
  "click",
  () => {

    if (
      !video.videoWidth ||
      !video.videoHeight
    ) {
      return;
    }


    /*
     * =================================================
     * FOTO FINAL
     *
     * El marco es 1080 x 1920.
     * Por lo tanto TODAS las fotos finales
     * serán exactamente 1080 x 1920.
     * =================================================
     */

    const destinoAncho = 1080;
    const destinoAlto = 1920;


    const canvas =
      document.createElement("canvas");

    canvas.width = destinoAncho;
    canvas.height = destinoAlto;


    const ctx =
      canvas.getContext("2d");


    /*
     * =================================================
     * RECORTE DEL VIDEO
     *
     * Queremos obtener una imagen 9:16
     * sin deformarla.
     *
     * Si el video es más ancho:
     *     recortamos los lados.
     *
     * Si el video ya es 9:16:
     *     utilizamos todo.
     *
     * Nunca estiramos la imagen.
     * =================================================
     */

    const videoAncho =
      video.videoWidth;

    const videoAlto =
      video.videoHeight;


    const proporcionObjetivo =
      destinoAncho / destinoAlto;


    const proporcionVideo =
      videoAncho / videoAlto;


    let sx = 0;
    let sy = 0;
    let sw = videoAncho;
    let sh = videoAlto;


    if (
      proporcionVideo > proporcionObjetivo
    ) {

      /*
       * El video es demasiado ancho.
       *
       * Conservamos TODO el alto
       * y recortamos los lados.
       */

      sw =
        videoAlto *
        proporcionObjetivo;

      sx =
        (videoAncho - sw) / 2;

    } else if (
      proporcionVideo < proporcionObjetivo
    ) {

      /*
       * Si alguna cámara entrega un formato
       * más estrecho, recortamos arriba/abajo.
       */

      sh =
        videoAncho /
        proporcionObjetivo;

      sy =
        (videoAlto - sh) / 2;

    }


    /*
     * =================================================
     * DIBUJAR LA CÁMARA
     *
     * IMPORTANTE:
     * NO hacemos espejo en la cámara frontal.
     * =================================================
     */

    ctx.drawImage(

      video,

      sx,
      sy,
      sw,
      sh,

      0,
      0,
      destinoAncho,
      destinoAlto

    );


    /*
     * =================================================
     * CARGAR MARCO
     * =================================================
     */

    const marco =
      new Image();


    marco.onload = () => {

      /*
       * El marco tiene exactamente 1080x1920.
       *
       * Se dibuja encima SIN deformarlo.
       */

      ctx.drawImage(

        marco,

        0,
        0,
        destinoAncho,
        destinoAlto

      );


      /*
       * PNG final.
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


      /*
       * Apagar cámara.
       */

      if (stream) {

        stream
          .getTracks()
          .forEach(
            track => track.stop()
          );

        stream = null;

      }

    };


    marco.src =
      "marco.png";

  }
);


/* =====================================================
   OTRA FOTO
===================================================== */

otraFoto.addEventListener(
  "click",
  async () => {

    resultado.classList.add(
      "oculto"
    );

    camara.classList.remove(
      "oculto"
    );

    await iniciarCamara();

  }
);


/* =====================================================
   COMPARTIR
===================================================== */

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
        "Error compartiendo:",
        error
      );

    }

  }
);
