# transfer-station 传送站

__利用浏览器，在多个设备间同步文本，书签！__

在线体验地址：https://cloud.tanzhixuan.site/login （PS：由于使用了vercel的边缘计算函数+mongodb http接口，所以接口响应很慢，反正白嫖，又不是不能用～）

## 技术栈
- Next.js
- React
- @mui/material 组件库

## 部署
- vercel 部署

## 使用示例
### 登录及注册
![登录](https://raw.githubusercontent.com/Tzxhy/transfer-station-next/main/images/login.png)
### 文本同步
![本文操作](https://raw.githubusercontent.com/Tzxhy/transfer-station-next/main/images/text.png)
### 书签操作
![创建书签](https://raw.githubusercontent.com/Tzxhy/transfer-station-next/main/images/create-bookmark.png)
![书签列表](https://raw.githubusercontent.com/Tzxhy/transfer-station-next/main/images/bookmarks.png)

**还有导入，导出，强制离线功能等**，这里就不一一介绍了。


## 二次开发
拉取本仓库，依次执行：
```sh
# 安装依赖
yarn
# 首次dev前需要执行一次
yarn build
# 开始开发
yarn dev
```

Next.js 官方文档参考：[https://nextjs.org/docs](https://nextjs.org/docs)

## 配置相关
项目根目录下新建：_.env.local_ 文件，包含：
```txt
# 数据库的key
DBKEY=xxxxxxxxx
# jwt的key
JWTTOKEN=xxxxxx
```
其中，DBKey为mongodb atlas data-api 中生成的key。


## 部署
部署前需要去 mongodb 官方申请一个 512MB 的免费集群，开通data api，拿到 key。这里不详细说。

推荐直接使用 **vercel** ([https://vercel.com/dashboard](https://vercel.com/dashboard)) 部署（**不需服务器，免费白嫖**），需要注入配置相关中的环境变量。

或者有服务器的，可以参考 Next.js 官方的其他部署方案。


## QA
有任何问题，直接提 [issue](https://github.com/Tzxhy/transfer-station-next/issues/new) 吧~