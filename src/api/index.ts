import config from '../config';
import { ListDataItemWithCache } from '../utils';
import instance from '../utils/axios';
import { cacheData, getCacheData } from '../utils/network';

export type Resp<T> = {
	code: number;
	message: string;
	data: T;
}

export function register(username: string, password: string) {
    return instance.post<any, Resp<{
		username: string;
		id: string;
		token: string;
	}>>('/register', {
	    username,
	    password,
	});
}


export function login(username: string, password: string) {
    return instance.post<any, Resp<{
		username: string;
		token: string;
	}>>('/login', {
	    username,
	    password,
	});
}


const CLIP_BOARD_LIST_KEY = 'CLIP_BOARD_LIST_KEY_NEW'

export async function getClipBoardList() {
    if (config.nowUseOfflineMode) {
        const data = getCacheData<ListDataItemWithCache<ClipBoard>[]>(CLIP_BOARD_LIST_KEY) || [];
        return {
            code: 0,
            data: {
                list: data,
            },
        };
    }
    await updateLocalClipBoardList();
    return instance.get<any, Resp<{
		list:  ListDataItemWithCache<ClipBoard>[];
	}>>('/text').then(d => {
	    if (d.code === 0) {
	        cacheData(CLIP_BOARD_LIST_KEY, d.data.list)
	    }
	    return d;
	});
}

// 更新本地缓存到远端
export const updateLocalClipBoardList = async function updateLocalClipBoardList() {
    if (config.nowUseOfflineMode) return;
    localStorage.removeItem('CLIP_BOARD_LIST_KEY');
    const list = getCacheData<ListDataItemWithCache<ClipBoard>[]>(CLIP_BOARD_LIST_KEY) || [];
    if (list?.length) {
        const localList = list.filter(i => i._isLocalAdded);
        if (localList.length) {
            console.log('新增离线数据：', localList);
            await createClipBoard(localList, false);
        }
        const del = list.filter(i => i._isLocalDeleted);
        if (del.length) {
            console.log('删除ids：', del);
            await deleteClipBoardList(del.map(i => i._id), false)
        }
    }
}

export function deleteClipBoardList(list: string[], updateLocal = true) {
    if (config.nowUseOfflineMode) {
        const originList = getCacheData<ListDataItemWithCache<ClipBoard>[]>(CLIP_BOARD_LIST_KEY)
        cacheData(CLIP_BOARD_LIST_KEY, [
            ...originList!.map<ListDataItemWithCache<ClipBoard>>(i => ({
                ...i,
                _isLocalDeleted: i._isLocalDeleted || list.includes(i._id),
            })).filter(i => !(i._isLocalAdded && i._isLocalDeleted)),
        ]);
        return {
            code: 0,
            data: {
                successCount: list.length,
            },
            message: '离线删除',
        }
    }
    return instance.patch<any, Resp<{
		successCount: number;
	}>>('/text', {
	    action: 'delete',
	    ids: list,
	}).then(d => {
	    if (updateLocal) {
	        const originList = getCacheData<ListDataItemWithCache<ClipBoard>[]>(CLIP_BOARD_LIST_KEY)
	        cacheData(CLIP_BOARD_LIST_KEY, [
	            ...originList!.filter(i => !list.includes(i._id)),
	        ]);
	    }
	    return d;
	});
}

export function deleteAllClipBoardList() {
    if (config.nowUseOfflineMode) {
        return Promise.reject('离线模式不允许删除全部哦～');
    }
    return instance.patch<any, Resp<{
		successCount: number;
	}>>('/text', {
	    action: 'delete-all',
	});
}

export function createClipBoard(list: Omit<ClipBoard, 'created_at' | '_id'>[], updateLocal = true) {
    if (config.nowUseOfflineMode) {
        const now = Date.now();
        const ids = list.map((_, idx) => now + idx + '');
        const createdAt = new Date().toISOString();
        const originCache = getCacheData<ListDataItemWithCache<ClipBoard>[]>(CLIP_BOARD_LIST_KEY) || []
        cacheData(CLIP_BOARD_LIST_KEY, [
            ...list.map<ListDataItemWithCache<ClipBoard>>((i, idx) => ({
                ...i,
                _id: ids[idx],
                _isLocalAdded: true,
                created_at: createdAt,
            })),
            ...originCache!,
        ]);
        return {
            code: 0,
            data: {
                successCount: list.length,
                ids,
                created_at: createdAt,
            },
            message: '离线本地添加',
        };
    }
    return instance.post<any, Resp<{
		successCount: number;
		ids: string[];
		created_at: string;
	}>>('/text', {
	    list,
	}).then(d => {
	    if (updateLocal) {
	        const originCache = getCacheData<ListDataItemWithCache<ClipBoard>[]>(CLIP_BOARD_LIST_KEY) || []
	        cacheData(CLIP_BOARD_LIST_KEY, [
	            ...list.map((i, idx) => ({
	                ...i,
	                id: d.data.ids[idx],
	                created_at: d.data.created_at,
	            })),
	            ...originCache!,
	        ]);
	    }
		
	    return d;
	});
}

export function wrapperBookMark(b: BookMark): BookMarkWithGet {
    return {
        ...b,
        get hostname(): string {
            try {
                const url = new URL(this.link);
			
                return url.hostname;
            } catch (e) {}
            return '';
        },
        get iconId(): number {
            return this.icon_id;
        },
        get iconOfThis(): string {
            return this.icon;
        },
    };
}
export type BookMarkWithGet = BookMark & {
	get hostname(): string;
	get iconOfThis(): string;
	get iconId(): number;
}

async function updateLocalBookmarkList() {
    if (config.nowUseOfflineMode) return;
    // 检查是否有新增，删除，修改的数据
    const list = (getCacheData(BOOK_MARK_LIST_KEY) || []) as ListDataItemWithCache<BookMark>[]
    if (list.length) {
        // 新增并且不是已删除的数据
        const localAddedList = list.filter(i => i._isLocalAdded && !i._isLocalDeleted);
        // 修改且非新增且非删除
        const localModifiedList = list.filter(i => !i._isLocalAdded && i._isLocalChanged && !i._isLocalDeleted);
        // 删除且非新增
        const localDeletedList = list.filter(i => i._isLocalDeleted && !i._isLocalAdded);

        const promises = [] as (() => Promise<any>)[];
        if (localAddedList.length) {
            console.log(`创建$${localAddedList.length}条数据`);
            promises.push(() => createBookmarks(localAddedList))
        }
        if (localModifiedList.length) {
            console.log(`修改$${localAddedList.length}条数据`);
            promises.push(() => modifyBookMarks(localModifiedList))
        }
        if (localDeletedList.length) {
            console.log(`删除$${localAddedList.length}条数据`);
            promises.push(() => deleteBookMark(localDeletedList.map(i => i._id)))
        }

        if (promises.length) {
            await Promise.all(promises.map(i => i()));
        }
    }
}

const BOOK_MARK_LIST_KEY = 'BOOK_MARK_LIST_KEY'
const BOOK_MARK_LIST_ANCHOR_KEY = 'BOOK_MARK_LIST_ANCHOR'
const BOOK_MARK_ICONS_KEY = 'BOOK_MARK_ICONS_KEY'

export async function getBookMarkList() {
    const returnCacheData = () => {
        const icons = getCacheData(BOOK_MARK_ICONS_KEY) || {};
        const list = getCacheData<ListDataItemWithCache<BookMark>[]>(BOOK_MARK_LIST_KEY) || [];

        return {
            code: 0,
            data: {
                icons,
                list: list.map(wrapperBookMark),
            },
        };
    }
    if (config.nowUseOfflineMode) {
        return returnCacheData();
    }
    await updateLocalBookmarkList();
    return instance.get<any, Resp<{
		list: BookMark[];
		last_anchor_match: boolean;
		icons: Record<number, string>;
		last_anchor: number;
	}>>('/bookmark', {
	    params: {
	        last_anchor: getCacheData(BOOK_MARK_LIST_ANCHOR_KEY) || '',
	    },
	}).then(d => {
	    if (d.code === 0) {
	        if (!d.data.last_anchor_match) { // 未命中
	            // 缓存全量数据
	            cacheData(BOOK_MARK_LIST_KEY, d.data.list)
	            cacheData(BOOK_MARK_LIST_ANCHOR_KEY, d.data.last_anchor)
	            cacheData(BOOK_MARK_ICONS_KEY, d.data.icons)
	        } else {
	            return returnCacheData();
	        }
	    }
	    return {
	        ...d,
	        data: {
	            ...d.data,
	            list: d.data.list.map(wrapperBookMark),
	        },
	    };
	});
}


export async function deleteBookMark(list: string[], updateLocal = true) {
    if (config.nowUseOfflineMode) {
        const listData = getCacheData(BOOK_MARK_LIST_KEY) as ListDataItemWithCache<BookMark>[];
        cacheData(BOOK_MARK_LIST_KEY, [
            ...listData.map(i => ({
                ...i,
                // 打标删除
                _isLocalDeleted: i._isLocalDeleted || list.includes(i._id),
            })),
        ].filter(i => !(i._isLocalAdded && i._isLocalDeleted)));
        return {
            code: 0,
            data: {
                successCount: list.length,
            },
        };
    }
    return instance.patch<any, Resp<{
		successCount: number;
		aid: string;
	}>>('/bookmark', {
	    
	    ids: list,
	    action: 'delete',
	    
	}).then(d => {
	    if (updateLocal) {
	        const listData = getCacheData(BOOK_MARK_LIST_KEY) as ListDataItemWithCache<BookMark>[];
	        cacheData(BOOK_MARK_LIST_KEY, [
	            ...listData.filter(i => !list.includes(i._id)),
	        ]);
	    }
	    cacheData(BOOK_MARK_LIST_ANCHOR_KEY, d.data.aid);
	    return d;
	});
}

export function modifyBookMark(bookmark: ListDataItemWithCache<BookMark>, updateLocal = true) {
    if (config.nowUseOfflineMode) {
        const originList = getCacheData(BOOK_MARK_LIST_KEY) as ListDataItemWithCache<BookMark>[];
        cacheData(BOOK_MARK_LIST_KEY, originList.map<ListDataItemWithCache<BookMark>>(i => {
            if (i._id === bookmark._id) {
                return {
                    ...i,
                    ...bookmark,
                    _isLocalChanged: true,
                }
            }
            return i;
        }));
        return {
            code: 0,
            data: {
                successCount: 1,
            },
        };
    }
    return instance.put<any, Resp<{
		succ: boolean;
		aid: string;
	}>>('/bookmark', {
	    ...bookmark,
	}).then(d => {
	    if (updateLocal) {
	        const originList = getCacheData(BOOK_MARK_LIST_KEY) as BookMark[];
	        cacheData(BOOK_MARK_LIST_KEY, originList.map(i => {
	            if (i._id === bookmark._id) {
	                return {
	                    ...i,
	                    ...bookmark,
	                }
	            }
	            return i;
	        }));
	    }
	    cacheData(BOOK_MARK_LIST_ANCHOR_KEY, d.data.aid);
	    return d;
	});
}


export function modifyBookMarks(bookmarks: ListDataItemWithCache<BookMark>[], updateLocal = true) {
    return instance.patch<any, Resp<{
		successCount: number;
		aid: string;
	}>>('/bookmark', {
	    updateList: bookmarks,
	    action: 'update',
	}).then(d => {
	    if (updateLocal) {
	        const originList = getCacheData(BOOK_MARK_LIST_KEY) as BookMark[];
	        cacheData(BOOK_MARK_LIST_KEY, originList.map(i => {
	            const findItem = bookmarks.find(j => j._id === i._id);
	            if (findItem) {
	                return {
	                    ...i,
	                    ...findItem,
	                }
	            }
	            return i;
	        }));
	    }
	    cacheData(BOOK_MARK_LIST_ANCHOR_KEY, d.data.aid);
	    return d;
	});
}

export function addBookMark(bookmark: ListDataItemWithCache<
	Omit<BookMark, 'created_at' | '_id' | 'icon_id'>
>, updateLocal = true) {
    if (config.nowUseOfflineMode) {
        const created_at = new Date().toISOString();
        const id = Date.now() + '';
        const icon_id = 0;
        if (updateLocal) {
            const list = getCacheData(BOOK_MARK_LIST_KEY)
            const totalList: ListDataItemWithCache<BookMark>[] = [
                {
                    ...bookmark,
                    created_at,
                    id,
                    icon_id,
                    _isLocalAdded: true,
                },
                ...list,
            ]
            cacheData(BOOK_MARK_LIST_KEY, totalList);
        }
        return {
            code: 0,
            data: {
                created_at,
                id,
                icon_id,
            }
        }
    }
    return instance.post<any, Resp<{
		id: string;
        aid: string;
	}>>('/bookmark', {
	    ...bookmark,
	}).then(d => {
	    if (updateLocal) {
	        const originList = getCacheData(BOOK_MARK_LIST_KEY) as BookMark[];
	        cacheData(BOOK_MARK_LIST_KEY, [
				{
				    ...bookmark,
				    _id: d.data.id,
				} as ListDataItemWithCache<BookMark>,
				...originList,
	        ]);
	    }
	    cacheData(BOOK_MARK_LIST_ANCHOR_KEY, d.data.aid);
	    return d;
	});
}

// TOOL

export function getFavicon(site: string) {
    if (config.nowUseOfflineMode) {
        return Promise.reject('离线模式禁用查询哦～');
    }
    return instance.get<any, Resp<{
		img: string; // base64
		domain: string;
	}>>('/favicon', {
	    params: {
	        site,
	    },
	});
}
export function createBookmarks(list: Omit<BookMark, 'created_at' | '_id'>[]) {
    if (config.nowUseOfflineMode) {
        return Promise.reject('离线模式禁用批量操作哦～');
    }
    return instance.patch<any, Resp<{
	}>>('/bookmark', {
	    list,
	    action: 'import',
	});
}
export function deleteAllBookmarks() {
    if (config.nowUseOfflineMode) {
        return Promise.reject('离线模式下禁止删除全部哦～');
    }

    return instance.patch('/bookmark', {
        action: 'delete-all',
    });
}