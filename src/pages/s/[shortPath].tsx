import { api } from "@/api-tools/db";
import type { GetServerSideProps } from "next";

type ShortLink = {
    _id: string;
    url: string;
    hits: number;
}

/** 短链跳转：根据 /s/:path 查询目标链接并重定向 */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
    const shortPath = (ctx.params?.shortPath as string) || '';

    const doc = await api.findOne({
        database: 'transfer',
        collection: 'short_links',
        filter: { path: shortPath },
    }).then(d => {
        return d.document as ShortLink | null;
    }).catch(e => {
        return null;
    });

    if (!doc || !/^https?:\/\//i.test(doc.url)) {
        return { notFound: true };
    }

    // 异步累加访问次数，不阻塞重定向
    api.updateOne({
        database: 'transfer',
        collection: 'short_links',
        filter: {
            _id: { $oid: doc._id },
        },
        update: { $inc: { hits: 1 } },
    }).catch(() => {});

    return {
        redirect: {
            destination: doc.url,
            permanent: false,
        },
    };
};

export default function ShortPath() {
    return null;
}