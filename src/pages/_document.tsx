import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html lang="zh-CN">
            <Head>
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#1976d2" />
                <meta name="application-name" content="传送站" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="传送站" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
