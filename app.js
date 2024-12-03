const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

let model;
let fistClosed = false;
let screenshotTaken = false;

// Load Handpose Model
async function loadModel() {
  status.textContent = "Loading model...";
  model = await handpose.load();
  status.textContent = "Model loaded. Align your hand in front of the camera.";
  startVideo();
}

// Start video feed
async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.addEventListener("loadeddata", predict);
  } catch (err) {
    console.error("Error accessing webcam:", err);
    status.textContent = "Error accessing webcam. Please allow camera access.";
  }
}

// Predict hand gesture
async function predict() {
  const predictions = await model.estimateHands(video);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;

    // Calculate distances between key points to detect fist gesture
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const distance = Math.sqrt(
      Math.pow(thumbTip[0] - indexTip[0], 2) +
      Math.pow(thumbTip[1] - indexTip[1], 2)
    );

    // Determine if fist is closed
    if (distance < 30) {
      if (!fistClosed) {
        fistClosed = true;
        screenshotTaken = false; // Allow a new screenshot
        status.textContent = "Fist closed! Taking screenshot...";
        takeScreenshot();
      }
    } else {
      if (fistClosed && !screenshotTaken) {
        fistClosed = false;
        screenshotTaken = true;
        status.textContent = "Fist opened! Screenshot saved.";
        saveScreenshot();
        // Reset variables for future gestures
        fistClosed = false;
        screenshotTaken = false;
      }
    }
  }

  requestAnimationFrame(predict);
}

// Mirror video and take screenshot
function takeScreenshot() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

  // Mirror the video (left-right flip)
  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// Save screenshot
function saveScreenshot() {
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;

  // Use a unique filename to avoid caching
  link.download = `screenshot_${Date.now()}.png`;
  link.click();

  // Debug: Log status
  console.log("Screenshot saved:", link.download);
}

// Load the model when the page loads
loadModel();
