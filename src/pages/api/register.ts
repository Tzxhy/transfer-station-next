
import {
    api
} from '@/api-tools/db';
import { getJsonReq, getResponse } from "@/api-tools/common";
import { getNewString } from "@/api-tools/id";
import { genUserToken } from "@/api-tools/token";
import { NextRequestWithContext } from '@/global';

export const config = {
  runtime: 'edge',
  regions: ['hk'], // defaults to 'all'
}

export default async function handler(
  req: NextRequestWithContext
) {
    if (req.method !== 'POST') {
        return new Response(null, {
            status: 405, // method not allowed
        });
    }
    const json = await getJsonReq(req)

    const newId = await api.insertOne({
        dataSource: 'Cluster0',
        database: 'transfer',
        collection: 'users',
        document: {
            uid: getNewString(),
            username: json.username,
            password: json.password,
            created_at: Date.now(),
        }
    }).then(d => {
        return d.insertedId;
    }).catch(e => {
        console.log('注册失败');
        // 注册失败
        return ''
    })

    if (!newId) {
        return getResponse(-1, '注册失败', null)
    }

    return getResponse(0, '', {
        username: json.username,
        id: newId,
        token: await genUserToken(json.username, newId!),
    })
}