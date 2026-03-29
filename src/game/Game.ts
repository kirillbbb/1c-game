import { Application, Assets, Texture } from 'pixi.js';
import { AI } from './AI';
import { Camera } from './Camera';
import type { Vector2 } from './Entity';
import { Player } from './Player';
import { CollisionSystem } from './Systems/CollisionSystem';
import { MovementSystem } from './Systems/MovementSystem';
import { RenderSystem } from './Systems/RenderSystem';
import { SpawnSystem } from './Systems/SpawnSystem';
import { World } from './World';

export class Game {
    private readonly app: Application;
    private readonly root: HTMLElement;
    private world!: World;
    private camera!: Camera;
    private movementSystem = new MovementSystem();
    private collisionSystem = new CollisionSystem();
    private spawnSystem = new SpawnSystem();
    private renderSystem!: RenderSystem;
    private ai = new AI();

    private mouse: Vector2 = { x: 0, y: 0 };
    private accum = 0;
    private readonly fixedDt = 1 / 60;
    private running = true;

    private massValue = document.querySelector<HTMLSpanElement>('#massValue');
    private leaderboardList = document.querySelector<HTMLOListElement>('#leaderboardList');
    private minimap = document.querySelector<HTMLCanvasElement>('#minimap');
    private gameOverOverlay = document.querySelector<HTMLDivElement>('#gameOver');
    private gameOverText = document.querySelector<HTMLParagraphElement>('#gameOverText');
    private restartBtn = document.querySelector<HTMLButtonElement>('#restartBtn');

    constructor(root: HTMLElement) {
        this.root = root;
        this.app = new Application();
    }

    public async init(): Promise<void> {
        await this.app.init({
            resizeTo: this.root,
            antialias: true,
            backgroundAlpha: 0
        });

        this.root.appendChild(this.app.canvas);

        this.mouse = { x: this.app.screen.width * 0.5, y: this.app.screen.height * 0.5 };

        const playerTexture = await this.loadTextureSafe('/icons/1c.png');
        const player = new Player({
            id: 1,
            name: '1C',
            position: { x: 2500, y: 2500 },
            radius: 26,
            color: 0x58d799,
            texture: playerTexture,
            speedMultiplier: 1.07
        });

        this.world = new World(5000, 5000, player);
        this.camera = new Camera(this.world.container, this.world.width, this.world.height, () => this.app.screen.width, () => this.app.screen.height);

        await this.spawnSystem.preload();
        this.spawnSystem.maintain(this.world, 60, 70);

        this.renderSystem = new RenderSystem(this.world);
        this.app.stage.addChild(this.world.container);

        this.bindInput();
        this.bindUI();
        this.updateHud();

        this.app.ticker.add(() => {
            this.accum += Math.min(0.05, this.app.ticker.deltaMS / 1000);
            while (this.accum >= this.fixedDt) {
                this.update(this.fixedDt);
                this.accum -= this.fixedDt;
            }
            this.render();
        });
    }

    private async loadTextureSafe(path: string): Promise<Texture | undefined> {
        try {
            return await Assets.load(path);
        } catch {
            return undefined;
        }
    }

    private update(dt: number): void {
        if (!this.running) return;

        const playerDir = this.directionToMouseWorld();
        this.movementSystem.updateEntity(this.world.player, playerDir, this.world, dt);

        for (const bot of this.world.bots) {
            this.ai.update(bot, this.world.entities, dt);
            this.movementSystem.updateEntity(bot, bot.targetDirection, this.world, dt);
        }

        const collisions = this.collisionSystem.update(this.world);
        if (collisions.eaten.some((e) => e.id === this.world.player.id)) {
            this.running = false;
            if (this.gameOverText) {
                const top = this.topEntities()[0];
                this.gameOverText.textContent = `Final radius: ${Math.round(this.world.player.radius)} | Dominant language: ${top?.name ?? 'Unknown'}`;
            }
            this.gameOverOverlay?.style.setProperty('display', 'flex');
            return;
        }

        this.spawnSystem.maintain(this.world, 50, 70);
        this.updateHud();
    }

    private render(): void {
        this.camera.update(this.world.player, this.fixedDt);
        this.renderSystem.sync(this.world);
        this.drawMinimap();
    }

    private bindInput(): void {
        this.root.addEventListener('pointermove', (evt) => {
            this.mouse.x = evt.clientX;
            this.mouse.y = evt.clientY;
        });
    }

    private bindUI(): void {
        this.restartBtn?.addEventListener('click', () => window.location.reload());
    }

    private directionToMouseWorld(): Vector2 {
        const scale = this.world.container.scale.x;
        const worldX = (this.mouse.x - this.world.container.position.x) / scale;
        const worldY = (this.mouse.y - this.world.container.position.y) / scale;
        const dx = worldX - this.world.player.position.x;
        const dy = worldY - this.world.player.position.y;
        const len = Math.hypot(dx, dy) || 1;

        return { x: dx / len, y: dy / len };
    }

    private updateHud(): void {
        if (this.massValue) this.massValue.textContent = `${Math.round(this.world.player.radius)}`;
        if (this.leaderboardList) {
            const top = this.topEntities().slice(0, 5);
            this.leaderboardList.innerHTML = top
                .map((entity, idx) => `<li>${idx + 1}. ${entity.name} — ${Math.round(entity.radius)}</li>`)
                .join('');
        }
    }

    private topEntities() {
        return [...this.world.entities].sort((a, b) => b.radius - a.radius);
    }

    private drawMinimap(): void {
        if (!this.minimap) return;
        const ctx = this.minimap.getContext('2d');
        if (!ctx) return;

        const w = this.minimap.width;
        const h = this.minimap.height;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(8, 14, 26, 0.8)';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(160, 185, 255, 0.4)';
        ctx.strokeRect(1, 1, w - 2, h - 2);

        const sx = w / this.world.width;
        const sy = h / this.world.height;

        for (const entity of this.world.entities) {
            const isBigEnemy = !entity.isPlayer && entity.radius > this.world.player.radius * 1.1;
            if (!entity.isPlayer && !isBigEnemy) continue;

            ctx.beginPath();
            ctx.arc(entity.position.x * sx, entity.position.y * sy, Math.max(2, entity.radius * sx * 0.6), 0, Math.PI * 2);
            ctx.fillStyle = entity.isPlayer ? '#5dffb0' : '#ff6b6b';
            ctx.fill();
        }
    }
}
