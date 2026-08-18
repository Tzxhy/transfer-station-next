import type { NextRequest } from "next/server";
import type { NextApiResponse } from "next";



export const getResponse = <T>(res: NextApiResponse, code: number, message: string, data?: T) => {
    res.json({
        code,
        message,
        data,
    });
}

export const paramNotValid = (res: NextApiResponse) => getResponse(res, -1, '参数校验失败');

export const getJsonReq = async (req: NextRequest) => {
    // pages/api 的 req.body 已由 bodyParser 解析为 JSON 对象，经过 proxy 转发后可能退化为 JSON 字符串
    let body = (req as any).body ?? null;
    if (typeof body === 'string') {
        try {
            body = body ? JSON.parse(body) : null;
        } catch (e) {
            body = null;
        }
    }
    return body;
}

export const getHostname = (str: string) => {
    if (!str.startsWith('http')) {
        str = 'http:' + (
            str.includes('//') ? '' : '//'
        ) + str;
    }
    try {
        const n = new URL(str);
        return n.hostname;
    } catch(e) {
        return '';
    }
}