import { getJsonReq, getResponse, paramNotValid } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { getNewString } from "@/api-tools/id";
import { HeaderKey } from "@/constants/string";
import type { NextRequest } from "next/server";
import type { NextApiResponse } from "next";
import { randomInt } from 'crypto';

export const config = {
    runtime: 'nodejs',
}

const ApiDefaultConfig = {

    database: 'transfer',
    collection: 'short_links',
}

type ShortLink = {
    _id: string;
    sid: string;
    uid: string;
    note: string;
    url: string;
    path: string;
    hits: number;
    created_at: number;
}

/** 自定义后缀允许的字符：英文字母、数字、- 和 _ */
const PATH_REGEX = /^[A-Za-z0-9_-]+$/;
/** 自动生成后缀的长度 */
const RANDOM_PATH_LENGTH = 6;
/** 随机后缀字符集 */
const PATH_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** 保证 path 唯一索引存在（幂等） */
let ensureIndexPromise: Promise<unknown> | null = null;
const ensureUniquePathIndex = () => {
    if (!ensureIndexPromise) {
        ensureIndexPromise = api.createUniqueIndex({
            ...ApiDefaultConfig,
            field: 'path',
        }).catch(e => {
            console.error('创建短链唯一索引失败: ', e);
            ensureIndexPromise = null;
        });
    }
    return ensureIndexPromise;
};

/** 生成 6 位随机英文字母、数字混合字符串 */
const genRandomPath = () => {
    let path = '';
    for (let i = 0; i < RANDOM_PATH_LENGTH; i++) {
        path += PATH_CHARS[randomInt(PATH_CHARS.length)];
    }
    return path;
};

/** 生成一个未被占用的短链后缀（含重试） */
const genAvailablePath = async (): Promise<string> => {
    for (let i = 0; i < 10; i++) {
        const path = genRandomPath();
        const exists = await api.findOne({
            ...ApiDefaultConfig,
            filter: { path },
        }).then(d => !!d.document).catch(() => false);
        if (!exists) {
            return path;
        }
    }
    throw new Error('生成短链后缀失败，请重试');
};

/** 根据请求拼接当前域名 */
const getBaseUrl = (req: NextRequest) => {
    const h = req.headers as unknown as Record<string, string | undefined>;
    const host = h['host'] || 'localhost:3000';
    const proto = (h['x-forwarded-proto'] || 'http').split(',')[0].trim() || 'http';
    return `${proto}://${host}`;
};

const getUid = (req: NextRequest) => {
    const h = req.headers as unknown as Record<string, string | undefined>;
    return h[HeaderKey.UID] || '';
};

export default async function handler(
    req: NextRequest,
    res: NextApiResponse,
) {
    switch (req.method?.toLowerCase()) {
    case 'get':
        return GET(req, res);
    case 'post':
        return POST(req, res);
    case 'patch':
        return PATCH(req, res);
    default:
        return res.status(405).end();
    }
}

/** 获取当前用户的短链列表 */
async function GET(req: NextRequest, res: NextApiResponse) {
    const uid = getUid(req);
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }
    const list = await api.find({
        ...ApiDefaultConfig,
        filter: { uid },
        sort: { created_at: -1 },
    }).then(d => {
        return d.documents as ShortLink[];
    }).catch(e => {
        console.error('查询短链列表失败: ', e);
        return [] as ShortLink[];
    });

    return getResponse(res, 0, '', { list });
}

/** 创建短链 */
async function POST(req: NextRequest, res: NextApiResponse) {
    const uid = getUid(req);
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }
    await ensureUniquePathIndex();

    const json = (await getJsonReq(req) || {}) as {
        note?: string;
        url?: string;
        customPath?: string;
    };

    const url = (json.url || '').trim();
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('仅支持 http/https 链接');
        }
    } catch (e) {
        return paramNotValid(res);
    }

    const customPath = (json.customPath || '').trim();
    let path: string;
    if (customPath) {
        if (!PATH_REGEX.test(customPath) || customPath.length > 32) {
            return getResponse(res, -1, '自定义后缀仅支持 32 位以内的英文字母、数字、- 和 _');
        }
        const exists = await api.findOne({
            ...ApiDefaultConfig,
            filter: { path: customPath },
        }).then(d => !!d.document).catch(() => false);
        if (exists) {
            return getResponse(res, -1, '该短链后缀已被使用');
        }
        path = customPath;
    } else {
        try {
            path = await genAvailablePath();
        } catch (e) {
            return getResponse(res, -1, '生成短链后缀失败，请重试');
        }
    }

    const now = Date.now();
    const insertedId = await api.insertOne({
        ...ApiDefaultConfig,
        document: {
            sid: getNewString(),
            uid,
            note: (json.note || '').trim(),
            url,
            path,
            hits: 0,
            created_at: now,
        },
    }).then(d => d.insertedId).catch(e => {
        // 唯一索引冲突（并发创建了相同的后缀）
        if (customPath) {
            return '';
        }
        return 'retry';
    });

    if (insertedId === '') {
        return getResponse(res, -1, '该短链后缀已被使用');
    }
    if (insertedId === 'retry') {
        // 自动生成时碰撞，重试一次
        try {
            const newPath = await genAvailablePath();
            const retryId = await api.insertOne({
                ...ApiDefaultConfig,
                document: {
                    sid: getNewString(),
                    uid,
                    note: (json.note || '').trim(),
                    url,
                    path: newPath,
                    hits: 0,
                    created_at: now,
                },
            }).then(d => d.insertedId).catch(e => {
                return '';
            });
            if (!retryId) {
                return getResponse(res, -1, '生成短链失败，请重试');
            }
            return getResponse(res, 0, '', {
                id: retryId,
                path: newPath,
                shortUrl: `${getBaseUrl(req)}/s/${newPath}`,
            });
        } catch (e) {
            return getResponse(res, -1, '生成短链失败，请重试');
        }
    }
    if (!insertedId) {
        return getResponse(res, -1, '生成短链失败，请重试');
    }

    return getResponse(res, 0, '', {
        id: insertedId,
        path,
        shortUrl: `${getBaseUrl(req)}/s/${path}`,
    });
}

/** 删除短链 */
async function PATCH(req: NextRequest, res: NextApiResponse) {
    const uid = getUid(req);
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }
    const json = await getJsonReq(req) as {
        ids?: string[];
        action?: string;
    };
    if (json.action !== 'delete' || !json.ids || !json.ids.length) {
        return paramNotValid(res);
    }

    const count = await api.deleteMany({
        ...ApiDefaultConfig,
        filter: {
            uid,
            _id: {
                $in: json.ids.map(i => ({
                    $oid: i,
                }))
            },
        },
    }).then(d => d.deletedCount).catch(e => {
        console.error('删除短链失败: ', e);
        return 0;
    });

    return getResponse(res, 0, '', {
        successCount: count,
    });
}