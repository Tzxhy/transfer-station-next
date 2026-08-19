import { getJsonReq, getResponse } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { HeaderKey } from "@/constants/string";
import type { NextRequest } from "next/server";
import type { NextApiResponse } from "next";

export const config = {
    runtime: 'nodejs',
}

type User = {
    uid: string;
    username: string;
    password: string;
}

export default async function handler(
    req: NextRequest,
    res: NextApiResponse,
) {
    if (req.method !== 'POST') {
        return res.status(405).end(); // method not allowed
    }
    const h = req.headers as unknown as Record<string, string | undefined>;
    const uid = h[HeaderKey.UID] as string;
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }

    const data = await getJsonReq(req) as {
        oldPassword?: string;
        newPassword?: string;
    }
    if (!data.oldPassword || !data.newPassword) {
        return getResponse(res, -1, '参数校验失败');
    }

    const user = await api.findOne({
        database: 'transfer',
        collection: 'users',
        filter: {
            uid,
        },
    }).then(d => {
        return d.document as User | null;
    }).catch(e => {
        return null;
    })

    if (!user || user.password !== data.oldPassword) {
        return getResponse(res, -1, '原密码错误');
    }

    const result = await api.updateOne({
        database: 'transfer',
        collection: 'users',
        filter: {
            uid,
        },
        update: {
            $set: {
                password: data.newPassword,
            },
        },
    }).then(d => {
        return d.matchedCount > 0;
    }).catch(e => {
        return false;
    })

    if (!result) {
        return getResponse(res, -1, '修改失败');
    }

    return getResponse(res, 0, '', {
        success: true,
    })
}