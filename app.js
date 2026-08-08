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

/* =====================================================
   CONTROLES DE ZOOM
===================================================== */

const zoom05 = document.getElementById("zoom05");
const zoom1 = document.getElementById("zoom1");
const zoom2 = document.getElementById("zoom2");
const zoomSlider = document.getElementById("zoomSlider");

let stream = null;
let usandoFrontal = false;

/*
 * Zoom que estamos mostrando.
 *
 * 1 = normal
 * 2 = acercamiento
 *
 * 0.5 intenta abrir el encuadre.
 */
let zoomActual = 1;


/* =====================================================
   ACTUALIZAR ZOOM VISUAL
===================================================== */

function actualizarZoom() {

  /*
   * El zoom se aplica visualmente al video.
   *
   * No utilizamos zoom digital de Safari porque
   * en iPhone no siempre está disponible.
   */

  video.style.transform =
    scale(${zoomActual});

  /*
   * Actualizar posición del deslizador.
   */
  if (zoomSlider) {
    zoomSlider.value = zoomActual;
  }

  /*
   * Marcar botón activo.
   */
  if (zoom05) {
    zoom05.classList.toggle(
      "activo",
      zoomActual === 0.5
    );
  }

  if (zoom1) {
    zoom1.classList.toggle(
      "activo",
      zoomActual === 1
    );
  }

  if (zoom2) {
    zoom2.classList.toggle(
      "activo",
      zoomActual === 2
    );
  }

}


/* =====================================================
   INTENTAR APLICAR ZOOM REAL DE LA CÁMARA
===================================================== */

async function aplicarZoomCamara(valor) {

  if (!stream) {
    return false;
  }

  const track =
    stream.getVideoTracks()[0];

  if (!track) {
    return false;
  }

  /*
   * Safari/iPhone puede no exponer
   * el control de zoom.
   */

  if (
    !track.getCapabilities ||
    !track.applyConstraints
  ) {
    return false;
  }

  const capabilities =
    track.getCapabilities();

  if (!capabilities.zoom) {
    return false;
  }

  const minimo =
    capabilities.zoom.min;

  const maximo =
    capabilities.zoom.max;

  /*
   * Intentamos convertir nuestro valor
   * 0.5 / 1 / 2 a un valor que acepte
   * realmente la cámara.
   *
   * Para 1x usamos el valor 1 cuando
   * está disponible.
   */

  let zoomReal = valor;

  zoomReal =
    Math.max(
      minimo,
      Math.min(
        maximo,
        zoomReal
      )
    );

  try {

    await track.applyConstraints({
      advanced: [
        {
          zoom: zoomReal
        }
      ]
    });

    return true;

  } catch (error) {

    console.log(
      "La cámara no permite modificar el zoom:",
      error
    );

    return false;

  }

}


/* =====================================================
   CAMBIAR ZOOM
===================================================== */

async function cambiarZoom(valor) {

  zoomActual = valor;

  /*
   * Primero intentamos utilizar el zoom
   * real de la cámara.
   */

  const zoomRealAplicado =
    await aplicarZoomCamara(valor);

  /*
   * Si Safari no permite controlar
   * el zoom real, usamos transformación
   * visual como respaldo.
   *
   * IMPORTANTE:
   * El zoom visual también se tendrá
   * en cuenta al tomar la fotografía.
   */

  if (!zoomRealAplicado) {

    actualizarZoom();

  } else {

    /*
     * Si la cámara sí aceptó el zoom real,
     * no agregamos zoom CSS adicional.
     */

    video.style.transform =
      "none";

    if (zoomSlider) {
      zoomSlider.value =
        zoomActual;
    }

    if (zoom05) {
      zoom05.classList.toggle(
        "activo",
        zoomActual === 0.5
      );
    }

    if (zoom1) {
      zoom1.classList.toggle(
        "activo",
        zoomActual === 1
      );
    }

    if (zoom2) {
      zoom2.classList.toggle(
        "activo",
        zoomActual === 2
      );
    }

  }

}


/* =====================================================
   BOTONES DE ZOOM
===================================================== */

if (zoom05) {

  zoom05.addEventListener(
    "click",
    () => {
      cambiarZoom(0.5);
    }
  );

}

if (zoom1) {

  zoom1.addEventListener(
    "click",
    () => {
      cambiarZoom(1);
    }
  );

}

if (zoom2) {

  zoom2.addEventListener(
    "click",
    () => {
      cambiarZoom(2);
    }
  );

}


/* =====================================================
   DESLIZADOR DE ZOOM
===================================================== */

if (zoomSlider) {

  zoomSlider.addEventListener(
    "input",
    () => {

      const valor =
        parseFloat(
          zoomSlider.value
        );

      cambiarZoom(valor);

    }
  );

}


/* =====================================================
   INICIAR CÁMARA
===================================================== */

async function iniciarCamara() {

  /*
   * Apagar cámara anterior.
   */

  if (stream) {

    stream
      .getTracks()
      .forEach(
        track => track.stop()
      );

    stream = null;

  }


  try {

    /*
     * NO forzamos 9:16.
     *
     * Dejamos que Safari entregue
     * el formato nativo de la cámara.
     *
     * Esto es fundamental para evitar
     * que Safari recorte el campo de visión.
     */

    stream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode:
            usandoFrontal
              ? "user"
              : "environment",

          /*
           * Pedimos una resolución alta,
           * pero NO imponemos relación 9:16.
           */

          width: {
            ideal: 1920
          },

          height: {
            ideal: 1080
          }

        },

        audio: false

      });


    /*
     * Conectar cámara al video.
     */

    video.srcObject =
      stream;


    /*
     * Nunca espejamos la cámara.
     */

    video.style.transform =
      "none";


    /*
     * Esperar a que el video esté listo.
     */

    await video.play();


    /*
     * Mostrar en consola qué resolución
     * está entregando realmente Safari.
     *
     * Esto nos servirá para comprobar
     * si el iPhone entrega 1920x1080,
     * 1280x720, etc.
     */

    console.log(
      "Resolución real del video:",
      video.videoWidth,
      "x",
      video.videoHeight
    );


    const track =
      stream.getVideoTracks()[0];


    if (track) {

      console.log(
        "Configuración real de cámara:",
        track.getSettings()
      );

      if (track.getCapabilities) {

        console.log(
          "Capacidades de cámara:",
          track.getCapabilities()
        );

      }

    }


    /*
     * Comenzar siempre en 1x.
     */

    zoomActual = 1;

    actualizarZoom();

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

    inicio.classList.add(
      "oculto"
    );

    camara.classList.remove(
      "oculto"
    );

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
     * =================================================
     * FOTO FINAL
     *
     * El marco continúa siendo 1080 x 1920.
     * =================================================
     */

    const destinoAncho =
      1080;

    const destinoAlto =
      1920;


    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      destinoAncho;

    canvas.height =
      destinoAlto;


    const ctx =
      canvas.getContext(
        "2d"
      );


    /*
     * =================================================
     * DIMENSIONES REALES DEL VIDEO
     * =================================================
     */

    const videoAncho =
      video.videoWidth;

    const videoAlto =
      video.videoHeight;


    /*
     * =================================================
     * IMPORTANTE
     *
     * Safari normalmente entrega el video
     * de la cámara trasera en formato horizontal
     * aunque el teléfono esté físicamente vertical.
     *
     * Ejemplo:
     *
     * 1920 x 1080
     *
     * Si simplemente recortamos ese video a 9:16,
     * perdemos una enorme cantidad de información
     * de los lados.
     *
     * En lugar de eso:
     *
     * 1. Utilizamos TODO el video.
     * 2. Lo giramos 90 grados.
     * 3. Lo colocamos en 1080 x 1920.
     *
     * De esta manera:
     *
     * 1920 x 1080
     *
     * pasa a:
     *
     * 1080 x 1920
     *
     * sin recortar los lados.
     * =================================================
     */


    const videoEsHorizontal =
      videoAncho >
      videoAlto;


    /*
     * =================================================
     * ZOOM
     *
     * Si el zoom real de la cámara no está disponible,
     * el video puede estar usando el zoom CSS.
     *
     * En ese caso hacemos el mismo zoom directamente
     * sobre el canvas.
     * =================================================
     */

    let factorZoom =
      zoomActual;


    /*
     * Para evitar que un valor inferior a 1
     * produzca un canvas con zonas vacías,
     * el zoom de captura mínimo será 1.
     *
     * El verdadero 0.5x óptico solamente puede
     * conseguirse seleccionando el lente ultra
     * gran angular del iPhone.
     */

    if (factorZoom < 1) {
      factorZoom = 1;
    }


    /*
     * =================================================
     * DIBUJAR VIDEO
     * =================================================
     */

    ctx.save();


    if (videoEsHorizontal) {

      /*
       * Giramos el video horizontal 90°.
       */

      ctx.translate(
        destinoAncho,
        0
      );

      ctx.rotate(
        Math.PI / 2
      );


      /*
       * El canvas temporal después de la rotación
       * tiene dimensiones:
       *
       * 1920 x 1080
       *
       * que se convierten en:
       *
       * 1080 x 1920
       *
       * =================================================
       *
       * Zoom 1x:
       * usamos TODO el video.
       *
       * Zoom 2x:
       * recortamos desde el centro.
       * =================================================
       */

      const anchoRotado =
        videoAlto;

      const altoRotado =
        videoAncho;


      /*
       * Área que tomaremos del video.
       */

      const anchoFuente =
        videoAncho /
        factorZoom;

      const altoFuente =
        videoAlto /
        factorZoom;


      const sx =
        (
          videoAncho -
          anchoFuente
        ) / 2;

      const sy =
        (
          videoAlto -
          altoFuente
        ) / 2;


      ctx.drawImage(

        video,

        sx,
        sy,
        anchoFuente,
        altoFuente,

        0,
        0,
        destinoAlto,
        destinoAncho

      );

    } else {

      /*
       * =================================================
       * SI SAFARI ENTREGA EL VIDEO YA EN VERTICAL
       * =================================================
       */

      const anchoFuente =
        videoAncho /
        factorZoom;

      const altoFuente =
        videoAlto /
        factorZoom;


      const sx =
        (
          videoAncho -
          anchoFuente
        ) / 2;

      const sy =
        (
          videoAlto -
          altoFuente
        ) / 2;


      ctx.drawImage(

        video,

        sx,
        sy,
        anchoFuente,
        altoFuente,

        0,
        0,
        destinoAncho,
        destinoAlto

      );

    }


    ctx.restore();


    /*
     * =================================================
     * CARGAR MARCO
     * =================================================
     */

    const marco =
      new Image();


    marco.onload =
      () => {

        /*
         * El marco es 1080 x 1920.
         */

        ctx.drawImage(

          marco,

          0,
          0,
          destinoAncho,
          destinoAlto

        );


        /*
         * =================================================
         * GENERAR PNG
         * =================================================
         */

        const imagen =
          canvas.toDataURL(
            "image/png"
          );


        /*
         * Mostrar fotografía.
         */

        fotoFinal.src =
          imagen;


        descargar.href =
          imagen;


        /*
         * Cambiar pantalla.
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
