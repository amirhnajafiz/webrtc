package main

import (
	"fmt"
	"log"

	"github.com/amirhnajafiz/webrtc/internal/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"github.com/gofiber/websocket/v2"
)

func main() {
	engine := html.New("./web", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	httpHandler := http.Handler{
		Connections: make([]*websocket.Conn, 0),
	}

	app.Static("/static/", "./web/static")
	app.Get("/ws", websocket.New(httpHandler.WebsocketHandler))
	app.Get("/", func(ctx *fiber.Ctx) error {
		return ctx.Render("index", nil)
	})

	if err := app.Listen(":8080"); err != nil {
		log.Println(fmt.Errorf("failed to start signaling server"))
	}
}
