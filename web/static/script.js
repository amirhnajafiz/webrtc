let localStream;
let localVideo;

let localConnection;
let serverConnection;

let uuid;
let videoDiv;


// peer connection configs
const peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};


// page ready function starts the requirements
async function pageReady() {
    // generating a uuid for this client
    uuid = createUUID();

    // get my local video screen
    localVideo = document.getElementById('localVideo');
    // get video box
    videoDiv = document.getElementById('videos');

    // make connection to our signaling server
    serverConnection = new WebSocket(`ws://${window.location.host}/ws`);

    // setup constraints for getting user media
    const constraints = {
        video: true,
        audio: true,
    };

    // check system requirements
    if(!navigator.mediaDevices.getUserMedia) {
        alert('Sorry, Your browser does not support needed APIs');

        return;
    }

    // get local media
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStream = stream;
        localVideo.srcObject = stream;
    } catch(error) {
        errorHandler(error);
    }
}

// create remote video
function createRemoteVideo() {
    let el = document.createElement("video");

    el.style.width = "100%";
    el.style.height = "250px";
    el.autoplay = true;
    el.playsInline = true;

    return el
}

// create video wrapper
function createWrapper() {
    let el = document.createElement("div");

    el.style.width = "500px";
    el.style.height = "250px";
    el.style.border = "1px solid orange";

    return el;
}

// handing errors
function errorHandler(error) {
    console.log(error);

    alert("Problem with getting camera and microphone data!");
}

// creating an almost unique uuid
function createUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}
