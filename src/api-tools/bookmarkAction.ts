import { api } from "./db"

export const getBookmarkAction = async (uid: string) => {
    return api.find({
        dataSource: 'Cluster0',
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
        console.log('d in getBookmarkAction: ', d);
        return d.documents[0] as BookMarkAction;
    }).catch(e => {
        console.log('e: ', e);
        return null;
    })
}

export const addBookmarkAction = async (uid: string, type: string) => {
    return api.insertOne({
        dataSource: 'Cluster0',
        database: 'transfer',
        collection: 'bookmark_actions',
        document: {
            // a
        },
    }).then(d => {
        console.log('d in getBookmarkAction: ', d);
        // return d.documents[0] as BookMarkAction;
    }).catch(e => {
        console.log('e: ', e);
        return null;
    })
}
