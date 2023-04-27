import { resolve } from '@/utils/url';
import { getJsonReq, getResponse } from "@/api-tools/common";
import { getNewString } from "@/api-tools/id";
import { genUserToken } from "@/api-tools/token";
import { NextRequest } from "next/server";
import { support } from "@/api-tools/db";
import { HeaderKey } from "@/constants/string";
import { ImageError, getIconByDomain, setIconByDomain } from "@/api-tools/icons";
import * as cheerio from 'cheerio';
import { getHostname, paddingHttpUrl } from "@/utils/network";

export const config = {
    runtime: "edge",
    regions: ['hnd1', 'hkg1'],
};

export default async function handler(req: NextRequest) {
    if (req.method !== "GET") {
        return new Response(null, {
            status: 405, // method not allowed
        });
    }
    const h = req.headers;
    let n;
    try {
        n = new URL(req.url);
    } catch(e) {
        return getResponse(9000000, '参数无效')
    }
    
    const jsonReq =  {
        site: n.searchParams.get('site') || '',
    };

    const hostname = getHostname(jsonReq.site);
    if (!hostname) {
        return getResponse(9000000, '参数无效');
    }
    const img = await getIconByDomain(hostname)
    if (img) {
        console.log('图像使用缓存');
        
        return getResponse(0, '', {
            img: img.image,
            domain: hostname,
        })
    }
    console.log('准备走算法');

    const imgString = await getSiteFavicon(jsonReq.site)

    if (imgString !== ImageError) {
        await setIconByDomain(hostname, imgString)
    }
    return getResponse(0, '', {
        img: imgString,
        domain: hostname,
    })
}

async function getSiteFavicon(site: string): Promise<string> {
    if (!site.includes('//')) {
        site = 'http://' + site;
    }
    const originUrl = new URL(site)

    const originScheme = originUrl.protocol
    const originHostname = originUrl.hostname
    let iconPath = originScheme + '//' + originHostname + '/favicon.ico'

    const returnWithImage = async (imgUrl: string): Promise<string> => {
        let imageString = imgUrl
        if (!imageString.startsWith('data')) {
            imageString = await getSiteFaviconByUrl(imgUrl)
        }
        if (imageString === '') {
            imageString = ImageError
        }

        return imageString
    }

    const [body, finalURL] = await httpRequest(site).catch(e => {
        return ['error']
    });
    console.log('finalURL: ', finalURL);
    if (body === 'error') return ImageError;

    if (!body) return returnWithImage(iconPath)

    const doc = cheerio.load(body);
    const selection = doc('link[rel*=icon]')
    const href = selection.attr('href')
    if (href) {
        iconPath = combineFaviconUrlString(finalURL, href)
    }
    return returnWithImage(iconPath)
}

async function httpRequest(url: string): Promise<[string, string]> {
    const f = await fetch(url, {
        headers: {
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'accept-language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
            connection: 'keep-alive',
            'user-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36',
        }
    });
    let targetUrl = url;
    if (f.redirected) {
        targetUrl = f.url;
    }

    const t = await f.text();

    return [t, targetUrl];
}

async function getSiteFaviconByUrl(imgUrl: string): Promise<string> {
    const r = await fetch(imgUrl)
    return new Promise<string>(async res => {
        const contentType = r.headers.get('content-type') ?? '';
        if (contentType.includes('image')) {
            const imageTypeSplit = contentType.split('/')
            let imageType = 'x-icon'
            if (imageTypeSplit.length === 2) {
                imageType = imageTypeSplit[1]
            }
            const s = await r.arrayBuffer().then(d => {
                return Buffer.from(d).toString('base64')
            })
            res('data:image/' + imageType + ';base64,' + s);
        }
        res('');
    })
}
function combineFaviconUrlString(url: string, href: string): string {

    let iconPath = href;
    const u = new URL(url);
    if (iconPath.startsWith('data')) {

    } else {
        if (!href.includes('//')) { // 不包含// 那么是相对路径或者绝对路径
            if (href[0] === '/') { // 绝对路径
                iconPath = u.protocol + '//'+ u.hostname + href;
            } else { // 相对
                iconPath = resolve(u.protocol + '//' + u.hostname + u.pathname, href)
            }
        } else {
            const p = new URL(paddingHttpUrl(href, {
                protocol: u.protocol,
            }))
            iconPath = p.toString()
        }
    }

    console.log('iconPath in combineFaviconUrlString: ', iconPath);
    return iconPath;
}