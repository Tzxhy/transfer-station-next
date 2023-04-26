import { api } from "@/api-tools/db";
import { getJsonReq, getResponse } from "@/api-tools/common";
import { getNewString } from "@/api-tools/id";
import { genUserToken } from "@/api-tools/token";
import { NextRequest } from "next/server";
import { support } from "@/api-tools/db";

export const config = {
    runtime: "edge",
    regions: ["hk"], // defaults to 'all'
};

async function nowCanRegister(): Promise<boolean> {
    return support('can_register', true)
}

export default async function handler(req: NextRequest) {
    if (req.method !== "POST") {
        return new Response(null, {
            status: 405, // method not allowed
        });
    }

    const canRegister = await support('can_register', true)
    if (!canRegister) {
        return getResponse(9000001, '未启用该功能');
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
        return getResponse(1000002, "注册失败", null);
    }

    return getResponse(0, "", {
        username: json.username,
        id: userId,
        token: await genUserToken(json.username, newId!),
    });
}
