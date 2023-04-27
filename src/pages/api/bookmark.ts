import NodeUrl from 'url';

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { addBookmarkAction, getBookmarkAction } from "@/api-tools/bookmarkAction";
import { getHostname, getJsonReq, getResponse, paramNotValid } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { ImageError, getIconsByDomains, setIconByDomain } from "@/api-tools/icons";
import { HeaderKey } from "@/constants/string";
import type { NextRequest } from "next/server";
import { runTask } from '@/utils/function';

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
    case 'put':
        return PUT(req);
    default:
        break;
    }
}

const ApiDefaultConfig = {
    dataSource: 'Cluster0',
    database: 'transfer',
    collection: 'bookmarks',
}

// 修改
async function PUT(req: NextRequest) {
    const h = req.headers;
    const uid = h.get(HeaderKey.UID) as string;
    const jsonReq = await getJsonReq(req) as {
        _id: string;
        class: string;
        title: string;
        link: string;
        icon: string;
    }

    const hostname = getHostname(jsonReq.link)
    if (!jsonReq.icon) {
        if (jsonReq.icon === ImageError) {
            jsonReq.icon = ''
        } else {
            await setIconByDomain(hostname, jsonReq.icon)
        }
    }

    const isUpdated = await api.updateOne({
        ...ApiDefaultConfig,
        filter: {
            uid,
            _id: {
                $oid: jsonReq._id,
            }
        },
        update: {
            $set: {
                class: jsonReq.class,
                title: jsonReq.title,
                link: jsonReq.link,
                icon: jsonReq.icon,
            },
        },
    }).then(d => {
        return !!d.modifiedCount
    }).catch(e => {
        return false;
    })

    let aid = ''
    if (isUpdated) {
        aid = await addBookmarkAction(uid, 'modify');
    }

    return getResponse(0, '', {
        succ: isUpdated,
        aid,
    })
}



async function GET(req: NextRequest) {
    const h = req.headers;
    const uid = h.get(HeaderKey.UID) as string;
    const n = new URL(req.url);
    
    const jsonReq =  {
        last_anchor: n.searchParams.get('last_anchor') || '',
    };

    const lastAction = await getBookmarkAction(uid)
    if (jsonReq.last_anchor) { // 查找相对
        if (lastAction?._id === jsonReq.last_anchor) {
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

    const lastAnchor = lastAction?._id ?? ''

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
        const aid = await addBookmarkAction(uid, 'add')
        return getResponse(0, '', {
            id: newId,
            aid,
        })
    }
    return getResponse(0, '', {
        id: '',
        aid: '',
    })

}

async function PATCH(req: NextRequest) {
    const h = req.headers;
    const uid = h.get(HeaderKey.UID) as string;
    const jsonReq = await getJsonReq(req) as {
        list?: Pick<BookMark, 'class' | 'title' | 'link' | 'icon'>[];
        action: 'import' | 'delete' | 'delete-all' | 'update';
        ids?: string[];
        updateList?: BookMark[];
    };
    if (![
        'import',
        'delete',
        'delete-all',
        'update',
    ].includes(jsonReq.action)) {
        return paramNotValid();
    }
    if (jsonReq.action === 'delete' && (!jsonReq.ids || !jsonReq.ids.length)) {
        return paramNotValid();
    }
    if (jsonReq.action === 'import' && (!jsonReq.list || !jsonReq.list.length)) {
        return paramNotValid();
    }
    if (jsonReq.action === 'update' && (!jsonReq.updateList || !jsonReq.updateList.length)) {
        return paramNotValid();
    }
    const getAid = (type: string) => addBookmarkAction(uid, type)
    
    if (jsonReq.action === 'import') {
        const newIds = await importList(uid, jsonReq.list!);
        return getResponse(0, '', {
            ids: newIds,
            successCount: newIds.length,
            aid: await getAid('import'),
        })
    }
    if (jsonReq.action === 'delete') {
        return getResponse(0, '', {
            successCount: await deleteList(uid, jsonReq.ids!),
            aid: await getAid('delete'),
        })
    }

    if (jsonReq.action === 'delete-all') {
        return getResponse(0, '', {
            successCount: await deleteAll(uid),
            aid: await getAid('delete-all'),
        })
    }
    if (jsonReq.action === 'update') {
        return getResponse(0, '', {
            successCount: await updateList(uid, jsonReq.updateList!),
            aid: await getAid('update'),
        })
    }

}

async function updateList(uid: string, list: BookMark[]): Promise<number> {
    await Promise.all(list.map(i => {
        const hostname = getHostname(i.link)
        if (!i.icon) {
            if (i.icon === ImageError) {
                i.icon = ''
            } else {
                return setIconByDomain(hostname, i.icon)
            }
        }
        return Promise.resolve();
    }))

    const tasks = list.map(i => () => api.updateOne({
        ...ApiDefaultConfig,
        filter: {
            uid,
            _id: {
                $oid: i._id,
            },
        },
        update: {
            $set: {
                class: i.class,
                title: i.title,
                link: i.link,
                domain: getHostname(i.link),
                icon: i.icon || '',
            },
        },
    }))

    const [successCount, failCount] = await runTask(tasks);

    return successCount;
}

async function importList(uid: string, list: Pick<BookMark, 'class' | 'title' | 'link' | 'icon'>[]): Promise<string[]> {
    return api.insertMany<BookMark>({
        ...ApiDefaultConfig,
        documents: list.map(i => ({
            ...i,
            uid,
            domain: getHostname(i.link),
        })),
    }).then(d => {
        return d.insertedIds as string[];
    }).catch(e => {
        return [] as string[];
    })
}

async function deleteList(uid: string, list: string[]): Promise<number> {
    return api.deleteMany({
        ...ApiDefaultConfig,
        filter: {
            uid,
            _id: {
                $in: list.map(i => ({
                    $oid: i,
                }))
            },
        }
    }).then(d => {
        return d.deletedCount;
    }).catch(e => {
        return 0;
    })
}

async function deleteAll(uid: string): Promise<number> {
    return api.deleteMany({
        ...ApiDefaultConfig,
        filter: {
            uid,
        }
    }).then(d => {
        return d.deletedCount;
    }).catch(e => {
        return 0;
    })
}