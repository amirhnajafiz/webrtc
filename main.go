package main

import (
	"fmt"
	"log"

	"github.com/amirhnajafiz/webrtc/internal/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

func main() {
	app := fiber.New()

	httpHandler := http.Handler{
		Connections: make([]*websocket.Conn, 0),
	}

	app.Static("/static/", "./web/static")

	app.Get("/ws", websocket.New(httpHandler.WebsocketHandler))

	if err := app.Listen(":8080"); err != nil {
		log.Println(fmt.Errorf("failed to start signaling server"))
	}
}
