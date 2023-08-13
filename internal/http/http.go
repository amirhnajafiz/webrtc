package http

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/gofiber/websocket/v2"
)

type (
	Handler struct {
		Connections []*client
	}

	client struct {
		lock       sync.Mutex
		connection *websocket.Conn
	}

	message struct {
		T    string `json:"type"`
		UUID string `json:"uuid"`
		D    string `json:"dest_id"`
	}
)

func New() Handler {
	return Handler{
		Connections: make([]*client, 0),
	}
}

func (h *Handler) WebsocketHandler(c *websocket.Conn) {
	h.Connections = append(h.Connections, &client{
		connection: c,
	})

	for {
		messageType, bytes, err := c.ReadMessage()
		if err != nil {
			log.Println(fmt.Errorf("failed to get message error=%w", err))

			break
		}

		m := new(message)
		if er := json.Unmarshal(bytes, m); er == nil {
			log.Println(m.T, m.UUID, m.D)
		}

		h.broadcast(messageType, bytes)
	}
}

func (h *Handler) broadcast(messageType int, bytes []byte) {
	lives := make([]*client, 0)

	for _, c := range h.Connections {
		c.lock.Lock()

		if err := c.connection.WriteMessage(messageType, bytes); err != nil {
			log.Println(fmt.Errorf("failed to send data error=%w", err))
		}

		c.lock.Unlock()

		lives = append(lives, c)
	}

	h.Connections = lives
}
