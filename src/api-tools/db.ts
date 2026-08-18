import { MongoClient, MongoClientOptions, ObjectId } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
};
const client = new MongoClient(process.env.MONGODB_URI as string, options);
   
// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(client);

// ==========================================================
// 基于原生 mongodb 驱动实现的 api 对象，接口与原 mongodb-data-api 保持一致，
// 因此调用方（icons / bookmarkAction / register / login / bookmark / text 等）
// 无需改动即可继续使用 { dataSource, database, collection, filter, ... } 结构。
// ==========================================================

type ApiRequest = {
    dataSource?: string;
    database: string;
    collection: string;
    filter?: any;
    sort?: any;
    limit?: number;
    document?: any;
    documents?: any[];
    update?: any;
    upsert?: boolean;
};

// 递归把 Data API 的 $oid 写法转成驱动的 ObjectId
const toObjectId = (value: any): any => {
    if (value == null || typeof value !== 'object') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(toObjectId);
    }
    if (typeof value.$oid === 'string') {
        return new ObjectId(value.$oid);
    }
    const ret: any = {};
    for (const key in value) {
        ret[key] = toObjectId(value[key]);
    }
    return ret;
};

// 查询结果中的 _id 是 ObjectId，转成字符串以保持与原 Data API 返回值一致
const toHexId = (doc: any): any => {
    if (doc && doc._id instanceof ObjectId) {
        doc._id = doc._id.toHexString();
    }
    return doc;
};

const getCollection = (database: string, name: string) => {
    return client.db(database).collection(name);
};

export const api = {
    find: async (req: ApiRequest) => {
        const documents = await getCollection(req.database, req.collection)
            .find(toObjectId(req.filter ?? {}), { sort: req.sort, limit: req.limit })
            .toArray();
        return { documents: documents.map(d => toHexId(d)) };
    },
    findOne: async (req: ApiRequest) => {
        const document = await getCollection(req.database, req.collection).findOne(toObjectId(req.filter ?? {}));
        return { document: document ? toHexId(document) : null };
    },
    insertOne: async (req: ApiRequest) => {
        const r = await getCollection(req.database, req.collection).insertOne(req.document);
        const insertedId = r.insertedId instanceof ObjectId ? r.insertedId.toHexString() : r.insertedId;
        return { insertedId };
    },
    insertMany: async <T = any>(req: ApiRequest): Promise<{ insertedIds: string[] }> => {
        const r = await getCollection(req.database, req.collection).insertMany((req.documents ?? []) as any);
        const insertedIds = (Array.isArray(r.insertedIds) ? r.insertedIds : Object.values(r.insertedIds as any))
            .map(i => (i instanceof ObjectId ? i.toHexString() : i));
        return { insertedIds: insertedIds as string[] };
    },
    updateOne: async (req: ApiRequest) => {
        const r = await getCollection(req.database, req.collection).updateOne(
            toObjectId(req.filter ?? {}),
            req.update,
            { upsert: req.upsert },
        );
        const upsertedId = r.upsertedId
            ? (r.upsertedId instanceof ObjectId ? r.upsertedId.toHexString() : r.upsertedId)
            : '';
        return {
            matchedCount: r.matchedCount,
            modifiedCount: r.modifiedCount,
            upsertedId,
        };
    },
    deleteMany: async (req: ApiRequest) => {
        const r = await getCollection(req.database, req.collection).deleteMany(toObjectId(req.filter ?? {}));
        return { deletedCount: r.deletedCount };
    },
};


export const insertOne = async <T>(connectionName: string, key: string, value: T) => {
    return client.db('transfer').collection(connectionName).insertOne({
        name: key,
        value,
    })
}