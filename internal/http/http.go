package http

import (
	"fmt"
	"log"

	"github.com/gofiber/websocket/v2"
)

type Handler struct {
	Connections []*websocket.Conn
}

func (h *Handler) WebsocketHandler(c *websocket.Conn) {
	h.Connections = append(h.Connections, c)

	for {
		messageType, bytes, err := c.ReadMessage()
		if err != nil {
			log.Println(fmt.Errorf("failed to get message error=%w", err))

			break
		}

		h.broadcast(messageType, bytes)
	}
}

func (h *Handler) broadcast(messageType int, bytes []byte) {
	lives := make([]*websocket.Conn, 0)

	for _, c := range h.Connections {
		if err := c.WriteMessage(messageType, bytes); err != nil {
			log.Println(fmt.Errorf("failed to send data error=%w", err))
		}

		lives = append(lives, c)
	}

	h.Connections = lives
}
