// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getJsonReq, getResponse } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { genUserToken } from "@/api-tools/token";
import type { NextRequest } from "next/server";

export const config = {
  runtime: 'edge',
  regions: ['hk'], // defaults to 'all'
}

type User = {
    uid: string;
    username: string;
    password: string;
    created_at: number;
}

export default async function handler(
  req: NextRequest
) {
    if (req.method !== 'POST') {
        return new Response(null, {
            status: 405, // method not allowed
        });
    }
    const data = await getJsonReq(req)
    const record = await api.findOne({
        dataSource: 'Cluster0',
        database: 'transfer',
        collection: 'users',
        filter: {
            username: data.username,
            password: data.password,
        },
    }).then(d => {

        console.log('d in login then: ', d);
        return d.document as User | null;
    }).catch(e => {
        console.log('e in login catch: ', e);
        return null;
    })

    if (!record) {
        return getResponse(1000003, '用户名或者密码错误')
    }

    const token = await genUserToken(data.username, record.uid)

    return getResponse(0, '', {
        username: data.username,
        token,
    })
}