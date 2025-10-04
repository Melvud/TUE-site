import * as migration_20251004_165010 from './20251004_165010';

export const migrations = [
  {
    up: migration_20251004_165010.up,
    down: migration_20251004_165010.down,
    name: '20251004_165010'
  },
];
