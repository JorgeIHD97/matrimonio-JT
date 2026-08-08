const inicio = document.getElementById("inicio");
const camara = document.getElementById("camara");
const abrirCamara = document.getElementById("abrirCamara");
const video = document.getElementById("video");

let stream = null;
let usandoFrontal = false;

async function iniciarCamara() {

  try {

    if (stream) {

      stream
        .getTracks()
        .forEach(track => track.stop());

      stream = null;
    }

    stream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: usandoFrontal
            ? "user"
            : "environment"
        },

        audio: false

      });

    video.srcObject = stream;

    await video.play();

    console.log(
      "Cámara funcionando:",
      video.videoWidth,
      video.videoHeight
    );

  } catch (error) {

    console.error(
      "ERROR DE CÁMARA:",
      error
    );

    alert(
      "No se pudo abrir la cámara: " +
      error.message
    );

  }

}


abrirCamara.addEventListener(
  "click",
  async () => {

    inicio.classList.add("oculto");

    camara.classList.remove("oculto");

    usandoFrontal = false;

    await iniciarCamara();

  }
);
