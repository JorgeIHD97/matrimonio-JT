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
     * IMPORTANTE:
     *
     * No imponemos 1080 x 1920.
     * No imponemos 9:16.
     *
     * Pedimos una resolución alta y dejamos
     * que el dispositivo entregue la máxima
     * que pueda proporcionar.
     */

    stream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode:
            usandoFrontal
              ? "user"
              : "environment",

          width: {
            ideal: 4096
          },

          height: {
            ideal: 4096
          }

        },

        audio: false

      });


    video.srcObject =
      stream;
     if (usandoFrontal) {
        video.classList.add ("selfie");
     } else
        video.classList.remove ("selfie")
  }


    /*
     * Esperamos a que Safari/Chrome conozca
     * las dimensiones reales del vídeo.
     */

    await video.play();


    /*
     * Información de diagnóstico.
     *
     * No aparece en pantalla.
     * Nos permitirá saber exactamente
     * qué resolución está entregando
     * el teléfono.
     */

    console.log(
      "Resolución real:",
      video.videoWidth,
      "x",
      video.videoHeight
    );


    const track =
      stream.getVideoTracks()[0];


    if (track) {

      console.log(
        "Configuración real:",
        track.getSettings()
      );


      if (
        track.getCapabilities
      ) {

        console.log(
          "Capacidades de cámara:",
          track.getCapabilities()
        );

      }

    }


  } catch (error) {

    console.error(
      "Error de cámara:",
      error
    );

    alert(
      "No pudimos acceder a la cámara. " +
      "Por favor permite el acceso a la cámara " +
      "e inténtalo nuevamente."
    );

  }

}


/* =====================================================
   ABRIR CÁMARA
===================================================== */

abrirCamara.addEventListener(
  "click",
  async () => {

    inicio.classList.add(
      "oculto"
    );

    camara.classList.remove(
      "oculto"
    );

    usandoFrontal =
      false;

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
   ENFOQUE POR TOQUE
===================================================== */

async function enfocarEnPunto(
  clientX,
  clientY
) {

  const track =
    stream?.getVideoTracks()[0];


  if (!track) {
    return;
  }


  /*
   * Si el navegador no ofrece getCapabilities
   * no podemos controlar el enfoque manualmente.
   */

  if (
    !track.getCapabilities ||
    !track.applyConstraints
  ) {

    console.log(
      "El navegador no permite controlar el enfoque."
    );

    return;

  }


  const capabilities =
    track.getCapabilities();


  /*
   * Coordenadas del vídeo en pantalla.
   */

  const rect =
    video.getBoundingClientRect();


  let x =
    (
      clientX -
      rect.left
    ) / rect.width;


  let y =
    (
      clientY -
      rect.top
    ) / rect.height;


  /*
   * Limitar entre 0 y 1.
   */

  x =
    Math.max(
      0,
      Math.min(
        1,
        x
      )
    );


  y =
    Math.max(
      0,
      Math.min(
        1,
        y
      )
    );


  /*
   * Comprobar qué capacidades de enfoque
   * expone realmente el dispositivo.
   */

  console.log(
    "Capacidades de enfoque:",
    {
      focusMode:
        capabilities.focusMode,

      pointsOfInterest:
        capabilities.pointsOfInterest,

      focusDistance:
        capabilities.focusDistance
    }
  );


  const advanced = {};


  /*
   * Enfoque automático de una sola toma.
   */

  if (
    capabilities.focusMode &&
    capabilities.focusMode.includes(
      "single-shot"
    )
  ) {

    advanced.focusMode =
      "single-shot";

  }


  /*
   * Punto específico de enfoque.
   */

  if (
    capabilities.pointsOfInterest
  ) {

    advanced.pointsOfInterest = [

      {
        x: x,
        y: y
      }

    ];

  }


  /*
   * Si el navegador no ofrece ninguna
   * capacidad relacionada con enfoque,
   * no intentamos inventarla.
   */

  if (
    Object.keys(
      advanced
    ).length === 0
  ) {

    console.log(
      "Este navegador/dispositivo no expone enfoque por punto."
    );

    return;

  }


  try {

    await track.applyConstraints({

      advanced: [
        advanced
      ]

    });


    console.log(
      "Enfoque solicitado en:",
      x,
      y
    );


  } catch (error) {

    console.log(
      "No fue posible aplicar el enfoque:",
      error
    );

  }

}


/* =====================================================
   DETECTAR TOQUE SOBRE LA CÁMARA
===================================================== */

video.addEventListener(
  "click",
  async event => {

    await enfocarEnPunto(
      event.clientX,
      event.clientY
    );

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
     * TAMAÑO FINAL
     * =================================================
     *
     * El marco actual es 1080 x 1920.
     *
     * La foto final conserva ese formato.
     */

    const anchoFinal =
      1080;

    const altoFinal =
      1920;


    const canvas =
      document.createElement(
        "canvas"
      );


    canvas.width =
      anchoFinal;

    canvas.height =
      altoFinal;


    const ctx =
      canvas.getContext(
        "2d"
      );


    const videoAncho =
      video.videoWidth;

    const videoAlto =
      video.videoHeight;


    /*
     * =================================================
     * RELACIONES DE ASPECTO
     * =================================================
     */

    const relacionObjetivo =
      anchoFinal /
      altoFinal;


    const relacionVideo =
      videoAncho /
      videoAlto;


    /*
     * Área que vamos a utilizar de la cámara.
     */

    let sx = 0;
    let sy = 0;

    let sw =
      videoAncho;

    let sh =
      videoAlto;


    /*
     * =================================================
     * REGLA PRINCIPAL
     *
     * CONSERVAR TODO EL ALTO.
     *
     * Si sobra anchura:
     * cortar únicamente los lados.
     * =================================================
     */

    if (
      relacionVideo >
      relacionObjetivo
    ) {

      /*
       * El vídeo es más ancho que el marco.
       *
       * Conservamos el 100 % de su altura.
       */

      sh =
        videoAlto;


      sw =
        videoAlto *
        relacionObjetivo;


      /*
       * Recorte perfectamente centrado.
       */

      sx =
        (
          videoAncho -
          sw
        ) / 2;


      sy = 0;


    } else {

      /*
       * Si por alguna razón el vídeo es
       * más estrecho que 9:16, no vamos
       * a hacer zoom artificial.
       *
       * Conservamos toda la anchura.
       */

      sw =
        videoAncho;


      sh =
        videoAncho /
        relacionObjetivo;


      sx = 0;

      sy =
        (
          videoAlto -
          sh
        ) / 2;

    }


    /*
     * =================================================
     * DIBUJAR CÁMARA
     * =================================================
     */

    if (usandoFrontal) {

      /*
       * Cámara frontal:
       * mantenemos el comportamiento espejo
       * que ya tenía tu versión original.
       */

      ctx.save();

      ctx.translate(
        anchoFinal,
        0
      );

      ctx.scale(
        -1,
        1
      );


      ctx.drawImage(

        video,

        sx,
        sy,
        sw,
        sh,

        0,
        0,
        anchoFinal,
        altoFinal

      );


      ctx.restore();


    } else {

      /*
       * Cámara trasera:
       * sin espejo.
       */

      ctx.drawImage(

        video,

        sx,
        sy,
        sw,
        sh,

        0,
        0,
        anchoFinal,
        altoFinal

      );

    }


    /*
     * =================================================
     * MARCO
     * =================================================
     */

    const imagenMarco =
      new Image();


    imagenMarco.onload =
      () => {

        ctx.drawImage(

          imagenMarco,

          0,
          0,
          anchoFinal,
          altoFinal

        );


        /*
         * PNG FINAL
         */

        const imagen =
          canvas.toDataURL(
            "image/png",
            1.0
          );


        fotoFinal.src =
          imagen;


        descargar.href =
          imagen;


        /*
         * Mostrar resultado.
         */

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
              track =>
                track.stop()
            );

          stream =
            null;

        }

      };


    imagenMarco.src =
      "marco.png";

  }
);


/* =====================================================
   TOMAR OTRA FOTO
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
            type:
              "image/png"
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
          "Tu navegador no permite compartir directamente. " +
          "Puedes utilizar GUARDAR FOTO."
        );

      }


    } catch (error) {

      console.error(
        "Error al compartir:",
        error
      );

    }

  }
);
