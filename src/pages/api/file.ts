import { getResponse, paramNotValid } from '@/api-tools/common';
import { HeaderKey } from '@/constants/string';
import { NextRequest } from 'next/server';
import type { NextApiResponse } from 'next';
import { del, get, list, put, rename } from '@vercel/blob';
import { Readable } from 'stream';

export const config = {
    runtime: 'nodejs',
    api: {
        // 上传接口需要接收原始文件流（multipart/raw），由 handler 自行读取 body
        bodyParser: false,
        responseLimit: false,
    },
}

/** 单文件上传大小上限（100MB） */
const MAX_SIZE_IN_BYTES = 100 * 1024 * 1024;

/** 每个用户独立的存储前缀 */
const getPrefix = (uid: string) => `files/${uid}/`;

/**
 * 校验 pathname 是否属于当前用户，并返回文件名；
 * 不合法时返回空字符串
 */
const getFileName = (pathname: unknown, uid: string) => {
    if (typeof pathname !== 'string') return '';
    const prefix = getPrefix(uid);
    if (!pathname.startsWith(prefix)) return '';
    const name = pathname.slice(prefix.length);
    if (!name || name === '.' || name === '..' || name.includes('/') || name.includes('\\') || name.includes('..')) {
        return '';
    }
    return name;
};

/** 从 blob url 中解析出 pathname，并校验归属；不合法时返回空字符串 */
const getPathnameFromUrl = (url: unknown, uid: string) => {
    if (typeof url !== 'string') return '';
    try {
        const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\//, '');
        return getFileName(pathname, uid) ? pathname : '';
    } catch (e) {
        return '';
    }
};

/** 读取原始请求体（bodyParser 已关闭） */
const getRawBody = async (req: any) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
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

// 获取当前用户的文件列表 / 下载文件（?action=download&pathname=xxx）
async function GET(req: NextRequest, res: NextApiResponse) {
    const uid = getUid(req);
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }

    // 下载文件（私有 store，由服务端流式转发）
    const query = (req as any).query ?? {};
    if (query.action === 'download') {
        const filename = getFileName(query.pathname, uid);
        if (!filename) {
            return paramNotValid(res);
        }
        try {
            const result = await get(`${getPrefix(uid)}${filename}`, { access: 'private' });
            if (!result || result.statusCode !== 200) {
                return getResponse(res, -1, '文件不存在或已被删除');
            }
            res.setHeader('Content-Type', result.blob.contentType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
            res.setHeader('Cache-Control', 'private, no-store');
            Readable.fromWeb(result.stream as any).pipe(res);
            return;
        } catch (e) {
            console.log('下载失败: ', e);
            return getResponse(res, -1, '下载失败');
        }
    }

    try {
        const { blobs } = await list({ prefix: getPrefix(uid), limit: 1000 });
        const listData = blobs.map(b => ({
            name: b.pathname.slice(getPrefix(uid).length),
            pathname: b.pathname,
            url: b.url,
            size: b.size,
            uploadedAt: new Date(b.uploadedAt).toISOString(),
        })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        return getResponse(res, 0, '', {
            uid,
            list: listData,
            total_count: listData.length,
        })
    } catch (e) {
        console.log('获取文件列表失败: ', e);
        return getResponse(res, -1, '获取文件列表失败');
    }
}

// 上传文件（客户端将文件原始内容 POST 到 ?name=文件名）
async function POST(req: NextRequest, res: NextApiResponse) {
    const uid = getUid(req);
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }
    const query = (req as any).query ?? {};
    const filename = (query.name || '').trim();
    if (!getFileName(`${getPrefix(uid)}${filename}`, uid)) {
        return paramNotValid(res);
    }

    try {
        const buffer = await getRawBody(req);
        if (!buffer.length) {
            return paramNotValid(res);
        }
        if (buffer.length > MAX_SIZE_IN_BYTES) {
            return getResponse(res, -1, '文件超过大小上限（100MB）');
        }
        const pathname = `${getPrefix(uid)}${filename}`;

        // 拒绝覆盖同名文件
        const { blobs } = await list({ prefix: pathname, limit: 1 });
        if (blobs.some(b => b.pathname === pathname)) {
            return getResponse(res, -1, '已存在同名文件，请重命名后再上传');
        }

        const h = req.headers as unknown as Record<string, string | undefined>;
        const contentType = h['content-type'] || 'application/octet-stream';

        await put(pathname, buffer, {
            access: 'private',
            contentType,
            addRandomSuffix: false,
        });
        return getResponse(res, 0, '', {
            successCount: 1,
            pathname,
        });
    } catch (e) {
        console.log('上传失败: ', e);
        return getResponse(res, -1, '上传失败');
    }
}

// 重命名 / 删除 / 删除全部
async function PATCH(req: NextRequest, res: NextApiResponse) {
    const uid = getUid(req);
    if (!uid) {
        return getResponse(res, 1000001, '登录状态失效')
    }
    let jsonReq: {
        action?: string;
        pathname?: string;
        newName?: string;
        urls?: string[];
    } = {};
    try {
        const raw = await getRawBody(req);
        if (raw.length) {
            jsonReq = JSON.parse(raw.toString('utf-8'));
        }
    } catch (e) {
        console.log('解析请求体失败: ', e);
        return paramNotValid(res);
    }

    try {
        if (jsonReq.action === 'rename') {
            const oldName = getFileName(jsonReq.pathname, uid);
            const newName = (jsonReq.newName || '').trim();
            if (!oldName || !newName || newName === '.' || newName === '..' ||
                newName.includes('/') || newName.includes('\\') || newName.includes('..')) {
                return paramNotValid(res);
            }
            if (oldName === newName) {
                return getResponse(res, 0, '', { successCount: 1 });
            }
            const result = await rename(jsonReq.pathname!, `${getPrefix(uid)}${newName}`, {
                access: 'private',
            });
            return getResponse(res, 0, '', {
                successCount: 1,
                pathname: result.pathname,
            });
        }

        if (jsonReq.action === 'delete') {
            if (!Array.isArray(jsonReq.urls) || !jsonReq.urls.length) {
                return paramNotValid(res);
            }
            // 只删除属于当前用户前缀的 url
            const urls = jsonReq.urls.filter(u => getPathnameFromUrl(u, uid));
            if (!urls.length) {
                return paramNotValid(res);
            }
            await del(urls);
            return getResponse(res, 0, '', {
                successCount: urls.length,
            });
        }

        if (jsonReq.action === 'delete-all') {
            const { blobs } = await list({ prefix: getPrefix(uid), limit: 1000 });
            if (blobs.length) {
                await del(blobs.map(b => b.url));
            }
            return getResponse(res, 0, '', {
                successCount: blobs.length,
            });
        }
    } catch (e) {
        console.log('文件操作失败: ', e);
        return getResponse(res, -1, '文件操作失败');
    }

    return paramNotValid(res);
}