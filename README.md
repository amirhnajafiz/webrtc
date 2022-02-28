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
**Google Firebase** is a Google-backed application development software that enables developers to develop iOS, Android and Web apps. Firebase provides tools for tracking analytics, reporting and fixing app crashes, creating marketing and product experiment.

The Firebase Realtime Database lets you build rich, collaborative applications by allowing secure access to the database directly from client-side code. Data is persisted locally, and even while offline, realtime events continue to fire, giving the end user a responsive experience.

## How does this project work?
This application uses two Firebase services available on the web:
- **Cloud Firestore** to save structured data on the Cloud and get instant notification when the data is updated
- **Firebase Hosting** to host and serve your static assets

The app uses Cloud Firestore to save the chat messages and receive new chat messages.

In this application, each video chat session is called a room. A user can create a new room by clicking a button in their application. This will generate an ID that the remote party can use to join the same room. The ID is used as the key in Cloud Firestore for each room.

Each room will contain the **_RTCSessionDescriptions_** for both the offer and the answer, as well as two separate collections with **_ICE candidates_** from each party.

The next step is to implement the logic for joining an existing room. The user does this by clicking the Join room button and entering the ID for the room to join. Your task here is to implement the creation of the **_RTCSessionDescription_** for the answer and update the room in the database accordingly.

Before the caller and callee can connect to each other, they also need to exchange **_ICE candidates_** that tell WebRTC how to connect to the remote peer. Your next task is to implement the code that listens for **_ICE candidates_** and adds them to a collection in the database.


Related to firebase, Firebase + WebRTC project.
