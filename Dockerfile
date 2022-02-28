# syntax=docker/dockerfile:experimental
FROM ubuntu 

# switch to root
USER root 

# updating repositories
RUN apt update 

# installing firebase
RUN curl -sL https://firebase.tools | bash 

# check firebase version
RUN firebase --version 

# running the firebase 
ENTRYPOINT make dev
