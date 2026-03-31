import { Entity, type EntityConfig, type Vector2 } from './Entity';

export class Bot extends Entity {
    public targetDirection: Vector2 = { x: 0, y: 0 };
    // AI can temporarily reduce bot speed while escaping to make gameplay less binary.
    public speedFactor = 1;
    public readonly detectionRadius: number;

    constructor(config: Omit<EntityConfig, 'isPlayer'>) {
        super(config);
        this.detectionRadius = Math.max(300, this.radius * 16);
    }
}
