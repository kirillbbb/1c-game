import { Entity, type EntityConfig } from './Entity';

export class Food extends Entity {
    constructor(config: Omit<EntityConfig, 'isPlayer' | 'showLabel'>) {
        super({ ...config, isPlayer: false, showLabel: false });
    }
}
