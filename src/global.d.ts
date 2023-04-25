import {
	NextRequest,
} from 'next/server';

export type UserPayload = {
    username: string;
    userid: string;
}

declare module 'bookmarks-to-json' {
	export type Bookmark = {
		/** 添加日期 */
		addDate: number;
		/** 子元素。当type为folder时存在 */
		children?: Bookmark[];
		/** 类型 */
		type: 'link' | 'folder';
		/** 当为link时存在 */
		url?: string;
		/** 标题 */
		title: string;
		/** 当为link时可能存在 */
		icon?: string;
		/** 上一次修改日期 */
		lastModified: number;
	}
	export const bookmarksToJSON: (html: string, options: {
		stringify: boolean;
	}) => Bookmark[];
}

export class NextRequestWithContext extends NextRequest {
	context: UserPayload;
}