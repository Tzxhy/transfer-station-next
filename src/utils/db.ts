import Dexie from 'dexie';

const db = new Dexie('store')

db.version(1).stores({
    clipboards: 'id, name, age, email',
})



