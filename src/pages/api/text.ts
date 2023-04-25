import { getResponse } from './../../api-tools/common';
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { getJsonReq } from "@/api-tools/common";
import { api } from "@/api-tools/db";
import { getNewString } from "@/api-tools/id";
import type { NextRequestWithContext } from "@/global";


export const config = {
  runtime: 'edge',
  regions: ['hk'], // defaults to 'all'
}

export default function handler(
  req: NextRequestWithContext
) {
  switch (req.method.toLowerCase()) {
    case 'get':
      return GET(req);
    case 'post':
      return POST(req);
    default:
      break;
  }
}

function GET(req: NextRequestWithContext) {
  return new Response(JSON.stringify({
    code: 0,
    data: {
      list: [
        {
          id: "YCOGLtAc",
          type: "text",
          content:
            "https://www.ruanyifeng.com/blog/2020/07/ssh-certificate.html#:~:text=SSH%20%E8%AF%81%E4%B9%A6%E7%99%BB%E5%BD%95%E4%B9%8B%E5%89%8D%EF%BC%8C%E5%A6%82%E6%9E%9C,%E8%87%AA%E5%8A%A8%E5%A4%84%E7%90%86%EF%BC%8C%E7%94%A8%E6%88%B7%E6%97%A0%E6%84%9F%E7%9F%A5%E3%80%82",
          note: "",
          created_at: "2023-04-23T09:47:58Z",
        },
        {
          id: "RbWRmmSj",
          type: "text",
          content: "https://www.one-tab.com/page/elTABdseTfubQc7zEBqSbg",
          note: "",
          created_at: "2023-04-19T14:07:45Z",
        },
        {
          id: "MLOzIpoY",
          type: "text",
          content: "https://www.one-tab.com/page/gbXNT4ctSN-y467b2jzKbQ",
          note: "",
          created_at: "2023-03-17T10:28:26Z",
        },
        {
          id: "WLsagEsh",
          type: "text",
          content:
            '{\n  "language": "zh_Hans",\n  "theme": "light",\n  "title": "${downspeed}, ${upspeed} - ${title}",\n  "titleRefreshInterval": 5000,\n  "browserNotification": false,\n  "rpcAlias": "",\n  "rpcHost": "home.tanzhixuan.site",\n  "rpcPort": 9480,\n  "rpcInterface": "jsonrpc",\n  "protocol": "wss",\n  "httpMethod": "POST",\n  "secret": "MTk2YWVmOGNkMDYwNGI0Nzc3MmU=",\n  "extendRpcServers": [\n    {\n      "rpcAlias": "",\n      "rpcHost": "home-fast.tanzhixuan.site",\n      "rpcPort": 9482,\n      "rpcInterface": "jsonrpc",\n      "protocol": "wss",\n      "httpMethod": "POST",\n      "secret": "MWMxMTY0MjVlNzRkOWQxMzhkMDA=",\n      "rpcId": "QXJpYU5nXzE2NzkwMTk5NzlfMC4zNzk3ODgwOTE1OTM1MTU0NQ=="\n    }\n  ],\n  "globalStatRefreshInterval": 1000,\n  "downloadTaskRefreshInterval": 1000,\n  "swipeGesture": true,\n  "dragAndDropTasks": true,\n  "rpcListDisplayOrder": "recentlyUsed",\n  "afterCreatingNewTask": "task-list",\n  "removeOldTaskAfterRetrying": false,\n  "confirmTaskRemoval": true,\n  "includePrefixWhenCopyingFromTaskDetails": true,\n  "showPiecesInfoInTaskDetailPage": "le10240",\n  "afterRetryingTask": "task-list-downloading",\n  "displayOrder": "default:asc",\n  "fileListDisplayOrder": "default:asc",\n  "peerListDisplayOrder": "default:asc"\n}',
          note: "",
          created_at: "2023-03-17T02:26:32Z",
        },
        {
          id: "zccVEcqm",
          type: "text",
          content: "https://www.one-tab.com/page/gO5EBE-1TEOG5ciQPsK-aQ",
          note: "",
          created_at: "2023-02-15T10:00:57Z",
        },
        {
          id: "MRdvOwko",
          type: "text",
          content: "https://my.shark-china.com/vpn/manual-setup/main/openvpn",
          note: "",
          created_at: "2023-02-13T13:35:12Z",
        },
        {
          id: "WVNhNPFk",
          type: "text",
          content: "https://www.reboku.cc/p/1-1/id/32332.html",
          note: "",
          created_at: "2023-01-26T11:18:55Z",
        },
        {
          id: "RlrYUktW",
          type: "text",
          content: "MgKuQuuHvkGbpP6bfLCsptXk",
          note: "",
          created_at: "2023-01-25T08:51:33Z",
        },
        {
          id: "sRslSrWQ",
          type: "text",
          content: "JNNkfFAfXW4hHkUAYSu2w7mJ",
          note: "",
          created_at: "2023-01-25T08:51:27Z",
        },
        {
          id: "iPHSafMi",
          type: "text",
          content: "新增书签时，默认添加书签栏-\u003e前缀",
          note: "TODO",
          created_at: "2022-12-27T10:22:29Z",
        },
        {
          id: "SQAQDwhv",
          type: "text",
          content: "搞一个VPS用于VPN",
          note: "了解",
          created_at: "2022-12-12T06:38:08Z",
        },
        {
          id: "uOoanCfQ",
          type: "text",
          content:
            "https://www.coolapk.com/feed/27132475?shareKey=YTI4ZjM3N2Y3MzQ1NjEyYmFhMzk~\u0026shareUid=3463951\u0026shareFrom=com.coolapk.market_11.4-beta1%E2%80%8B",
          note: "",
          created_at: "2022-12-10T00:48:12Z",
        },
        {
          id: "fdjyRIRZ",
          type: "text",
          content: "）：\n用户名：曹禹华_hua\n密码：cyh070521",
          note: "",
          created_at: "2022-12-10T00:44:41Z",
        },
      ],
      total_count: 13,
    },
    message: "",
  }))
}

async function POST(req: NextRequestWithContext) {
  const rid = getNewString();
  console.log('req.headers: ', req.headers);
  console.log('req.context: ', req.context);
  const uid = req.context.userid;
  const jsonReq = await getJsonReq(req)
  await api.insertMany({
    dataSource: 'Cluster0',
    database: 'transfer',
    collection: 'clipboards',
    documents: [jsonReq.list.map(i => ({
      rid,
      uid,
      type: 'text',
      content: i.content,
      note: i.note || '',
    }))]
  }).then(d => {
    console.log('d: ', d);
  })
  return getResponse(0, '', null);
}