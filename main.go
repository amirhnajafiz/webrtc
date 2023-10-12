package main

import (
	"fmt"
	"log"
	"os"

	"github.com/amirhnajafiz/webrtc/internal/http"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"github.com/gofiber/websocket/v2"
)

func main() {
	port := os.Getenv("HTTP_PORT")

	engine := html.New("./web", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	httpHandler := http.New()

	app.Static("/static/", "./web/static")
	app.Get("/ws", websocket.New(httpHandler.WebsocketHandler))
	app.Get("/", func(ctx *fiber.Ctx) error {
		return ctx.Render("index", nil)
	})
	app.Get("/health", func(ctx *fiber.Ctx) error {
		return ctx.SendStatus(fiber.StatusOK)
	})

	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Println(fmt.Errorf("failed to start signaling server"))
	}
}
