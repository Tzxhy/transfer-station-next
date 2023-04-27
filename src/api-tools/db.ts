import { createMongoDBDataAPI } from "mongodb-data-api";
import axios, { AxiosHeaders } from 'axios';

const instance = axios.create({
    adapter: (config) => {
        return fetch(config.url!, {
            body: config.data,
            method: config.method,
            headers: config.headers,
        }).then(async d => {
            if (d.status >= 300) {
                console.log('fetch fail: ', await d.text());
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


export const api = createMongoDBDataAPI({
    apiKey: process.env.DBKEY as string,
    urlEndpoint: 'https://data.mongodb-api.com/app/data-xzlug/endpoint/data/v1'
}, instance)

export const support = async <T>(key: string, supportedValue: T, noRecordIsFalse = true) => {
    return api.findOne<{
        name: string;
        value: T;
    }>({
        dataSource: 'Cluster0',
        database: 'transfer',
        collection: 'system',
        filter: {
            name: key,
        }
    }).then(d => {
        if (!d.document) {
            return noRecordIsFalse;
        }
        return d.document.value === supportedValue;
    }).catch(e => {
        return noRecordIsFalse;
    })
}