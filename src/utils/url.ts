

export const resolve = (url: string, pathname: string): string => {


    const n = new URL(url);
    
    const prefix = n.protocol + '//' + n.hostname;
    const pathNameSlice = n.pathname.split('/');
    let neededPathNameSlice = pathNameSlice.slice()
    if (neededPathNameSlice.length && neededPathNameSlice[neededPathNameSlice.length - 1] !== '') {
        neededPathNameSlice.pop();
    }
    neededPathNameSlice = neededPathNameSlice.filter(Boolean);
    let restPathname = pathname;
    while (1) {
        if (!restPathname) break;
        if (restPathname.startsWith('/')) { // 绝对路径
            restPathname = restPathname.slice(1)
            neededPathNameSlice = [];
        } else if (restPathname.startsWith('../')) { // 上层
            neededPathNameSlice.pop();
            restPathname = restPathname.slice(3);
        } else if (restPathname.startsWith('./')) { // 当前
            restPathname = restPathname.slice(2);
        } else { // 当对于当前
            const s = restPathname.split('/');
            neededPathNameSlice.push(s[0]);
            restPathname = restPathname.slice(s[0].length + 1);
        }
    }

    return prefix + '/' +  neededPathNameSlice.join('/')
}
// [
//     resolve('http://hostname', 'c') === 'http://hostname/c',
//     resolve('http://hostname/a/b', 'c') === 'http://hostname/a/c',
//     resolve('http://hostname/a/b', 'c/d') === 'http://hostname/a/c/d',
//     resolve('http://hostname/a/b', '../c/d') === 'http://hostname/c/d',
//     resolve('http://hostname/a/b', '../c') === 'http://hostname/c',
//     resolve('http://hostname/a/b', '/c') === 'http://hostname/c',
//     resolve('http://hostname/a/b', '/c/d') === 'http://hostname/c/d',
//     resolve('http://hostname', '/c/d') === 'http://hostname/c/d',
// ]

// [
//     resolve('http://hostname/', 'c') === 'http://hostname/c',
//     resolve('http://hostname/a/b/', 'c') === 'http://hostname/a/b/c',
//     resolve('http://hostname/a/b/', 'c/d') === 'http://hostname/a/b/c/d',
//     resolve('http://hostname/a/b/', '../c/d') === 'http://hostname/a/c/d',
//     resolve('http://hostname/a/b/', '../c') === 'http://hostname/a/c',
//     resolve('http://hostname/a/b/', '/c') === 'http://hostname/c',
//     resolve('http://hostname/a/b/', '/c/d') === 'http://hostname/c/d',
//     resolve('http://hostname', '/c/d') === 'http://hostname/c/d',
// ]