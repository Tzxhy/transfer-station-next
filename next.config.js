/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // webpack: (
    //   config,
    //   { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }
    // ) => {
    //   config.module.rules.push({
    //     test: /\.(jpe?g|png|svg|gif|ico|webp|jp2)$/,
    //     use: [
    //       {
    //         loader: require.resolve('url-loader'),
    //         options: {
    //           limit: 10 * 1024,
    //           fallback: require.resolve('file-loader'),
    //           publicPath: `/_next/static/assets/`,
    //           outputPath: `static/assets/`,
    //           name: '[name]-[hash:base64:5].[ext]',
    //           esModule: false,
    //         },
    //       },
    //     ],
    //   })
    //   return config
    // },
}

module.exports = nextConfig
