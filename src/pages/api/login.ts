// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getJsonReq, getResponse } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { genUserToken } from "@/api-tools/token";
import { clearLoginFail, getBlockRemainingSeconds, getClientIp, recordLoginFail } from "@/api-tools/loginLimiter";
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
    const ip = getClientIp(req);

    // 多次登录失败后拦截该 IP，拦截失效指数递增（5min 起，依次乘 2）
    const remaining = await getBlockRemainingSeconds(ip);
    if (remaining > 0) {
        return getResponse(res, 1000004, `登录失败次数过多，请 ${Math.ceil(remaining / 60)} 分钟后再试`)
    }

    const data = await getJsonReq(req)
    const record = await api.findOne({
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
        await recordLoginFail(ip);
        return getResponse(res, 1000003, '用户名或者密码错误')
    }

    await clearLoginFail(ip);

    const token = await genUserToken(data.username, record.uid)

    return getResponse(res, 0, '', {
        username: data.username,
        token,
    })
}