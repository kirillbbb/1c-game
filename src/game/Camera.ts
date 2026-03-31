import type { Container } from 'pixi.js';
import type { Vector2 } from './Entity';

export type CameraFocus = {
    position: Vector2;
    radius: number;
};

export class Camera {
    private readonly viewportWidth: () => number;
    private readonly viewportHeight: () => number;
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private readonly container: Container;

    constructor(
        container: Container,
        worldWidth: number,
        worldHeight: number,
        viewportWidth: () => number,
        viewportHeight: () => number
    ) {
        this.container = container;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
    }

    public update(focus: CameraFocus, dt: number): void {
        const w = this.viewportWidth();
        const h = this.viewportHeight();


        const targetScale = Math.max(0.42, Math.min(1.08, 115 / (focus.radius + 45)));
        const zoomLerp = 1 - Math.exp(-dt * 5);

        this.container.scale.x += (targetScale - this.container.scale.x) * zoomLerp;
        this.container.scale.y = this.container.scale.x;

        const scale = this.container.scale.x;


        let targetX = -focus.position.x * scale + w / 2;
        let targetY = -focus.position.y * scale + h / 2;


        const minX = -(this.worldWidth * scale - w);
        const minY = -(this.worldHeight * scale - h);

        targetX = Math.min(0, Math.max(minX, targetX));
        targetY = Math.min(0, Math.max(minY, targetY));


        const posLerp = 1 - Math.exp(-dt * 7);

        this.container.position.x += (targetX - this.container.position.x) * posLerp;
        this.container.position.y += (targetY - this.container.position.y) * posLerp;
    }
}
