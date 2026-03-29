import { Container } from 'pixi.js';
import { Bot } from './Bot';
import { Entity } from './Entity';
import { Food } from './Food';
import { Player } from './Player';

export class World {
    public readonly width: number;
    public readonly height: number;
    public readonly container: Container;
    public player: Player;
    public playerCells: Player[] = [];
    public entities: Entity[] = [];
    private nextId: number;

    constructor(width: number, height: number, player: Player) {
        this.width = width;
        this.height = height;
        this.player = player;
        this.container = new Container();
        this.nextId = player.id + 1;
        this.addEntity(player);
    }

    public addEntity(entity: Entity): void {
        this.entities.push(entity);
        if (entity instanceof Player) {
            this.playerCells.push(entity);
        }
        this.container.addChild(entity.container);
    }

    public removeEntity(entity: Entity): void {
        entity.isAlive = false;
        this.entities = this.entities.filter((e) => e.id !== entity.id);
        if (entity instanceof Player) {
            this.playerCells = this.playerCells.filter((p) => p.id !== entity.id);
            const biggest = this.playerCells.reduce<Player | undefined>((best, cell) => (!best || cell.radius > best.radius ? cell : best), undefined);
            if (biggest) this.player = biggest;
        }
        this.container.removeChild(entity.container);
        entity.container.destroy({ children: true });
    }

    public get foods(): Food[] {
        return this.entities.filter((e): e is Food => e instanceof Food);
    }

    public get bots(): Bot[] {
        return this.entities.filter((e): e is Bot => e instanceof Bot);
    }

    public takeNextId(): number {
        return this.nextId++;
    }
}
