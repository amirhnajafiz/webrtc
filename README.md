# WebRTC

![](https://img.shields.io/badge/signaling-Go_Fiber-blue)
![](https://img.shields.io/badge/pwa-JavaScript-green)
![](https://img.shields.io/badge/protocol-WebRTC-red)
![GitHub release (with filter)](https://img.shields.io/github/v/release/amirhnajafiz/webrtc)

Implementing a Video application with ```WebRTC```. In this project we are going to
use Javascript WebRTC modules and Websockets in order to create a communication system over video stream.
For our signaling server we are going to use ```Golang Fiber```.

## setup

In order to set up project you have two options. You can build it on your
own system (you need to have Golang installed on your system) or you can
start it on a container.

Build the project on your system:

```shell
go build -o main
chmod +x ./main
./main
```

### env

Set the project env variables to deploy it on production

```shell
HTTP_PORT=80 # project port
DEV_MODE=false # logging option
```

Run the project on container:

```shell
docker run --rm -it -d -p 80:80 $(docker build -q . -f build/Dockerfile)
```

After that you can access the application on ```localhost```.

## network activity

As you can see in network activity diagram, two peers connect to signaling server, stun server, and turn server
in order to setup a session for communicating over ```webrtc``` protocol.

![](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity/webrtc-complete-diagram.png)

### visual schema

See what’s it look like in a call between two peers.

![](https://img.kancloud.cn/71/45/7145c9f8d8f4c39caf7fb5b4ce98d8b1_651x619.jpeg)

## fsm

In the following schema you can see the application ```Finite State Machine```.
The process of making a call and joining a call is being handled like this.

![](.github/diagram.svg)

## resources

- [www.webrtc.org](https://webrtc.org/)
- [www.developer.mozilla.org/webrtc/api](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [www.w3.org/webrtc](https://www.w3.org/TR/webrtc/)

## contribute

Feel free to submit you pull reqeusts on this repository.
