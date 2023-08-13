// local video & stream
let localStream;
let localVideo;

// server connections
let serverConnection;
// remove connections (peers)
let remoteConnections = {};

// unique id and meet flag
let uuid;
let inMeet = false;

// video box
let videoDiv;


// set configs and addresses
const serverAddress = `ws://${window.location.host}/ws`;

// peer connection configs
const peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};


// create message types
const JoinType = "join";
const OfferType = "offer";
const AnswerType = "answer";
const IceCandidateType = "ice-candidate";
const ExitType = "exit";

// id enums
const GlobalDest = "global";


// page ready function starts the requirements
// of our application. It generates a unique id and
// gets user media and sends it to a local stream.
async function pageReady() {
    // generating an uuid for this client
    uuid = createUUID();

    localVideo = document.getElementById('localVideo');
    videoDiv = document.getElementById('videos')

    // make connection to our signaling server
    serverConnection = new WebSocket(serverAddress);
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

    // send join request to other peers
    serverConnection.send(JSON.stringify({
        'type': JoinType,
        'uuid': uuid,
        'payload': null,
        'dest_id': GlobalDest
    }));
}

// leave call
function leave() {
    inMeet = false;

    document.getElementById("start").disabled = false;

    // send exit request to other peers
    serverConnection.send(JSON.stringify({
        'type': ExitType,
        'uuid': uuid,
        'payload': null,
        'dest_id': GlobalDest
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

    // don't process signals that are not for us or not global
    if (signal.dest_id !== uuid && signal.dest_id !== GlobalDest) return;

    console.log(signal);

    // get signal payload
    const payload = signal.payload;

    // make decisions based on signal type
    switch (signal.type) {
        case JoinType:
            await onJoin(signal.uuid);
            break;
        case OfferType:
            await onOffer(signal.uuid, payload);
            break;
        case AnswerType:
            await onAnswer(signal.uuid, payload);
            break;
        case IceCandidateType:
            await onIceCandidate(signal.uuid, payload);
            break;
        case ExitType:
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

    // create a remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = ev => ev.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));

    // on ice candidate handler
    pc.onicecandidate = (ev) => {
        if (ev.candidate) {
            pc.candidates.push(JSON.stringify(ev.candidate.toJSON()));
        }
    };

    // send sdp offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // create an offer session description
    const offerSdp = btoa(JSON.stringify(pc.localDescription));
    serverConnection.send(JSON.stringify({
        'type': OfferType,
        'uuid': uuid,
        'payload': offerSdp,
        'dest_id': id
    }));

    // set peer connections to map
    remoteConnections[id] = {
        pc: pc,
        candidates: []
    };

    // create video for user
    let v = createRemoteVideo(remoteStream);
    let w = createWrapper(id);

    w.appendChild(v);
    videoDiv.appendChild(w);
}

// handling on offer operation(callee -> caller)
async function onOffer(id, payload) {
    // create peer connection
    let pc = createPeerConnection();
    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    // create a remote stream
    const remoteStream = new MediaStream();
    pc.ontrack = ev => ev.streams[0].getTracks().forEach(track => remoteStream.addTrack(track));

    // on ice candidate handler (send it to others)
    pc.onicecandidate = (ev) => {
        if (ev.candidate) {
            serverConnection.send(JSON.stringify({
                'type': IceCandidateType,
                'uuid': uuid,
                'payload': JSON.stringify(ev.candidate.toJSON()),
                'dest_id': id
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
        'type': AnswerType,
        'uuid': uuid,
        'payload': answerSdp,
        'dest_id': id
    }));

    // set peer connections to map
    remoteConnections[id] = {
        pc: pc
    };

    // create video for user
    let v = createRemoteVideo(remoteStream);
    let w = createWrapper(id);

    w.appendChild(v);
    videoDiv.appendChild(w);
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
            'type': IceCandidateType,
            'uuid': uuid,
            'payload': c,
            'dest_id': id
        }));
    });
}

// handling on ice candidate operation
async function onIceCandidate(id, payload) {
    // add ice candidate
    await remoteConnections[id].pc.addIceCandidate(JSON.parse(payload));
}

// handling on exit operation
function onExit(id) {
    // remove from peers
    remoteConnections[id] = undefined;

    // remove screen
    clearElement(id);
}

// create remote video
function createRemoteVideo(stream) {
    let el = document.createElement("video");

    el.style.width = "100%";
    el.style.height = "250px";
    el.autoplay = true;
    el.playsInline = true;
    el.srcObject = stream;

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
    videoDiv.removeChild(document.getElementById(id));
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
