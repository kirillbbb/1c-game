import { Graphics } from 'pixi.js';
import type { World } from '../World';

export class RenderSystem {
    private readonly grid: Graphics;

    constructor(world: World) {
        this.grid = new Graphics();
        this.drawBackgroundGrid(world.width, world.height);
        world.container.addChildAt(this.grid, 0);
    }

    public sync(world: World): void {
        world.entities.forEach((entity) => entity.syncVisual());
    }

    /**
     * Draw world background safely with Pixi v8-compatible Graphics API.
     */
    private drawBackgroundGrid(width: number, height: number): void {
        this.grid.clear();
        this.grid.rect(0, 0, width, height).fill({ color: 0x0a1224 });

        const step = 120;
        for (let x = 0; x <= width; x += step) {
            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, height);
            this.grid.stroke({ color: 0x20345a, alpha: 0.18, width: 1 });
        }

        for (let y = 0; y <= height; y += step) {
            this.grid.moveTo(0, y);
            this.grid.lineTo(width, y);
            this.grid.stroke({ color: 0x20345a, alpha: 0.18, width: 1 });
        }
    }
}
