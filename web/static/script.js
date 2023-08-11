let localStream;
let localVideo;
let peerConnection;
let serverConnection;
let uuid;
let videoDiv;

const peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

async function pageReady() {
    // generating a uuid
    uuid = createUUID();

    // get video screens
    localVideo = document.getElementById('localVideo');
    videoDiv = document.getElementById('videos');

    // make connection to our signaling server
    serverConnection = new WebSocket(`ws://${window.location.host}/ws`);
    serverConnection.onmessage = gotMessageFromServer;

    const constraints = {
        video: true,
        audio: true,
    };

    // check system requirements
    if(!navigator.mediaDevices.getUserMedia) {
        alert('Sorry, Your browser does not support needed APIs');

        return;
    }

    // get user media
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        localStream = stream;
        localVideo.srcObject = stream;
    } catch(error) {
        errorHandler(error);
    }
}

function start(isCaller) {
    // create a new peer connection
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;

    let v = createRemoteVideo();
    let d = createWrapper();

    d.appendChild(v);
    videoDiv.appendChild(d);

    peerConnection.ontrack = gotRemoteStream(v);

    // get local streams and send them
    for (const track of localStream.getTracks()) {
        peerConnection.addTrack(track, localStream);
    }

    // caller creates a new offer
    if (isCaller) {
        peerConnection.createOffer()
            .then(createdDescription)
            .catch(errorHandler);
    }
}

function gotMessageFromServer(message) {
    // this means that you are the callee
    if (!peerConnection) {
        start(false);
    }

    // process signal
    const signal = JSON.parse(message.data);

    // ignore messages from ourself
    if (signal.uuid === uuid) return;

    // get sdp signals
    if (signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(() => {
                // only create answers in response to offers
                if (signal.sdp.type !== 'offer') return;

                peerConnection.createAnswer()
                    .then(createdDescription)
                    .catch(errorHandler);
            })
            .catch(errorHandler);
    } else if (signal.ice) { // get ice candidate
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice))
            .catch(errorHandler);
    }
}

// get a new ice candidate
function gotIceCandidate(event) {
    if(event.candidate != null) {
        serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
}

// create a new session description
function createdDescription(description) {
    peerConnection.setLocalDescription(description)
        .then(() => {
            serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
        })
        .catch(errorHandler);
}

// get other peer remote stream
function gotRemoteStream(remoteVideo){
    return (event) => {
        remoteVideo.srcObject = event.streams[0];
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
