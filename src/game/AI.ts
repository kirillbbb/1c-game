import { Bot } from './Bot';
import type { Entity, Vector2 } from './Entity';

const EPS = 1e-6;

export class AI {
    public update(bot: Bot, entities: Entity[], dt: number): void {
        const threats: Entity[] = [];
        const prey: Entity[] = [];

        for (const other of entities) {
            if (other.id === bot.id || !other.isAlive) continue;
            const dx = other.position.x - bot.position.x;
            const dy = other.position.y - bot.position.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > bot.detectionRadius * bot.detectionRadius) continue;

            if (other.radius > bot.radius * 1.2) {
                threats.push(other);
            } else if (other.radius < bot.radius * 0.8) {
                prey.push(other);
            }
        }

        const escapeBias = bot.personality === 'coward' ? 1.3 : 1;
        const chaseBias = bot.personality === 'aggressive' ? 1.3 : bot.personality === 'coward' ? 0.7 : 1;

        let desired: Vector2;
        const escapeMode = threats.length > 0 && (escapeBias >= chaseBias || prey.length === 0);

        if (escapeMode) {
            const nearest = this.findNearest(bot, threats);

            // When escaping, bots should be easier to catch:
            // slower + less responsive + more chaotic direction.
            bot.speedFactor = bot.personality === 'coward' ? 0.7 : 0.8;
            const escapeChaos = bot.personality === 'coward' ? 0.58 : 0.46;
            const awayVec = this.away(bot, nearest, escapeChaos);

            // "Dumb" escape: a small pull back toward the threat makes dodging imperfect.
            const towardVec = this.toward(bot, nearest);
            const dumbness = bot.personality === 'coward' ? 0.26 : 0.18;
            desired = {
                x: awayVec.x * (1 - dumbness) + towardVec.x * dumbness * 0.35,
                y: awayVec.y * (1 - dumbness) + towardVec.y * dumbness * 0.35
            };
        } else if (prey.length > 0) {
            const nearest = this.findNearest(bot, prey);
            desired = this.toward(bot, nearest);
            bot.speedFactor = 1;
        } else {
            desired = this.wander(bot, dt);
            bot.speedFactor = 0.95;
        }

        const smoothingRate = escapeMode ? 3 : 6;
        const smoothing = 1 - Math.exp(-dt * smoothingRate);
        bot.targetDirection.x += (desired.x - bot.targetDirection.x) * smoothing;
        bot.targetDirection.y += (desired.y - bot.targetDirection.y) * smoothing;

        const len = Math.hypot(bot.targetDirection.x, bot.targetDirection.y);
        if (len > EPS) {
            bot.targetDirection.x /= len;
            bot.targetDirection.y /= len;
        }
    }

    private findNearest(bot: Bot, targets: Entity[]): Entity {
        let closest = targets[0];
        let bestDist = Infinity;

        for (const target of targets) {
            const d = Math.hypot(target.position.x - bot.position.x, target.position.y - bot.position.y);
            if (d < bestDist) {
                bestDist = d;
                closest = target;
            }
        }

        return closest;
    }

    private toward(bot: Bot, target: Entity): Vector2 {
        const x = target.position.x - bot.position.x;
        const y = target.position.y - bot.position.y;
        const len = Math.hypot(x, y) || 1;
        return { x: x / len, y: y / len };
    }

    private away(bot: Bot, target: Entity, chaos: number): Vector2 {
        const x = bot.position.x - target.position.x;
        const y = bot.position.y - target.position.y;
        const len = Math.hypot(x, y) || 1;
        const baseX = x / len;
        const baseY = y / len;

        const t = performance.now() * 0.001;
        const clampedChaos = Math.max(0, Math.min(0.95, chaos));
        const noiseAmplitude = 0.5 + clampedChaos * 0.8;
        const noiseX = Math.sin(t * 1.9 + bot.id * 3.1) + (Math.random() - 0.5) * noiseAmplitude;
        const noiseY = Math.cos(t * 1.7 + bot.id * 2.3) + (Math.random() - 0.5) * noiseAmplitude;

        const mixedX = baseX * (1 - clampedChaos) + noiseX * clampedChaos;
        const mixedY = baseY * (1 - clampedChaos) + noiseY * clampedChaos;
        const mixedLen = Math.hypot(mixedX, mixedY) || 1;
        return { x: mixedX / mixedLen, y: mixedY / mixedLen };
    }

    private wander(bot: Bot, dt: number): Vector2 {
        const t = performance.now() * 0.001 + bot.id;
        const x = Math.cos(t * 0.8 + bot.id) + Math.sin(t * 0.3);
        const y = Math.sin(t * 0.7) - Math.cos(t * 0.4 + bot.id * 0.3);
        const len = Math.hypot(x, y) || 1;
        const scale = Math.max(0.55, Math.min(1, dt * 10));
        return { x: (x / len) * scale, y: (y / len) * scale };
    }
}
