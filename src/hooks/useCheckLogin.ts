import { useEffect } from 'react';
import { getToken } from '../utils/token';

export default function useCheckLogin() {
    useEffect(() => {
        const token = getToken();
        if (!token) {
            location.href = '/login/';
        }
    }, []);
}