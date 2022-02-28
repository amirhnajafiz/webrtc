# FirebaseRTC
Build video chat application using the WebRTC API and Cloud Firestore.

## How to use?
### Docker
Just use the following command:
```shell
docker-compose up -d
```

You will get your application at **0.0.0.0:5000**

### Local
First you need to install the _firebase_ on your system.<br />
If you are using **macOS**:
```shell
brew install firebase-cli
```

If you are using **Linux**:
```shell
curl -sL https://firebase.tools | bash
```

To check if you installation was successful, run the following command:
```shell
firebase --version
```

Result should be like this:
```shell
10.2.1
```

Make sure the version of the **Firebase CLI** is _v6.7.1_ or _later_.

After that just run the following command and you will have the application ready at **localhost:5000** :
```shell
make dev
```

## What is Firebase?

## Firebase and WebRTC

## How does this project work?
