import type { Entity } from '../Entity';
import { Food } from '../Food';
import type { World } from '../World';

interface CollisionResult {
    eaten: Entity[];
    winnerId?: number;
}

export class CollisionSystem {
    public update(world: World): CollisionResult {
        const removed = new Set<number>();
        const entities = world.entities;

        for (let i = 0; i < entities.length; i++) {
            const a = entities[i];
            if (removed.has(a.id)) continue;

            for (let j = i + 1; j < entities.length; j++) {
                const b = entities[j];
                if (removed.has(b.id)) continue;

                const dx = b.position.x - a.position.x;
                const dy = b.position.y - a.position.y;
                const dist = Math.hypot(dx, dy);

                if (dist < a.radius + b.radius) {
                    if (a instanceof Food && !(b instanceof Food)) {
                        this.absorbMass(b, a);
                        removed.add(a.id);
                        continue;
                    }
                    if (b instanceof Food && !(a instanceof Food)) {
                        this.absorbMass(a, b);
                        removed.add(b.id);
                        continue;
                    }
                    if (a instanceof Food && b instanceof Food) continue;

                    const bigger = a.radius >= b.radius ? a : b;
                    const smaller = bigger.id === a.id ? b : a;
                    const requiredOverlap = smaller.radius * 0.35;
                    const engulfDistance = bigger.radius - requiredOverlap;

                    if (bigger.radius > smaller.radius * 1.05 && dist <= engulfDistance) {
                        this.absorbMass(bigger, smaller);
                        removed.add(smaller.id);
                    }
                }
            }
        }

        const eatenEntities = entities.filter((e) => removed.has(e.id));
        eatenEntities.forEach((e) => world.removeEntity(e));

        return {
            eaten: eatenEntities,
            winnerId: [...world.entities].sort((a, b) => b.radius - a.radius)[0]?.id
        };
    }

    private absorbMass(consumer: Entity, prey: Entity): void {
        consumer.radius = Math.sqrt(consumer.radius * consumer.radius + prey.radius * prey.radius);
    }
}
