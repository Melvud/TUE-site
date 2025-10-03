import * as migration_20251003_161301 from './20251003_161301';

export const migrations = [
  {
    up: migration_20251003_161301.up,
    down: migration_20251003_161301.down,
    name: '20251003_161301'
  },
];
