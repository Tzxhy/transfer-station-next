import { getResponse, paramNotValid, getJsonReq } from '@/api-tools/common';
import { api } from "@/api-tools/db";
import { getNewString } from "@/api-tools/id";
import { HeaderKey } from '@/constants/string';
import { NextRequest } from 'next/server';
import type { NextApiResponse } from 'next';


export const config = {
    runtime: 'nodejs',
}

const ApiDefaultConfig = {

    database: 'transfer',
    collection: 'clipboards',
}

type Text = {
  rid: string;
  uid: string;
  type: 'text';
  content: string;
  note: string;
  created_at: number;
}

export default async function handler(
    req: NextRequest,
    res: NextApiResponse,
) {
    switch (req.method.toLowerCase()) {
    case 'get':
        return GET(req, res);
    case 'post':
        return POST(req, res);
    case 'patch':
        return PATCH(req, res);
    default:
        break;
    }
}

async function GET(req: NextRequest, res: NextApiResponse) {
    const h = req.headers as unknown as Record<string, string | undefined>;
    const uid = h[HeaderKey.UID];
    const data = await api.find({
        ...ApiDefaultConfig,
        filter: {
            uid,
        },
        sort: {
            created_at: -1,
        }
    }).then(d => {
        return d.documents as Text[]
    }).catch(e => {
        return [] as Text[];
    });

    return getResponse(res, 0, '', {
        list: data,
        total_count: data.length,
    })
}

async function POST(req: NextRequest, res: NextApiResponse) {
    const h = req.headers as unknown as Record<string, string | undefined>;
    const uid = h[HeaderKey.UID];
    const jsonReq = await getJsonReq(req) as {
        list: ClipBoard[];
    }
    const rids = [] as string[];
    const now = Date.now();
    const successLength = await api.insertMany({
        ...ApiDefaultConfig,
        documents: jsonReq.list.map(i => ({
            rid: (() => {
                const r = getNewString();
                rids.push(r);
                return r;
            })(),
            uid,
            type: 'text',
            content: i.content,
            note: i.note || '',
            created_at: now,
        })),
    }).then(d => {
        return d.insertedIds.length;
    }).catch(e => {
        return 0;
    })
    return getResponse(res, 0, '', {
        ids: rids,
        successCount: successLength,
        created_at: now,
    });
}

// 删除ids
async function PATCH(req: NextRequest, res: NextApiResponse) {
    const h = req.headers as unknown as Record<string, string | undefined>;
    const uid = h[HeaderKey.UID];
    const jsonReq = await getJsonReq(req) as {
        ids: string[];
        action: 'delete' | 'delete-all'
    };
    if (jsonReq.action === 'delete' && (!jsonReq.ids || !jsonReq.ids.length)) {
        return paramNotValid(res);
    }
    const filter = {
        uid,
    } as Record<string, any>;
    if (jsonReq.action === 'delete') {
        filter._id = {
            $in: jsonReq.ids.map(i => ({
                $oid: i,
            }))
        }
    }
    console.log('uid: ', '`' + uid + '`');
    const count = await api.deleteMany({
        ...ApiDefaultConfig,
        filter,
    }).then(d => {
        return d.deletedCount;
    }).catch(e => {
        console.log('e: ', e);
        return 0;
    })
    return getResponse(res, 0, '', {
        successCount: count,
    })
}