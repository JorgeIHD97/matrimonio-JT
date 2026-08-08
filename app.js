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
   INICIAR CÁMARA VERTICAL
===================================== */

async function iniciarCamara() {

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  try {

    /*
     * Solicitamos específicamente una cámara
     * vertical 9:16.
     *
     * No fijamos 1080, 1920, etc.
     * El dispositivo escogerá la máxima
     * resolución que pueda entregar.
     */

    const constraints = {

      video: {

        facingMode: usandoFrontal
          ? "user"
          : "environment",

        width: {
          ideal: 2160
        },

        height: {
          ideal: 3840
        },

        aspectRatio: {
          ideal: 9 / 16
        },

        frameRate: {
          ideal: 30,
          max: 60
        }

      },

      audio: false
    };


    stream =
      await navigator.mediaDevices
        .getUserMedia(constraints);


    video.srcObject = stream;

    await video.play();


    /*
     * Información real de la cámara.
     */

    const track =
      stream.getVideoTracks()[0];

    if (track) {

      const settings =
        track.getSettings();

      console.log(
        "Cámara:",
        settings.width,
        "x",
        settings.height
      );

      console.log(
        "Relación:",
        settings.aspectRatio
      );
    }


    /*
     * Intentamos mantener el video
     * en formato vertical.
     */

    video.style.transform =
      scale(${zoomActual});

  } catch (error) {

    console.error(
      "Error cámara vertical:",
      error
    );


    /*
     * Segundo intento para dispositivos
     * que no acepten aspectRatio.
     */

    try {

      stream =
        await navigator.mediaDevices
          .getUserMedia({

            video: {

              facingMode:
                usandoFrontal
                  ? "user"
                  : "environment",

              width: {
                ideal: 2160
              },

              height: {
                ideal: 3840
              }

            },

            audio: false

          });


      video.srcObject =
        stream;

      await video.play();


      const track =
        stream.getVideoTracks()[0];

      if (track) {

        const settings =
          track.getSettings();

        console.log(
          "Resolución alternativa:",
          settings.width,
          "x",
          settings.height
        );
      }

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


    /*
     * IMPORTANTE:
     *
     * No vamos a convertir una imagen
     * horizontal en vertical mediante un
     * recorte.
     *
     * Utilizamos exactamente la relación
     * que está entregando la cámara.
     */

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
     * La imagen se captura exactamente
     * como aparece en el video.
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


    ctx.drawImage(
      video,
      0,
      0,
      ancho,
      alto
    );


    /*
     * Cargar el marco.
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


      /*
       * El marco se adapta exactamente
       * a la misma proporción de la foto.
       */

      ctx.drawImage(
        marco,
        0,
        0,
        ancho,
        alto
      );


      /*
       * PNG sin compresión JPEG.
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
       * Detener cámara.
       */

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
