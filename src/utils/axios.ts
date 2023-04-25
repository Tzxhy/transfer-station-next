

import axios from 'axios';
import { getToken } from './token';

// const domain = 'https://6375fb5c7e93bcb006bf3da2.mockapi.io'
// const domain = 'http://localhost:8080'
const domain = ''

const instance = axios.create();
instance.interceptors.request.use(v => {
	v.url = domain + '/api' + v.url;
	const token = getToken();
	if (token) {
		v.headers!.Authorization = token;
	}
	return v;
})

instance.interceptors.response.use(v => {
	if (v.status >= 200 && v.status < 300) {
		if (v.data.code >= 1000000 && v.data.code < 2000000 && !location.href.includes('login')) {
			location.href = '/html/login/';
			throw new Error('登录状态受限')
		}
		return v.data;
	}
	return null;
})

export default instance;
