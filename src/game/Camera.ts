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

        const desiredZoom = Math.max(0.42, Math.min(1.08, 115 / (focus.radius + 45)));
        const zoomLerp = 1 - Math.exp(-dt * 5);
        this.container.scale.x += (desiredZoom - this.container.scale.x) * zoomLerp;
        this.container.scale.y = this.container.scale.x;

        const scaledHalfW = w / (2 * this.container.scale.x);
        const scaledHalfH = h / (2 * this.container.scale.y);

        const targetX = Math.max(scaledHalfW, Math.min(this.worldWidth - scaledHalfW, focus.position.x));
        const targetY = Math.max(scaledHalfH, Math.min(this.worldHeight - scaledHalfH, focus.position.y));

        const desiredWorldX = -targetX + scaledHalfW;
        const desiredWorldY = -targetY + scaledHalfH;

        const posLerp = 1 - Math.exp(-dt * 7);
        this.container.position.x += (desiredWorldX - this.container.position.x) * posLerp;
        this.container.position.y += (desiredWorldY - this.container.position.y) * posLerp;
    }
}
