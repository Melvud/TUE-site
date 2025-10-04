import * as migration_20251004_165010 from './20251004_165010';
import * as migration_20251004_220408_add_contact_global from './20251004_220408_add_contact_global';
import * as migration_20251004_221733_add_contact_global from './20251004_221733_add_contact_global';

export const migrations = [
  {
    up: migration_20251004_165010.up,
    down: migration_20251004_165010.down,
    name: '20251004_165010',
  },
  {
    up: migration_20251004_220408_add_contact_global.up,
    down: migration_20251004_220408_add_contact_global.down,
    name: '20251004_220408_add_contact_global',
  },
  {
    up: migration_20251004_221733_add_contact_global.up,
    down: migration_20251004_221733_add_contact_global.down,
    name: '20251004_221733_add_contact_global'
  },
];
