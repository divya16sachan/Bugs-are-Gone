// RabbitMQ Event Publisher for Order Service — implemented in Phase 1
export async function publishEvent<T>(_routingKey: string, _payload: T): Promise<void> {
  // Placeholder: RabbitMQ connection & channel publish (e.g. order.created)
}
