import { Container } from 'pixi.js';
import { Bot } from './Bot';
import { Entity } from './Entity';
import { Player } from './Player';

export class World {
    public readonly width: number;
    public readonly height: number;
    public readonly container: Container;
    public player: Player;
    public entities: Entity[] = [];

    constructor(width: number, height: number, player: Player) {
        this.width = width;
        this.height = height;
        this.player = player;
        this.container = new Container();
        this.addEntity(player);
    }

    public addEntity(entity: Entity): void {
        this.entities.push(entity);
        this.container.addChild(entity.container);
    }

    public removeEntity(entity: Entity): void {
        entity.isAlive = false;
        this.entities = this.entities.filter((e) => e.id !== entity.id);
        this.container.removeChild(entity.container);
        entity.container.destroy({ children: true });
    }

    public get bots(): Bot[] {
        return this.entities.filter((e): e is Bot => e instanceof Bot);
    }
}
