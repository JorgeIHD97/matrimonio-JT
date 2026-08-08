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


/* =========================
   INICIAR CÁMARA
========================= */

async function iniciarCamara() {

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  try {

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: usandoFrontal ? "user" : "environment",
        width: {
          ideal: 9999
        },
        height: {
          ideal: 9999
        }
      },
      audio: false
    });

    video.srcObject = stream;

    await video.play();

    const track = stream.getVideoTracks()[0];

    if (track) {
      console.log(
        "Resolución:",
        track.getSettings().width,
        "x",
        track.getSettings().height
      );
    }

  } catch (error) {

    console.error(error);

    alert(
      "No pudimos acceder a la cámara. " +
      "Verifica que hayas permitido el acceso a la cámara."
    );
  }
}


/* =========================
   ABRIR CÁMARA
========================= */

abrirCamara.addEventListener("click", async () => {

  inicio.classList.add("oculto");
  camara.classList.remove("oculto");

  await iniciarCamara();

});


/* =========================
   CAMBIAR CÁMARA
========================= */

cambiarCamara.addEventListener("click", async () => {

  usandoFrontal = !usandoFrontal;

  await iniciarCamara();

});


/* =========================
   TOMAR FOTO
========================= */

tomarFoto.addEventListener("click", () => {

  if (!video.videoWidth) {
    return;
  }

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  const proporcion = 9 / 16;

  let ancho;
  let alto;

  if (videoWidth / videoHeight > proporcion) {

    alto = videoHeight;
    ancho = Math.round(alto * proporcion);

  } else {

    ancho = videoWidth;
    alto = Math.round(ancho / proporcion);
  }

  const canvas = document.createElement("canvas");

  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");

  const sx = (videoWidth - ancho) / 2;
  const sy = (videoHeight - alto) / 2;


  if (usandoFrontal) {

    ctx.translate(ancho, 0);
    ctx.scale(-1, 1);

  }

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


  /* =========================
     AGREGAR MARCO
  ========================= */

  const marco = new Image();

  marco.onload = () => {

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.drawImage(
      marco,
      0,
      0,
      ancho,
      alto
    );

    const imagen = canvas.toDataURL(
      "image/png"
    );

    fotoFinal.src = imagen;

    descargar.href = imagen;

    camara.classList.add("oculto");
    resultado.classList.remove("oculto");


    if (stream) {

      stream
        .getTracks()
        .forEach(track => track.stop());

      stream = null;
    }

  };

  marco.src = "marco.png";

});


/* =========================
   OTRA FOTO
========================= */

otraFoto.addEventListener("click", async () => {

  resultado.classList.add("oculto");
  camara.classList.remove("oculto");

  await iniciarCamara();

});


/* =========================
   COMPARTIR
========================= */

compartir.addEventListener("click", async () => {

  try {

    const respuesta =
      await fetch(fotoFinal.src);

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

});
