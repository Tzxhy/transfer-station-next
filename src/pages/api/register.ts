import { api } from "@/api-tools/db";
import { getJsonReq, getResponse } from "@/api-tools/common";
import { getNewString } from "@/api-tools/id";
import { genUserToken } from "@/api-tools/token";
import { NextRequest } from "next/server";
import type { NextApiResponse } from "next";
import { get } from '@vercel/global-config';

export const config = {
    runtime: "nodejs",
};

async function nowCanRegister(): Promise<boolean> {
    return await get<boolean>('ALLOW_REGISTER') ?? false;
}

export default async function handler(req: NextRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).end(); // method not allowed
    }

    const canRegister = await nowCanRegister();
    if (!canRegister) {
        return getResponse(res, 9000001, '未启用该功能');
    }

    const json = (await getJsonReq(req)) as {
        username: string;
        password: string;
    };
    const userId = getNewString();
    const newId = await api
        .insertOne({
            dataSource: "Cluster0",
            database: "transfer",
            collection: "users",
            document: {
                uid: userId,
                username: json.username,
                password: json.password,
                created_at: Date.now(),
            },
        })
        .then((d) => {
            return d.insertedId;
        })
        .catch((e) => {
            console.log("注册失败");
            // 注册失败
            return "";
        });

    if (!newId) {
        return getResponse(res, 1000002, "注册失败", null);
    }

    return getResponse(res, 0, "", {
        username: json.username,
        id: userId,
        token: await genUserToken(json.username, newId!),
    });
}
