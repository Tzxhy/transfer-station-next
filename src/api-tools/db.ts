import { createMongoDBDataAPI } from "mongodb-data-api";
import axios, { AxiosHeaders } from 'axios';

const instance = axios.create({
    adapter: (config) => {
        // console.log('config: ', config);
        return fetch(config.url!, {
            body: config.data,
            method: config.method,
            headers: config.headers,
        }).then(d => {
            if (d.status >= 300) {
                return Promise.reject(d)
            }
            return {
                data: d.json(),
                status: d.status,
                statusText: d.statusText,
                headers: d.headers as unknown as AxiosHeaders,
                config,
                request: null,
            };
        })
    },
});

console.log('process.env.DBKEY: ', process.env.DBKEY);
export const api = createMongoDBDataAPI({
    apiKey: process.env.DBKEY as string,
    urlEndpoint: 'https://data.mongodb-api.com/app/data-xzlug/endpoint/data/v1'
}, instance)
