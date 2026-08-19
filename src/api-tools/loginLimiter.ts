import type { NextRequest } from 'next/server';
import { getRedis } from './redis';

/**
 * 登录失败 IP 拦截（基于 Redis）
 * 连续失败达到阈值后开始拦截，拦截时长从 5 分钟起，随着失败次数递增每次翻倍：
 * 5min → 10min → 20min → 40min ...
 */

/** 连续失败多少次后触发拦截 */
const FAIL_THRESHOLD = 5;
/** 基础拦截时长（分钟） */
const BASE_BLOCK_MINUTES = 5;
/** 失败计数的最长留存窗口（秒），窗口内没有新失败则自然清零 */
const FAIL_WINDOW_SECONDS = 30 * 60;
/** 拦截时长的最高档位，防止指数过大 */
const MAX_LEVEL = 10;

const PREFIX = 'login:guard:';
const failKey = (ip: string) => `${PREFIX}fail:${ip}`;
const blockKey = (ip: string) => `${PREFIX}block:${ip}`;

/** 从请求中解析客户端 IP（优先取 x-forwarded-for，其次 x-real-ip） */
export function getClientIp(req: NextRequest): string {
    const h = req.headers as unknown as Record<string, string | undefined>;
    const xff = h['x-forwarded-for'];
    if (xff) {
        return xff.split(',')[0].trim();
    }
    const xRealIp = h['x-real-ip'];
    if (xRealIp) {
        return xRealIp.trim();
    }
    return ((req as any).socket?.remoteAddress as string) || 'unknown';
}

/**
 * 查询当前 IP 是否被拦截
 * @returns 剩余拦截秒数，未被拦截时返回 0
 */
export async function getBlockRemainingSeconds(ip: string): Promise<number> {
    try {
        const ttl = await getRedis().ttl(blockKey(ip));
        return ttl > 0 ? ttl : 0;
    } catch (e) {
        console.error('查询登录拦截状态失败: ', e);
        return 0; // Redis 异常时放行，避免影响正常登录
    }
}

/** 记录一次登录失败 */
export async function recordLoginFail(ip: string): Promise<void> {
    try {
        const redis = getRedis();
        const count = await redis.incr(failKey(ip));
        if (count === 1) {
            // 首次失败时设置计数窗口
            await redis.expire(failKey(ip), FAIL_WINDOW_SECONDS);
        }
        if (count >= FAIL_THRESHOLD) {
            const level = Math.min(count - FAIL_THRESHOLD, MAX_LEVEL);
            const seconds = BASE_BLOCK_MINUTES * 60 * Math.pow(2, level);
            await redis.setex(blockKey(ip), seconds, 'blocked');
            // 计数留存时间跟随拦截时长，便于拦截结束后继续累积
            await redis.expire(failKey(ip), seconds);
        }
    } catch (e) {
        console.error('记录登录失败失败: ', e);
    }
}

/** 登录成功后清除该 IP 的失败计数与拦截状态 */
export async function clearLoginFail(ip: string): Promise<void> {
    try {
        const redis = getRedis();
        await redis.del(failKey(ip), blockKey(ip));
    } catch (e) {
        console.error('清除登录失败记录失败: ', e);
    }
}