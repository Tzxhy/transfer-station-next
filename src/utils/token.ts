import { TOKEN_CACHE_NAME } from '../constants/token';


export function getToken() {
	if (typeof localStorage !== 'undefined') {
		return localStorage.getItem(TOKEN_CACHE_NAME) || ''
	}
	return ''
}

export function setToken(v: string) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(TOKEN_CACHE_NAME, v)
	}
}