import type { Entity } from '../Entity';
import { Food } from '../Food';
import { Player } from '../Player';
import type { World } from '../World';

interface CollisionResult {
    eaten: Entity[];
    winnerId?: number;
}

export class CollisionSystem {
    public update(world: World): CollisionResult {
        const removed = new Set<number>();
        const entities = world.entities;
        let eatenEntitiesLast: Entity[] = [];

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


                const minSizeRatio = bigger instanceof Player && smaller instanceof Player ? 1.0 : 1.05;
                if (bigger.radius >= smaller.radius * minSizeRatio && dist <= engulfDistance) {
                    this.absorbMass(bigger, smaller);
                    removed.add(smaller.id);
                }
                }
            }

            const eatenEntities = entities.filter((e) => removed.has(e.id));
            eatenEntities.forEach((e) => world.removeEntity(e));

            eatenEntitiesLast = eatenEntities;
        }

        return {
            eaten: eatenEntitiesLast,
            winnerId: [...world.entities].sort((a, b) => b.radius - a.radius)[0]?.id
        };

    }

    private absorbMass(consumer: Entity, prey: Entity): void {
        if (prey instanceof Food) {
            consumer.radius += 1;
            return;
        }
        consumer.radius = Math.sqrt(consumer.radius * consumer.radius + prey.radius * prey.radius);
    }
    }