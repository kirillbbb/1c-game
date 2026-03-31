import type { World } from '../World';

export class RenderSystem {
    constructor(world: World) {}

    public sync(world: World): void {
        world.entities.forEach((entity) => entity.syncVisual());
    }
}