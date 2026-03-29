import { Entity, type EntityConfig } from './Entity';

export class Player extends Entity {
    constructor(config: Omit<EntityConfig, 'isPlayer'>) {
        super({ ...config, isPlayer: true });
    }
}
