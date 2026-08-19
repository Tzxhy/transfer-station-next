import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Analytics } from '@vercel/analytics/react';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((e) => {
                console.error('Service Worker 注册失败: ', e);
            });
        }
    }, []);

    return <>
        <Component {...pageProps} />
        <Analytics />
    </>
}
