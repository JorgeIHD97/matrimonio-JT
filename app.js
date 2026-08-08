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

async function iniciarCamara() {

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  try {

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: usandoFrontal ? "user" : "environment",
        width: {
          ideal: 1080
        },
        height: {
          ideal: 1920
        }
      },
      audio: false
    });

    video.srcObject = stream;

  } catch (error) {

    alert(
      "No pudimos acceder a la cámara. " +
      "Por favor permite el acceso a la cámara e inténtalo nuevamente."
    );

    console.error(error);
  }
}

abrirCamara.addEventListener("click", async () => {

  inicio.classList.add("oculto");
  camara.classList.remove("oculto");

  await iniciarCamara();
});


cambiarCamara.addEventListener("click", async () => {

  usandoFrontal = !usandoFrontal;

  await iniciarCamara();
});


tomarFoto.addEventListener("click", () => {

  if (!video.videoWidth) {
    return;
  }

  const canvas = document.createElement("canvas");

  const ancho = 1080;
  const alto = 1920;

  canvas.width = ancho;
  canvas.height = alto;

  const ctx = canvas.getContext("2d");

  const escala = Math.max(
    ancho / video.videoWidth,
    alto / video.videoHeight
  );

  const nuevoAncho = video.videoWidth * escala;
  const nuevoAlto = video.videoHeight * escala;

  const x = (ancho - nuevoAncho) / 2;
  const y = (alto - nuevoAlto) / 2;

  if (usandoFrontal) {
    ctx.translate(ancho, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(
      video,
      -x,
      y,
      -nuevoAncho,
      nuevoAlto
    );

  } else {

    ctx.drawImage(
      video,
      x,
      y,
      nuevoAncho,
      nuevoAlto
    );
  }

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
      "image/png",
      1.0
    );

    fotoFinal.src = imagen;

    descargar.href = imagen;

    camara.classList.add("oculto");
    resultado.classList.remove("oculto");

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  };

  marco.src = "marco.png";
});


otraFoto.addEventListener("click", async () => {

  resultado.classList.add("oculto");
  camara.classList.remove("oculto");

  await iniciarCamara();
});


compartir.addEventListener("click", async () => {

  try {

    const respuesta = await fetch(fotoFinal.src);
    const blob = await respuesta.blob();

    const archivo = new File(
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
        title: "J & T · 15.08.2026",
        text: "Un recuerdo de nuestro día 🤍"
      });

    } else {

      alert(
        "Tu navegador no permite compartir directamente. " +
        "Puedes utilizar GUARDAR FOTO y luego subirla a Instagram."
      );
    }

  } catch (error) {

    console.error(error);

  }

});
