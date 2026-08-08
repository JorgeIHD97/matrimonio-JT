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

let puntoEnfoque = null;
let enfoqueDisponible = false;


/* =====================================================
   CREAR INDICADOR DE ENFOQUE
===================================================== */

const indicadorEnfoque =
  document.createElement("div");

indicadorEnfoque.id =
  "indicadorEnfoque";

indicadorEnfoque.style.position =
  "absolute";

indicadorEnfoque.style.width =
  "70px";

indicadorEnfoque.style.height =
  "70px";

indicadorEnfoque.style.border =
  "2px solid #ffffff";

indicadorEnfoque.style.borderRadius =
  "50%";

indicadorEnfoque.style.boxSizing =
  "border-box";

indicadorEnfoque.style.pointerEvents =
  "none";

indicadorEnfoque.style.display =
  "none";

indicadorEnfoque.style.zIndex =
  "20";

indicadorEnfoque.style.transform =
  "translate(-50%, -50%)";

indicadorEnfoque.style.transition =
  "opacity .2s ease";

const visor =
  document.querySelector(".visor");

if (visor) {
  visor.appendChild(
    indicadorEnfoque
  );
}


/* =====================================================
   ACTUALIZAR INDICADOR DE ENFOQUE
===================================================== */

function mostrarIndicadorEnfoque(
  x,
  y
) {

  if (!indicadorEnfoque) {
    return;
  }

  indicadorEnfoque.style.left =
    ${x}px;

  indicadorEnfoque.style.top =
    ${y}px;

  indicadorEnfoque.style.display =
    "block";

  indicadorEnfoque.style.opacity =
    "1";

  clearTimeout(
    indicadorEnfoque._timer
  );

  indicadorEnfoque._timer =
    setTimeout(() => {

      indicadorEnfoque.style.opacity =
        "0";

    }, 1400);

}


/* =====================================================
   OBTENER TRACK ACTUAL
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
   ACTUALIZAR BOTONES DE ZOOM
===================================================== */

function actualizarBotonesZoom() {

  if (zoom05) {

    zoom05.classList.toggle(
      "activo",
      Math.abs(zoomActual - 0.5) < 0.01
    );

  }

  if (zoom1) {

    zoom1.classList.toggle(
      "activo",
      Math.abs(zoomActual - 1) < 0.01
    );

  }

  if (zoom2) {

    zoom2.classList.toggle(
      "activo",
      Math.abs(zoomActual - 2) < 0.01
    );

  }

  if (zoomSlider) {

    zoomSlider.value =
      zoomActual;

  }

}


/* =====================================================
   ZOOM VISUAL
===================================================== */

function aplicarZoomVisual() {

  /*
   * El video permanece centrado.
   *
   * El zoom se aplica solamente cuando
   * el zoom real de la cámara no está disponible.
   */

  if (!video) {
    return;
  }

  if (zoomRealDisponible) {

    video.style.transform =
      "none";

    return;

  }

  /*
   * Para valores inferiores a 1 no podemos
   * crear información que el lente no capturó.
   *
   * Por eso 0.5x se mantiene como solicitud
   * de lente/zoom real y no como reducción
   * artificial del video.
   */

  if (zoomActual < 1) {

    video.style.transform =
      "none";

    return;

  }

  video.style.transform =
    scale(${zoomActual});

}


/* =====================================================
   APLICAR ZOOM REAL DE LA CÁMARA
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

  } catch (error) {

    console.log(
      "No se pudieron obtener las capacidades de la cámara.",
      error
    );

    return false;

  }

  if (
    !capabilities ||
    !capabilities.zoom
  ) {

    return false;

  }

  const minimo =
    Number(capabilities.zoom.min);

  const maximo =
    Number(capabilities.zoom.max);

  const paso =
    capabilities.zoom.step
      ? Number(capabilities.zoom.step)
      : 0.01;

  if (
    !Number.isFinite(minimo) ||
    !Number.isFinite(maximo)
  ) {

    return false;

  }

  /*
   * Limitamos el valor al rango real
   * que permite la cámara.
   */

  let valorReal =
    Math.max(
      minimo,
      Math.min(
        maximo,
        valor
      )
    );

  /*
   * Ajustamos al paso de la cámara.
   */

  if (
    Number.isFinite(paso) &&
    paso > 0
  ) {

    valorReal =
      Math.round(
        valorReal / paso
      ) * paso;

  }

  try {

    await track.applyConstraints({

      advanced: [
        {
          zoom: valorReal
        }
      ]

    });

    zoomRealDisponible =
      true;

    return true;

  } catch (error) {

    console.log(
      "No se pudo aplicar zoom real:",
      error
    );

    zoomRealDisponible =
      false;

    return false;

  }

}


/* =====================================================
   CAMBIAR ZOOM
===================================================== */

async function cambiarZoom(
  valor
) {

  zoomActual =
    Number(valor);

  actualizarBotonesZoom();

  /*
   * Primero intentamos usar el zoom físico
   * que Safari pueda exponer.
   */

  const aplicado =
    await aplicarZoomReal(
      zoomActual
    );

  if (!aplicado) {

    zoomRealDisponible =
      false;

    aplicarZoomVisual();

  } else {

    /*
     * Si la cámara acepta zoom real,
     * no aplicamos zoom CSS.
     */

    video.style.transform =
      "none";

  }

}


/* =====================================================
   BOTONES DE ZOOM
===================================================== */

if (zoom05) {

  zoom05.addEventListener(
    "click",
    async () => {

      await cambiarZoom(
        0.5
      );

    }
  );

}

if (zoom1) {

  zoom1.addEventListener(
    "click",
    async () => {

      await cambiarZoom(
        1
      );

    }
  );

}

if (zoom2) {

  zoom2.addEventListener(
    "click",
    async () => {

      await cambiarZoom(
        2
      );

    }
  );

}


/* =====================================================
   DESLIZADOR
===================================================== */

if (zoomSlider) {

  zoomSlider.addEventListener(
    "input",
    async () => {

      const valor =
        Number(
          zoomSlider.value
        );

      zoomActual =
        valor;

      actualizarBotonesZoom();

      const aplicado =
        await aplicarZoomReal(
          valor
        );

      if (!aplicado) {

        zoomRealDisponible =
          false;

        aplicarZoomVisual();

      } else {

        video.style.transform =
          "none";

      }

    }
  );

}


/* =====================================================
   ENFOQUE POR TOQUE
===================================================== */

async function enfocarEnPunto(
  x,
  y
) {

  const track =
    obtenerTrack();

  if (!track) {
    return;
  }

  if (
    !track.getCapabilities ||
    !track.applyConstraints
  ) {

    console.log(
      "Safari no expone controles de enfoque."
    );

    return;

  }

  let capabilities;

  try {

    capabilities =
      track.getCapabilities();

  } catch (error) {

    console.log(
      "No se pudieron obtener capacidades de enfoque.",
      error
    );

    return;

  }

  /*
   * Mostramos qué capacidades expone Safari.
   */

  console.log(
    "Capacidades de enfoque:",
    capabilities
  );


  /*
   * Coordenadas normalizadas:
   *
   * 0 = izquierda / arriba
   * 1 = derecha / abajo
   */

  const rect =
    video.getBoundingClientRect();

  let xNormalizado =
    (x - rect.left) /
    rect.width;

  let yNormalizado =
    (y - rect.top) /
    rect.height;


  xNormalizado =
    Math.max(
      0,
      Math.min(
        1,
        xNormalizado
      )
    );

  yNormalizado =
    Math.max(
      0,
      Math.min(
        1,
        yNormalizado
      )
    );


  /*
   * Guardamos el punto.
   */

  puntoEnfoque = {

    x:
      xNormalizado,

    y:
      yNormalizado

  };


  /*
   * Intentamos aplicar focusMode.
   */

  const constraints =
    {};


  if (
    capabilities.focusMode &&
    capabilities.focusMode.includes(
      "single-shot"
    )
  ) {

    constraints.focusMode =
      "single-shot";

    enfoqueDisponible =
      true;

  }


  /*
   * Intentamos utilizar pointsOfInterest.
   */

  if (
    capabilities.pointsOfInterest
  ) {

    constraints.pointsOfInterest = [

      {
        x:
          xNormalizado,

        y:
          yNormalizado

      }

    ];

    enfoqueDisponible =
      true;

  }


  /*
   * Si Safari expone focusDistance,
   * intentamos llevarlo a un valor automático.
   */

  if (
    capabilities.focusDistance
  ) {

    const minimo =
      Number(
        capabilities.focusDistance.min
      );

    const maximo =
      Number(
        capabilities.focusDistance.max
      );

    if (
      Number.isFinite(minimo) &&
      Number.isFinite(maximo)
    ) {

      constraints.focusDistance =
        minimo;

    }

  }


  /*
   * Aplicar las restricciones.
   */

  if (
    Object.keys(
      constraints
    ).length
  ) {

    try {

      await track.applyConstraints({
        advanced: [
          constraints
        ]
      });

      console.log(
        "Enfoque solicitado en:",
        puntoEnfoque
      );

    } catch (error) {

      console.log(
        "Safari no permitió mover el enfoque:",
        error
      );

    }

  } else {

    console.log(
      "Este iPhone/Safari no expone enfoque por punto."
    );

  }

}


/* =====================================================
   DETECTAR TOQUE EN LA CÁMARA
===================================================== */

if (video) {

  video.addEventListener(
    "click",
    async (evento) => {

      const rect =
        video.getBoundingClientRect();

      const x =
        evento.clientX -
        rect.left;

      const y =
        evento.clientY -
        rect.top;


      /*
       * Mostrar inmediatamente el cuadro.
       */

      mostrarIndicadorEnfoque(
        x,
        y
      );


      /*
       * Intentar enfocar.
       */

      await enfocarEnPunto(
        evento.clientX,
        evento.clientY
      );

    }
  );


  /*
   * También permitimos toque en dispositivos
   * donde click tenga retraso.
   */

  video.addEventListener(
    "touchend",
    async (evento) => {

      if (
        evento.changedTouches.length !== 1
      ) {

        return;

      }

      const toque =
        evento.changedTouches[0];

      const rect =
        video.getBoundingClientRect();

      const x =
        toque.clientX -
        rect.left;

      const y =
        toque.clientY -
        rect.top;


      mostrarIndicadorEnfoque(
        x,
        y
      );


      await enfocarEnPunto(
        toque.clientX,
        toque.clientY
      );

    },
    {
      passive: true
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
        track =>
          track.stop()
      );

    stream =
      null;

  }


  zoomRealDisponible =
    false;

  enfoqueDisponible =
    false;

  puntoEnfoque =
    null;

  zoomActual =
    1;


  try {

    /*
     * IMPORTANTE:
     *
     * NO forzamos 9:16.
     *
     * NO usamos aspectRatio.
     *
     * NO pedimos un recorte específico.
     *
     * Queremos que Safari entregue
     * el campo de visión nativo.
     */

    stream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode:
            usandoFrontal
              ? "user"
              : "environment",

          width: {
            ideal: 1920
          },

          height: {
            ideal: 1080
          }

        },

        audio: false

      });


    video.srcObject =
      stream;


    video.style.transform =
      "none";


    await video.play();


    /*
     * Información real de la cámara.
     */

    console.log(
      "================================="
    );

    console.log(
      "RESOLUCIÓN REAL:"
    );

    console.log(
      video.videoWidth,
      "x",
      video.videoHeight
    );


    const track =
      obtenerTrack();


    if (track) {

      console.log(
        "CONFIGURACIÓN REAL:",
        track.getSettings()
      );


      if (
        track.getCapabilities
      ) {

        console.log(
          "CAPACIDADES:",
          track.getCapabilities()
        );

      }

    }


    actualizarBotonesZoom();

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
     * TAMAÑO DEL MARCO
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
     * DIMENSIONES REALES
     * =================================================
     */

    const videoAncho =
      video.videoWidth;

    const videoAlto =
      video.videoHeight;


    /*
     * =================================================
     * DETERMINAR ORIENTACIÓN
     * =================================================
     */

    const horizontal =
      videoAncho >
      videoAlto;


    /*
     * =================================================
     * FACTOR DE ZOOM
     * =================================================
     */

    let factorZoom =
      zoomActual;

    if (
      !Number.isFinite(
        factorZoom
      )
    ) {

      factorZoom =
        1;

    }


    /*
     * El 0.5x óptico real no puede
     * fabricarse mediante canvas.
     *
     * Si Safari no ofrece el lente ultra
     * gran angular, mantenemos 1x.
     */

    if (
      factorZoom <
      1
    ) {

      factorZoom =
        1;

    }


    /*
     * =================================================
     * CÁMARA HORIZONTAL
     *
     * Safari suele entregar la cámara trasera
     * como 1920x1080 aunque el teléfono esté
     * físicamente en vertical.
     *
     * Giramos la imagen 90°.
     * =================================================
     */

    if (horizontal) {

      /*
       * Guardar estado del canvas.
       */

      ctx.save();


      /*
       * Girar 90 grados.
       */

      ctx.translate(
        destinoAncho,
        0
      );

      ctx.rotate(
        Math.PI / 2
      );


      /*
       * Área de origen.
       *
       * A 1x usamos TODO el video.
       *
       * A 2x hacemos un recorte central.
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


      /*
       * Después de girar:
       *
       * videoAncho x videoAlto
       *
       * se convierte visualmente en:
       *
       * videoAlto x videoAncho
       */

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


      ctx.restore();


    } else {

      /*
       * =================================================
       * CÁMARA YA VERTICAL
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


    /*
     * =================================================
     * MARCO
     * =================================================
     */

    const marco =
      new Image();


    marco.onload =
      () => {

        ctx.drawImage(

          marco,

          0,
          0,
          destinoAncho,
          destinoAlto

        );


        /*
         * =================================================
         * CREAR PNG
         * =================================================
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
         * Cambiar a pantalla de resultado.
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
