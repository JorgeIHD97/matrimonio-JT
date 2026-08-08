/* =====================================================
   ELEMENTOS
===================================================== */

const inicio =
  document.getElementById("inicio");

const camara =
  document.getElementById("camara");

const resultado =
  document.getElementById("resultado");

const abrirCamara =
  document.getElementById("abrirCamara");

const cambiarCamara =
  document.getElementById("cambiarCamara");

const tomarFoto =
  document.getElementById("tomarFoto");

const otraFoto =
  document.getElementById("otraFoto");

const video =
  document.getElementById("video");

const marco =
  document.getElementById("marco");

const fotoFinal =
  document.getElementById("fotoFinal");

const descargar =
  document.getElementById("descargar");

const compartir =
  document.getElementById("compartir");

const zoom05 =
  document.getElementById("zoom05");

const zoom1 =
  document.getElementById("zoom1");

const zoom2 =
  document.getElementById("zoom2");

const zoomSlider =
  document.getElementById("zoomSlider");

const puntoEnfoque =
  document.getElementById("puntoEnfoque");


/* =====================================================
   VARIABLES
===================================================== */

let stream = null;

let usandoFrontal = false;

let zoomActual = 1;

let zoomRealDisponible = false;


/* =====================================================
   OBTENER TRACK
===================================================== */

function obtenerTrack() {

  if (!stream) {
    return null;
  }

  const tracks =
    stream.getVideoTracks();

  if (!tracks.length) {
    return null;
  }

  return tracks[0];
}


/* =====================================================
   MOSTRAR PUNTO DE ENFOQUE
===================================================== */

function mostrarPuntoEnfoque(
  x,
  y
) {

  puntoEnfoque.style.left =
    ${x}px;

  puntoEnfoque.style.top =
    ${y}px;

  puntoEnfoque.classList.add(
    "visible"
  );

  clearTimeout(
    puntoEnfoque._timer
  );

  puntoEnfoque._timer =
    setTimeout(
      () => {

        puntoEnfoque.classList.remove(
          "visible"
        );

      },
      1500
    );
}


/* =====================================================
   ENFOQUE POR TOQUE
===================================================== */

async function enfocar(
  clientX,
  clientY
) {

  const track =
    obtenerTrack();

  if (!track) {
    return;
  }

  const rect =
    video.getBoundingClientRect();

  const x =
    clientX -
    rect.left;

  const y =
    clientY -
    rect.top;

  mostrarPuntoEnfoque(
    x,
    y
  );


  /*
   * Coordenadas normalizadas.
   */

  const puntoX =
    Math.max(
      0,
      Math.min(
        1,
        x / rect.width
      )
    );

  const puntoY =
    Math.max(
      0,
      Math.min(
        1,
        y / rect.height
      )
    );


  if (
    !track.getCapabilities ||
    !track.applyConstraints
  ) {
    return;
  }


  let capabilities;

  try {

    capabilities =
      track.getCapabilities();

  } catch {
    return;
  }


  const advanced = {};


  /*
   * Punto de interés.
   */

  if (
    capabilities.pointsOfInterest
  ) {

    advanced.pointsOfInterest = [

      {
        x: puntoX,
        y: puntoY
      }

    ];

  }


  /*
   * Autofocus.
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


  if (
    Object.keys(
      advanced
    ).length === 0
  ) {
    return;
  }


  try {

    await track.applyConstraints({

      advanced: [
        advanced
      ]

    });

  } catch (error) {

    console.log(
      "Enfoque no disponible:",
      error
    );

  }
}


/* =====================================================
   EVENTO DE TOQUE
===================================================== */

video.addEventListener(
  "click",
  async event => {

    await enfocar(
      event.clientX,
      event.clientY
    );

  }
);


/* =====================================================
   ZOOM REAL
===================================================== */

async function aplicarZoomReal(
  valor
) {

  const track =
    obtenerTrack();

  if (!track) {
    return false;
  }

  if (
    !track.getCapabilities ||
    !track.applyConstraints
  ) {

    return false;

  }


  let capabilities;

  try {

    capabilities =
      track.getCapabilities();

  } catch {

    return false;

  }


  if (!capabilities.zoom) {
    return false;
  }


  let zoom =
    Number(valor);


  const minimo =
    Number(
      capabilities.zoom.min
    );

  const maximo =
    Number(
      capabilities.zoom.max
    );


  zoom =
    Math.max(
      minimo,
      Math.min(
        maximo,
        zoom
      )
    );


  try {

    await track.applyConstraints({

      advanced: [
        {
          zoom: zoom
        }
      ]

    });

    zoomRealDisponible =
      true;

    return true;

  } catch {

    zoomRealDisponible =
      false;

    return false;

  }
}


/* =====================================================
   ZOOM VISUAL
===================================================== */

function aplicarZoomVisual() {

  /*
   * Solamente usamos zoom CSS como respaldo
   * cuando la cámara no permite zoom real.
   */

  if (
    zoomRealDisponible
  ) {

    video.style.transform =
      "none";

    return;

  }


  if (
    zoomActual <= 1
  ) {

    video.style.transform =
      "none";

    return;

  }


  video.style.transform =
    scale(${zoomActual});
}


/* =====================================================
   CAMBIAR ZOOM
===================================================== */

async function cambiarZoom(
  valor
) {

  zoomActual =
    Number(valor);


  zoom05.classList.toggle(
    "activo",
    zoomActual === 0.5
  );

  zoom1.classList.toggle(
    "activo",
    zoomActual === 1
  );

  zoom2.classList.toggle(
    "activo",
    zoomActual === 2
  );


  zoomSlider.value =
    zoomActual;


  const zoomReal =
    await aplicarZoomReal(
      zoomActual
    );


  if (!zoomReal) {

    zoomRealDisponible =
      false;

    aplicarZoomVisual();

  } else {

    video.style.transform =
      "none";

  }
}


/* =====================================================
   BOTONES ZOOM
===================================================== */

zoom05.addEventListener(
  "click",
  () => cambiarZoom(0.5)
);

zoom1.addEventListener(
  "click",
  () => cambiarZoom(1)
);

zoom2.addEventListener(
  "click",
  () => cambiarZoom(2)
);


zoomSlider.addEventListener(
  "input",
  () => {

    cambiarZoom(
      Number(
        zoomSlider.value
      )
    );

  }
);


/* =====================================================
   INICIAR CÁMARA
===================================================== */

async function iniciarCamara() {

  /*
   * Detener cámara anterior.
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


  zoomActual = 1;

  zoomRealDisponible =
    false;

  video.style.transform =
    "none";


  try {

    /*
     * No imponemos 9:16.
     *
     * No imponemos 1920x1080.
     *
     * Pedimos una resolución alta y dejamos
     * que el dispositivo entregue la que pueda.
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


    await video.play();


    /*
     * Restablecer controles.
     */

    zoomSlider.value =
      1;

    zoom05.classList.remove(
      "activo"
    );

    zoom1.classList.add(
      "activo"
    );

    zoom2.classList.remove(
      "activo"
    );


    /*
     * Datos de diagnóstico en consola.
     * No aparecen en pantalla.
     */

    console.log(
      "Resolución de video:",
      video.videoWidth,
      "x",
      video.videoHeight
    );


    const track =
      obtenerTrack();


    if (track) {

      console.log(
        "Configuración:",
        track.getSettings()
      );

      if (
        track.getCapabilities
      ) {

        console.log(
          "Capacidades:",
          track.getCapabilities()
        );

      }

    }

  } catch (error) {

    console.error(
      "Error al abrir la cámara:",
      error
    );

    alert(
      "No se pudo abrir la cámara. " +
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
     * FORMATO FINAL
     *
     * 9:16
     * =================================================
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


    const anchoVideo =
      video.videoWidth;

    const altoVideo =
      video.videoHeight;


    /*
     * =================================================
     * ENCUADRE
     *
     * Queremos conservar TODO EL ALTO.
     *
     * Si la relación de aspecto de la cámara
     * es diferente a 9:16, recortamos únicamente
     * los laterales.
     * =================================================
     */

    const relacionFinal =
      anchoFinal /
      altoFinal;


    const relacionVideo =
      anchoVideo /
      altoVideo;


    let sx = 0;
    let sy = 0;

    let sw =
      anchoVideo;

    let sh =
      altoVideo;


    if (
      relacionVideo >
      relacionFinal
    ) {

      /*
       * El video es más ancho.
       *
       * Conservamos TODO el alto.
       *
       * Recortamos solamente los lados.
       */

      sw =
        altoVideo *
        relacionFinal;

      sx =
        (
          anchoVideo -
          sw
        ) / 2;

    } else {

      /*
       * El video es más estrecho.
       *
       * En este caso necesitamos utilizar
       * toda la imagen vertical disponible.
       */

      sh =
        anchoVideo /
        relacionFinal;

      sy =
        (
          altoVideo -
          sh
        ) / 2;

    }


    /*
     * =================================================
     * DIBUJAR CÁMARA
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
      anchoFinal,
      altoFinal

    );


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
            "image/png"
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

          stream = null;

        }

      };


    imagenMarco.src =
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
        "Error al compartir:",
        error
      );

    }

  }
);
