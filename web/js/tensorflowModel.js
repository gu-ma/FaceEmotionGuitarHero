console.log('write tf/model in console');
const pathname = window.location.pathname; // Returns path only (/path/example.html)
const url = window.location.href; // Returns full URL (https://example.com/path/example.html)
const origin = window.location.origin; // Returns base URL (https://example.com)

let model;
const MODEL_PATH = url+ 'models/TF.js/faceEmotionWeights/model.json';
let IMAGE_SIZE = 48;

let predictionsElement = document.getElementById("predictions");
let statusElement = document.getElementById("status");
const status = msg => (statusElement.innerText = msg);

const MODEL_PROMISE = async () => {
  status("Loading model...");
  model = await tf.loadModel(MODEL_PATH);
  status("Model loaded");
};

async function predict(imgElement) {
  status("Predicting...");
  const startTime = performance.now();
  const logits = tf.tidy(() => {
    // tf.fromPixels() returns a Tensor from an image element.
    const img = tf.fromPixels(imgElement).toFloat();
    let gray_img = img.mean(2);
    let final_img = gray_img.expandDims(2);

    // Is it needed ?
    // const offset = tf.scalar(127.5);
    // // Normalize the image from [0, 255] to [-1, 1].
    // const normalized = final_img.sub(offset).div(offset);

    // Reshape to a single-element batch so we can pass it to predict.
    const batched = final_img.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 1]);
    // Make a prediction through mobilenet.
    return model.predict(batched);
  });
  // Shoe inference time
  const totalTime = performance.now() - startTime;
  status(`Done in ${Math.floor(totalTime)}ms`);
  // Show the classes in the DOM.
  showResults(imgElement, logits);
}

function showResults(imgElement, logits) {
  const predictionContainer = document.createElement("div");
  predictionContainer.className = "pred-container";
  //
  const probsContainer = document.createElement("div");
  probsContainer.innerText = "class: " + logits.as1D().argMax().dataSync();
  predictionContainer.appendChild(probsContainer);
  //
  const imgContainer = document.createElement("div");
  imgContainer.appendChild(imgElement);
  predictionContainer.appendChild(imgContainer);
  //
  predictionsElement.insertBefore(
    predictionContainer,
    predictionsElement.firstChild
  );
}

const filesElement = document.getElementById("files");
filesElement.addEventListener("change", evt => {
  let files = evt.target.files;
  // Display thumbnails & issue call to predict each image.
  for (let i = 0, f;
    (f = files[i]); i++) {
    // Only process image files (skip non image files)
    if (!f.type.match("image.*")) {
      continue;
    }
    let reader = new FileReader();
    const idx = i;
    // Closure to capture the file information.
    reader.onload = e => {
      // Fill the image & call predict.
      let img = document.createElement("img");
      img.src = e.target.result;
      img.width = IMAGE_SIZE;
      img.height = IMAGE_SIZE;
      img.onload = () => predict(img);
    };
    // Read in the image file as a data URL.
    reader.readAsDataURL(f);
  }
});


MODEL_PROMISE();
