import { Assets, Texture } from 'pixi.js';
import { Bot } from '../Bot';
import { Food } from '../Food';
import type { Personality, Vector2 } from '../Entity';
import type { World } from '../World';

interface LanguageArchetype {
    name: string;
    color: number;
    personality: Personality;
    speedMultiplier: number;
    icon: string;
    radiusBias: number;
}

const ARCHETYPES: LanguageArchetype[] = [
    { name: 'Python', color: 0x4f9cff, personality: 'coward', speedMultiplier: 1.18, icon: '/icons/python.png', radiusBias: -4 },
    { name: 'C++', color: 0x6781ff, personality: 'aggressive', speedMultiplier: 0.84, icon: '/icons/cpp.png', radiusBias: 12 },
    { name: 'Java', color: 0xff7c51, personality: 'neutral', speedMultiplier: 1, icon: '/icons/java.png', radiusBias: 0 },
    { name: 'JavaScript', color: 0xf6d94f, personality: 'aggressive', speedMultiplier: 1.15, icon: '/icons/javascript.png', radiusBias: -8 }
];

export class SpawnSystem {
    private readonly textures = new Map<string, Texture>();

    public async preload(): Promise<void> {
        for (const archetype of ARCHETYPES) {
            try {
                const texture = await Assets.load(archetype.icon);
                this.textures.set(archetype.name, texture);
            } catch {
                // Icon loading is optional. Rendering falls back to circles.
            }
        }
    }

    public maintain(world: World, minBots: number, maxBots: number, minFood: number, maxFood: number): void {
        const currentBots = world.bots.length;
        if (currentBots < minBots) {
            const targetBots = Math.floor(Math.random() * (maxBots - minBots + 1)) + minBots;
            const toSpawnBots = targetBots - currentBots;
            for (let i = 0; i < toSpawnBots; i++) {
                world.addEntity(this.createBot(world));
            }
        }

        const currentFood = world.foods.length;
        if (currentFood < minFood) {
            const targetFood = Math.floor(Math.random() * (maxFood - minFood + 1)) + minFood;
            const toSpawnFood = targetFood - currentFood;
            for (let i = 0; i < toSpawnFood; i++) {
                world.addEntity(this.createFood(world));
            }
        }
    }

    public createFood(world: World): Food {
        return new Food({
            id: world.takeNextId(),
            name: '',
            position: this.findSpawnPosition(world, 160),
            radius: this.randBetween(3.5, 7),
            color: 0x9eff7a
        });
    }

    public burstFood(world: World, position: Vector2, direction: Vector2, speed = 520): Food {
        const food = new Food({
            id: world.takeNextId(),
            name: '',
            position: { ...position },
            radius: this.randBetween(4, 6),
            color: 0xb8ff6f
        });
        food.velocity.x = direction.x * speed;
        food.velocity.y = direction.y * speed;
        return food;
    }

    public createBot(world: World): Bot {
        const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
        const radius = this.weightedRadius() + archetype.radiusBias;
        const position = this.findSpawnPosition(world, 360);

        return new Bot({
            id: world.takeNextId(),
            name: archetype.name,
            position,
            radius: Math.max(8, radius),
            color: archetype.color,
            personality: archetype.personality,
            speedMultiplier: archetype.speedMultiplier,
            texture: this.textures.get(archetype.name)
        });
    }

    private weightedRadius(): number {
        const roll = Math.random();
        if (roll < 0.6) return this.randBetween(8, 20);
        if (roll < 0.9) return this.randBetween(20, 40);
        return this.randBetween(40, 80);
    }

    private findSpawnPosition(world: World, minPlayerDistance: number): Vector2 {
        const playerPos = world.player.position;

        for (let i = 0; i < 40; i++) {
            const position = {
                x: this.randBetween(40, world.width - 40),
                y: this.randBetween(40, world.height - 40)
            };
            if (Math.hypot(position.x - playerPos.x, position.y - playerPos.y) > minPlayerDistance) {
                return position;
            }
        }

        return {
            x: Math.min(world.width - 40, playerPos.x + minPlayerDistance + 50),
            y: Math.min(world.height - 40, playerPos.y + minPlayerDistance + 50)
        };
    }

    private randBetween(min: number, max: number): number {
        return min + Math.random() * (max - min);
    }
}
