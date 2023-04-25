import { getToken } from '../utils/token';

export default function useCheckLogin() {
	const token = getToken()
	if (!token) {
		location.href = '/html/login/index.html';
	}
}
