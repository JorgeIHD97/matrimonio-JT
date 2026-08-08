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
  /* Detener cámara anterior */
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
     * No imponemos:
     * - resolución
     * - aspectRatio
     * - zoom
     * - frameRate
     *
     * Dejamos que iOS/Safari entregue
     * el formato nativo de la cámara.
     */
    const constraints = {
      video: {
        facingMode: usandoFrontal
          ? "user"
          : "environment"
      },
      audio: false
    };
    stream =
      await navigator.mediaDevices
        .getUserMedia(constraints);
    video.srcObject = stream;
    /*
     * MUY IMPORTANTE:
     *
     * Nunca espejamos la cámara.
     *
     * Tanto la trasera como la selfie
     * se muestran tal cual las entrega
     * el dispositivo.
     */
    video.style.transform = "none";
    await video.play();
    /*
     * Intentar colocar el zoom físico/digital
     * del track en 1 si Safari lo expone.
     *
     * Si el iPhone no permite modificarlo,
     * simplemente continúa sin error.
     */
    const track =
      stream.getVideoTracks()[0];
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
            "El dispositivo no permite modificar el zoom."
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
      "Verifica que Safari tenga permiso para utilizarla."
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
    usandoFrontal =
      !usandoFrontal;
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
     * Utilizamos EXACTAMENTE la resolución
     * que está entregando el video.
     */
    const ancho =
      video.videoWidth;
    const alto =
      video.videoHeight;
    const canvas =
      document.createElement("canvas");
    canvas.width =
      ancho;
    canvas.height =
      alto;
    const ctx =
      canvas.getContext("2d");
    /*
     * NO hacemos:
     *
     * scale(-1,1)
     *
     * La selfie NO debe quedar reflejada.
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
      /*
       * El marco utiliza exactamente
       * las mismas dimensiones de la foto.
       */
      ctx.drawImage(
        marco,
        0,
        0,
        ancho,
        alto
      );
      /*
       * PNG para conservar la máxima
       * calidad posible.
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
          .forEach(track => track.stop());
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
