import type { NextRequest } from "next/server";



export const getResponse = <T>(code: number, message: string, data?: T) => new Response(JSON.stringify({
    code,
    message,
    data,
}), {
    headers: {
        'content-type': 'application/json;charset=utf-8',
    },
})

export const paramNotValid = () => getResponse(-1, '参数校验失败');

export const getJsonReq = async (req: NextRequest) => {
    const reader = req.body?.getReader()!
    let v = new Uint8Array(0);
    await reader.read().then<any>(function p({done, value}) {
        if (done) {
            return;
        }
        const l = v.byteLength + value.byteLength
        const nv = new Uint8Array(l)
        nv.set(v);
        nv.set(value, v.byteLength)
        v = nv;
        return reader.read().then(p);
    })
    const e = new TextDecoder('utf-8')
    const decoded = e.decode(v)
    try {
        const json = JSON.parse(decoded)
        return json;
    } catch(e) {
        return null;
    }
}

export const getHostname = (s: string) => {
    try {
        const n = new URL(s);
        return n.hostname;
    } catch(e) {
        return '';
    }
}