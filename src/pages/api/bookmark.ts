import NodeUrl from 'url';

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getBookmarkAction } from "@/api-tools/bookmarkAction";
import { getJsonReq, getResponse } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { ImageError, getIconsByDomains } from "@/api-tools/icons";
import { HeaderKey } from "@/constants/string";
import type { NextRequest } from "next/server";

export const config = {
    runtime: "edge",
    regions: ["hk"], // defaults to 'all'
};

type Data = any;

export default async function handler(req: NextRequest) {
    switch (req.method.toLowerCase()) {
    case 'get':
        return GET(req);
    case 'post':
        return POST(req);
    case 'patch':
        return PATCH(req);
    default:
        break;
    }
}

const ApiDefaultConfig = {
    dataSource: 'Cluster0',
    database: 'transfer',
    collection: 'bookmarks',
}

async function GET(req: NextRequest) {
    const h = req.headers;
    const uid = h.get(HeaderKey.UID) as string;
    const n = new URL(req.url);
    
    const jsonReq =  {
        last_anchor: Number(n.searchParams.get('last_anchor') || 0),
    };

    const lastAction = await getBookmarkAction(uid)
    if (jsonReq.last_anchor) { // 查找相对
        console.log('lastAction: ', lastAction);
        if (lastAction?.aid === jsonReq.last_anchor) {
            return getResponse(0, '', {
                list: [],
                last_anchor_match: true,
                last_anchor: jsonReq.last_anchor,
                icons: {},
            });
        }
    }

    const datas = await api.find({
        ...ApiDefaultConfig,
        filter: {
            uid,
        }
    }).then(d => {
        return (d.documents || []) as BookMark[];
    }).catch(e => {
        return [] as BookMark[];
    });

    let hostnames = datas.map(i => {
        const u = new URL(i.link);
        return u.hostname;
    });

    hostnames = [...new Set(hostnames)];

    const icons = await getIconsByDomains(hostnames)

    const faviconObj = {} as Record<string, {id: number; icon: string;}>
    icons.forEach(i => {
        faviconObj[i.domain] = {
            id: i.id,
            icon: i.image,
        }
    });

    datas.forEach(i => {
        const h = new URL(i.link).hostname;
        if (h in faviconObj) {
            i.icon = ''
        }
    })

    const faviconRetObj = {} as Record<string, string>;
    for (const k in faviconObj) {
        faviconRetObj[k] = faviconObj[k].icon
    }

    faviconRetObj['*'] = ImageError;

    const lastAnchor = lastAction?.aid ?? 0

    return getResponse(0, '', {
        list: datas,
        icons: faviconRetObj,
        last_anchor_match: false,
        last_anchor: lastAnchor,
    })
}
// 添加一项
async function POST(req: NextRequest) {
    const h = req.headers;
    const uid = h.get(HeaderKey.UID) as string;
    const jsonReq = await getJsonReq(req) as {
        class: string;
        title: string;
        link: string;
        icon: string;
    }

    const parse = NodeUrl.parse(jsonReq.link)

    const {
        hostname,
    } = parse;

    const newId = await api.insertOne({
        ...ApiDefaultConfig,
        document: {
            created_at: Date.now(),
            class: jsonReq.class,
            title: jsonReq.title,
            link: jsonReq.link,
            icon: '',
            icon_id: 0,
        } as Omit<BookMark, '_id'>,
    }).then(d => {
        return d.insertedId;
    }).catch(e => {
        return '';
    });

    if (newId) {
        
    }

}

async function PATCH(req: NextRequest) {
    
}