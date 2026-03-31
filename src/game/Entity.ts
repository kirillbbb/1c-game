import { Graphics, Sprite, Text, Texture, Container } from 'pixi.js';

export type Personality = 'aggressive' | 'coward' | 'neutral';

export interface Vector2 {
    x: number;
    y: number;
}

export interface EntityConfig {
    id: number;
    name: string;
    position: Vector2;
    radius: number;
    color: number;
    texture?: Texture;
    speedMultiplier?: number;
    personality?: Personality;
    isPlayer?: boolean;
    showLabel?: boolean;
}

export class Entity {
    public readonly id: number;
    public readonly name: string;
    public position: Vector2;
    public velocity: Vector2;
    public radius: number;
    public readonly color: number;
    public readonly texture?: Texture;
    public readonly isPlayer: boolean;
    public isAlive = true;
    public personality: Personality;
    public speedMultiplier: number;
    public readonly showLabel: boolean;

    public readonly container: Container;
    private readonly fallback: Graphics;
    private readonly sprite: Sprite;
    private readonly label: Text;

    constructor(config: EntityConfig) {
        this.id = config.id;
        this.name = config.name;
        this.position = { ...config.position };
        this.velocity = { x: 0, y: 0 };
        this.radius = config.radius;
        this.color = config.color;
        this.texture = config.texture;
        this.isPlayer = config.isPlayer ?? false;
        this.showLabel = config.showLabel ?? true;
        this.personality = config.personality ?? 'neutral';
        this.speedMultiplier = config.speedMultiplier ?? 1;

        this.container = new Container();
        this.fallback = new Graphics();
        this.sprite = new Sprite(this.texture ?? Texture.EMPTY);
        this.sprite.anchor.set(0.5);
        this.sprite.visible = this.texture !== undefined;

        this.label = new Text({
            text: this.name,
            style: {
                fill: '#eff4ff',
                fontSize: 13,
                fontWeight: '700',
                stroke: { color: '#051026', width: 3 }
            }
        });
        this.label.anchor.set(0.5, 0.5);
        this.label.visible = this.showLabel;

        this.container.addChild(this.fallback, this.sprite, this.label);
        this.syncVisual();
    }

    public syncVisual(): void {
        this.container.position.set(this.position.x, this.position.y);
    
        this.fallback.clear();
    
        if (!this.texture) {
            this.fallback.circle(0, 0, this.radius).fill({ color: this.color, alpha: 0.94 });
            this.fallback.circle(0, 0, this.radius).stroke({ color: 0xffffff, width: 2, alpha: 0.22 });
        }
    
        if (this.sprite.visible) {
            const size = this.radius * 1.7;
            this.sprite.width = size;
            this.sprite.height = size;
        }
    
        if (this.showLabel) {
            this.label.style.fontSize = Math.max(10, Math.min(18, this.radius * 0.4));
            this.label.position.y = this.radius + 14;
        }
    }
}
