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
    private static readonly MAX_PLAYER_CELLS = 8;
    private static readonly MIN_SPLIT_RADIUS = 24;
    private static readonly EJECTED_RADIUS = 4.8;
    private static readonly MIN_CELL_RADIUS_AFTER_EJECT = 12;

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
    private splitPressed = false;
    private ejectPressed = false;

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
        this.spawnSystem.maintain(this.world, 40, 50, 230, 270);

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
        for (const cell of this.world.playerCells) {
            this.movementSystem.updateEntity(cell, playerDir, this.world, dt);
        }

        for (const bot of this.world.bots) {
            this.ai.update(bot, this.world.entities, dt);
            this.movementSystem.updateEntity(bot, bot.targetDirection, this.world, dt);
        }

        this.integrateFood(dt);
        this.world.player = this.world.playerCells.reduce((best, cell) => (cell.radius > best.radius ? cell : best), this.world.player);

        if (this.splitPressed) {
            this.splitPlayer(playerDir);
            this.splitPressed = false;
        }
        if (this.ejectPressed) {
            this.ejectMass(playerDir);
        }

        this.collisionSystem.update(this.world);
        if (this.world.playerCells.length === 0) {
            this.running = false;
            if (this.gameOverText) {
                const top = this.topEntities()[0];
                this.gameOverText.textContent = `Final radius: ${Math.round(this.world.player.radius)} | Dominant language: ${top?.name ?? 'Unknown'}`;
            }
            this.gameOverOverlay?.style.setProperty('display', 'flex');
            return;
        }

        this.spawnSystem.maintain(this.world, 36, 50, 220, 280);
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
        window.addEventListener('keydown', (evt) => {
            if (evt.code === 'Space') this.splitPressed = true;
            if (evt.code === 'KeyW') this.ejectPressed = true;
        });
        window.addEventListener('keyup', (evt) => {
            if (evt.code === 'KeyW') this.ejectPressed = false;
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
        const totalPlayerMass = this.world.playerCells.reduce((sum, cell) => sum + cell.radius, 0);
        if (this.massValue) this.massValue.textContent = `${Math.round(totalPlayerMass)}`;
        if (this.leaderboardList) {
            const top = this.topEntities().slice(0, 5);
            this.leaderboardList.innerHTML = top
                .map((entity, idx) => `<li>${idx + 1}. ${entity.name} — ${Math.round(entity.radius)}</li>`)
                .join('');
        }
    }

    private topEntities() {
        return [...this.world.entities].filter((entity) => entity.name).sort((a, b) => b.radius - a.radius);
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

    private integrateFood(dt: number): void {
        const drag = 1 - Math.exp(-dt * 9);
        for (const food of this.world.foods) {
            food.velocity.x += (0 - food.velocity.x) * drag;
            food.velocity.y += (0 - food.velocity.y) * drag;
            food.position.x += food.velocity.x * dt;
            food.position.y += food.velocity.y * dt;
            food.position.x = Math.max(food.radius, Math.min(this.world.width - food.radius, food.position.x));
            food.position.y = Math.max(food.radius, Math.min(this.world.height - food.radius, food.position.y));
        }
    }

    private splitPlayer(direction: Vector2): void {
        if (this.world.playerCells.length >= 8) return;
        const splitSource = this.world.playerCells.reduce((best, cell) => (cell.radius > best.radius ? cell : best), this.world.playerCells[0]);
        if (!splitSource || splitSource.radius < 24) return;

        const norm = Math.hypot(direction.x, direction.y) || 1;
        const dir = { x: direction.x / norm, y: direction.y / norm };
        const newRadius = splitSource.radius / 2;
        splitSource.radius = newRadius;

        const spawnOffset = newRadius * 1.9;
        const newCell = new Player({
            id: this.world.takeNextId(),
            name: '1C',
            position: {
                x: splitSource.position.x + dir.x * spawnOffset,
                y: splitSource.position.y + dir.y * spawnOffset
            },
            radius: newRadius,
            color: splitSource.color,
            speedMultiplier: splitSource.speedMultiplier
        });
        newCell.velocity.x = dir.x * 560;
        newCell.velocity.y = dir.y * 560;
        this.world.addEntity(newCell);
    }

    private ejectMass(direction: Vector2): void {
        const norm = Math.hypot(direction.x, direction.y) || 1;
        const dir = { x: direction.x / norm, y: direction.y / norm };
        for (const cell of this.world.playerCells) {
            if (cell.radius < 18) continue;
            cell.radius = Math.max(12, cell.radius - 1.15);
            const spawnPos = {
                x: cell.position.x + dir.x * (cell.radius + 8),
                y: cell.position.y + dir.y * (cell.radius + 8)
            };
            const pellet = this.spawnSystem.burstFood(this.world, spawnPos, dir);
            this.world.addEntity(pellet);
            cell.velocity.x -= dir.x * 80;
            cell.velocity.y -= dir.y * 80;
        }
    }
}
