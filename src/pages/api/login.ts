// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getJsonReq, getResponse } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { genUserToken } from "@/api-tools/token";
import type { NextRequest } from "next/server";
import type { NextApiResponse } from "next";

export const config = {
    runtime: 'nodejs',
}

type User = {
    uid: string;
    username: string;
    password: string;
    created_at: number;
}

export default async function handler(
    req: NextRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).end(); // method not allowed
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
        return d.document as User | null;
    }).catch(e => {
        return null;
    })

    if (!record) {
        return getResponse(res, 1000003, '用户名或者密码错误')
    }

    const token = await genUserToken(data.username, record.uid)

    return getResponse(res, 0, '', {
        username: data.username,
        token,
    })
}