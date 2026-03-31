package main

import (
	"fmt"
	"time"

	// Importamos la librería de MQTT que está en tu go.mod
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func main() {
	// 1. Definimos las opciones del cliente
	// Usamos 'mqtt.' para acceder a las funciones de la librería
	opts := mqtt.NewClientOptions().AddBroker("tcp://localhost:1883")
	opts.SetClientID("sleep_monitor_server")

	// 2. Creamos el cliente
	client := mqtt.NewClient(opts)

	// 3. Intentamos la conexión
	// Guardamos el resultado en un 'token' para verificar si hubo error
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		fmt.Printf("Error al conectar: %v\n", token.Error())
		return
	}

	fmt.Println("Backend conectado al Broker Mosquitto correctamente.")

	// 4. Mantenemos el programa corriendo
	// Si el main termina, el programa se cierra.
	for {
		time.Sleep(1 * time.Second)
	}
}
