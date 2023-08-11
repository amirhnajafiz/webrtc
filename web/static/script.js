// local video & stream
let localStream;
let localVideo;

// server connections
let serverConnection;
// remove connections (peers)
let remoteConnections = {};

// unique id
let uuid;
let inMeet = false;

// video box
let videoDiv;
let videos = {};


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
        errorHandler("Failed to get your input media!")(error);
    }
}

// join handles the joining operations
function join() {
    inMeet = true;

    document.getElementById("start").disabled = true;

    serverConnection.send(JSON.stringify({
        'type': "join",
        'uuid': uuid,
        'payload': null,
    }));
}

// leave call
function leave() {
    inMeet = false;

    document.getElementById("start").disabled = false;

    serverConnection.send(JSON.stringify({
        'type': "exit",
        'uuid': uuid,
        'payload': null,
    }));

    window.location.reload();
}

// onSignal handles the signals from our signaling server
async function onSignal(ev) {
    // if not in meet, do nothing
    if (!inMeet) return;

    const signal = JSON.parse(ev.data);

    // don't process our own signals
    if (signal.uuid === uuid) return;

    // get signal payload
    const payload = signal.payload;

    // make decisions based on signal type
    switch (signal.type) {
        case 'join':
            await onJoin(signal.uuid);
            break
        case 'offer':
            await onOffer(signal.uuid, payload);
            break;
        case 'answer':
            await onAnswer(signal.uuid, payload);
            break;
        case 'ice':
            await onIceCandidate(signal.uuid, payload);
            break;
        case 'exit':
            onExit(signal.uuid);
            break;
    }
}

// create a new peer connection
function createPeerConnection() {
    return new RTCPeerConnection(peerConnectionConfig);
}

// handling join operation (call)
async function onJoin(id) {
    // create peer connection
    let pc = createPeerConnection();
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    // set peer connections to map
    remoteConnections[id] = {
        pc: pc,
        candidates: []
    };

    // on ice candidate handler
    pc.onicecandidate = (ev) => {
        if (ev.candidate) {
            remoteConnections[id].candidates.push(JSON.stringify(ev.candidate.toJSON()));
        }
    };

    // send sdp offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const offerSdp = btoa(JSON.stringify(pc.localDescription));
    serverConnection.send(JSON.stringify({
        'type': "offer",
        'uuid': uuid,
        'payload': offerSdp,
    }));
}

// handling on offer operation(callee -> caller)
async function onOffer(id, payload) {
    // create peer connection
    let pc = createPeerConnection();
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    // set peer connections to map
    remoteConnections[id] = {
        pc: pc,
        candidates: []
    };

    // on ice candidate handler (send it to others)
    pc.onicecandidate = (ev) => {
        if (ev.candidate) {
            serverConnection.send(JSON.stringify({
                'type': "ice",
                'uuid': uuid,
                'payload': JSON.stringify(ev.candidate.toJSON())
            }));
        }
    };

    // setting remove description
    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(atob(payload))));

    // create an answer and send it
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const answerSdp = btoa(JSON.stringify(pc.localDescription));

    serverConnection.send(JSON.stringify({
        'type': "answer",
        'uuid': uuid,
        'payload': answerSdp,
    }));

    // return if video exists
    if (id in videos) return;

    // create video for user
    let v = createRemoteVideo();
    let w = createWrapper(id);

    const remoteStream = new MediaStream();
    pc.ontrack = ev => ev.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));

    v.srcObject = remoteStream;

    w.appendChild(v);
    videoDiv.appendChild(w);

    videos[id] = true;
}

// handling on answer operation (caller -> callee)
async function onAnswer(id, payload) {
    // get answer session description
    let answerSdp = new RTCSessionDescription(JSON.parse(atob(payload)));

    // update answer sdp
    await remoteConnections[id].pc.setRemoteDescription(answerSdp);

    // send ice candidate
    remoteConnections[id].candidates.forEach((c) => {
        serverConnection.send(JSON.stringify({
            'type': "ice",
            'uuid': uuid,
            'payload': c
        }));
    });

    // return if video exists
    if (id in videos) return;

    // create video for user
    let v = createRemoteVideo();
    let w = createWrapper(id);

    const remoteStream = new MediaStream();
    remoteConnections[id].ontrack = ev => ev.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));

    v.srcObject = remoteStream;

    w.appendChild(v);
    videoDiv.appendChild(w);

    videos[id] = true;
}

// handling on ice candidate operation
async function onIceCandidate(id, payload) {
    // add ice candidate
    await remoteConnections[id].pc.addIceCandidate(JSON.parse(payload));
}

// handling on exit operation
function onExit(id) {
    // remove from peers
    remoteConnections.delete(id);

    // remove screen
    videos.delete(id);
    clearElement(id);
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

// handing system errors
function errorHandler(message) {
    return (error) => {
        console.log(error);
        alert(message);
    }
}

// creating an almost unique uuid
function createUUID() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4() + s4() + s4()}`;
}
