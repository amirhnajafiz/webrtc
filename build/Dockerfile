# from golang base image
FROM golang:1.20-alpine

# set work directory
WORKDIR /src/app

# maintainer
MAINTAINER amirhossein.najafizadeh21@gmail.com

# copy all files
COPY go.mod go.sum ./

RUN go mod download

# copy all files
COPY . .

# building go executable file
RUN go build -o main \
    && chmod +x ./main

# start signaling service
CMD ./main
