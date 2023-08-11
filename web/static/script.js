let localStream;
let localVideo;

let serverConnection;
let remoteConnections = {};

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
// of our application. It generates a unique id and
// gets user media and sends it to a local stream.
async function pageReady() {
    // generating an uuid for this client
    uuid = createUUID();

    // get my local video screen
    localVideo = document.getElementById('localVideo');
    // get video box
    videoDiv = document.getElementById('videos');

    // make connection to our signaling server
    serverConnection = new WebSocket(`ws://${window.location.host}/ws`);
    serverConnection.onmessage = onSignal;

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

// onJoin handles the joining operations
function join() {
    serverConnection.send(JSON.stringify({
        'type': "join",
        'uuid': uuid,
        'payload': null,
    }));
}

// onSignal handles the signals from our signaling server
function onSignal(ev) {
    const signal = JSON.parse(ev.data);

    // don't process our own signals
    if (signal.uuid === uuid) return;

    // get signal payload
    const payload = signal.payload;

    // make decisions based on signal type
    switch (signal.type) {
        case 'join':
            onJoin(payload);
            break;
        case 'offer':
            onOffer(payload);
            break;
        case 'answer':
            onAnswer(payload);
            break;
        case 'ice':
            onIceCandidate(payload);
            break;
        case 'exit':
            onExit(payload);
            break;
    }
}

// create a new peer connection
function createPeerConnection() {
    return new RTCPeerConnection(peerConnectionConfig);
}

// handling the join operation
function onJoin(payload) {

}

// handling on offer operation
function onOffer(payload) {

}

// handling on answer operation
function onAnswer(payload) {

}

// handling on ice candidate operation
function onIceCandidate(payload) {

}

// handling on exit operation
function onExit(payload) {

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
function createWrapper(id) {
    let el = document.createElement("div");

    el.id = id;
    el.style.width = "500px";
    el.style.height = "250px";
    el.style.border = "1px solid orange";

    return el;
}

// remove an element from screen
function clearElement(id) {
    document.getElementById(id).remove();
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
