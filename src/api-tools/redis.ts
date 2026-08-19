import Redis from 'ioredis';

let client: Redis | null = null;

/** 获取 Redis 客户端（懒初始化单例） */
export function getRedis(): Redis {
    if (!client) {
        client = new Redis(process.env.REDIS_URL as string, {
            maxRetriesPerRequest: 2,
        });
        client.on('error', (e) => {
            console.error('redis 连接错误: ', e);
        });
    }
    return client;
}