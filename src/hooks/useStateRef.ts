import { useRef, useState } from 'react';

export default function useStateRef<T>(defaultValue: T) {
    const [s, ss] = useState(defaultValue);
    const sr = useRef(s);
    sr.current = s;
    return [s, ss, sr] as [T, typeof ss, typeof sr];
}
