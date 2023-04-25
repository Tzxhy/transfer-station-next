// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextRequest } from "next/server";

export const config = {
  runtime: 'edge',
  regions: ['hk'], // defaults to 'all'
}

type Data = any;

export default async function handler(
  req: NextRequest
) {
    if (req.method !== 'POST') {
        return new Response(null, {
            status: 405, // method not allowed
        });
    }
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
        console.log('json: ', json);
    } catch(e) {
        return new Response(null, {
            status: 401,
        })
    }

    return new Response(JSON.stringify({}), {
        headers: {
            'content-type': 'application/json;charset=utf-8'
        }
    });
}