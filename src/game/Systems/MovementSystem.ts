import type { Entity, Vector2 } from '../Entity';
import type { World } from '../World';

export class MovementSystem {
    private readonly baseSpeed = 500;

    public updateEntity(entity: Entity, direction: Vector2, world: World, dt: number): void {
        const mag = Math.hypot(direction.x, direction.y);
        const dir = mag > 0 ? { x: direction.x / mag, y: direction.y / mag } : { x: 0, y: 0 };

        const speedFactor = (entity as unknown as { speedFactor?: number }).speedFactor ?? 1;
        const speed = (this.baseSpeed / Math.sqrt(entity.radius)) * entity.speedMultiplier * speedFactor;
        const targetVx = dir.x * speed;
        const targetVy = dir.y * speed;

        const drag = 1 - Math.exp(-dt * 12);
        entity.velocity.x += (targetVx - entity.velocity.x) * drag;
        entity.velocity.y += (targetVy - entity.velocity.y) * drag;

        entity.position.x += entity.velocity.x * dt;
        entity.position.y += entity.velocity.y * dt;

        entity.position.x = Math.max(entity.radius, Math.min(world.width - entity.radius, entity.position.x));
        entity.position.y = Math.max(entity.radius, Math.min(world.height - entity.radius, entity.position.y));
    }
}
