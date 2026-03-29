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
        if (threats.length > 0 && (escapeBias >= chaseBias || prey.length === 0)) {
            const nearest = this.findNearest(bot, threats);
            desired = this.away(bot, nearest);
        } else if (prey.length > 0) {
            const nearest = this.findNearest(bot, prey);
            desired = this.toward(bot, nearest);
        } else {
            desired = this.wander(bot, dt);
        }

        const smoothing = 1 - Math.exp(-dt * 6);
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

    private away(bot: Bot, target: Entity): Vector2 {
        const x = bot.position.x - target.position.x;
        const y = bot.position.y - target.position.y;
        const len = Math.hypot(x, y) || 1;
        const baseX = x / len;
        const baseY = y / len;
        const sideX = -baseY;
        const sideY = baseX;

        const t = performance.now() * 0.001;
        const zigzag = Math.sin(t * 6.4 + bot.id * 1.7);
        const weave = 0.5 + Math.random() * 0.5;
        const chaos = 0.65;
        const jitterX = (Math.random() - 0.5) * 1.2;
        const jitterY = (Math.random() - 0.5) * 1.2;
        const evasiveX = baseX + sideX * zigzag * weave;
        const evasiveY = baseY + sideY * zigzag * weave;
        const mixedX = evasiveX * (1 - chaos) + jitterX * chaos;
        const mixedY = evasiveY * (1 - chaos) + jitterY * chaos;
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
