const video = document.getElementById('video');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const captureBtn = document.getElementById("captureBtn")
const backBtn = document.getElementById("backBtn")
const captureScreen = document.getElementById("captureScreen")
const infoScreen = document.getElementById("infoScreen")

function getUserMedia() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // Mobile device
        return navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: "environment" } } });
    } else {
        // Laptop or desktop
        return navigator.mediaDevices.getUserMedia({ video: true });
    }
}

getUserMedia()
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(error => {
        console.error('Error accessing the camera:', error);
    });

function capturePhoto() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    document.getElementById("image").setAttribute("src", canvas.toDataURL('image/png'))
    const base64String = canvas.toDataURL('image/png').split(',')[1];
    video.pause()
    video.style.animation = "blinkani 1s ease-in-out infinite alternate"
    captureBtn.setAttribute("disabled", "true")
    sendToEndpoint(base64String);
}

function sendToEndpoint(base64String) {
    const endpointUrl = '/pokedexit';
    const requestData = { imageData: base64String };

    fetch(endpointUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            // document.getElementById('response').textContent = JSON.stringify(data, null, 2);
            renderInfo(data)
        })
        .catch(error => {
            console.error('Error sending data to endpoint:', error);
        });
}

function renderInfo(data, base64String) {
    captureScreen.style.display = "none"
    infoScreen.style.display = "block"
    backBtn.style.display = "block"
    document.getElementById("description").textContent = data.description;
    document.getElementById("object").textContent = data.object;
    document.getElementById("species").textContent = data.species;
    document.getElementById("approximateWeight").textContent = data.approximateWeight;
    document.getElementById("approximateHeight").textContent = data.approximateHeight;
    document.getElementById("hp").textContent = data.hp;
    document.getElementById("attack").textContent = data.attack;
    document.getElementById("defense").textContent = data.defense;
    document.getElementById("speed").textContent = data.speed;
    document.getElementById("type").textContent = data.type;
}

backBtn.addEventListener("click", () => {
    infoScreen.style.display = "none"
    captureScreen.style.display = "block"
    backBtn.style.display = "none"
    video.play()
    video.style.animation = ""
    captureBtn.removeAttribute("disabled")
})