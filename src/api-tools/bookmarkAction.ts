import { api } from "./db"

export const getBookmarkAction = async (uid: string) => {
    return api.find({
        database: 'transfer',
        collection: 'bookmark_actions',
        filter: {
            uid,
        },
        sort: {
            created_at: -1, // 降序
        },
        limit: 1,
    }).then(d => {
        return d.documents[0] as BookMarkAction;
    }).catch(e => {
        return null;
    })
}

export const addBookmarkAction = async (uid: string, type: string) => {
    return api.insertOne({
        database: 'transfer',
        collection: 'bookmark_actions',
        document: {
            uid,
            type,
            created_at: Date.now(),
        },
    }).then(d => {
        return d.insertedId;
    }).catch(e => {
        return '';
    })
}
