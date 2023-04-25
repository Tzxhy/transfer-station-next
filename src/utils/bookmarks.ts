

export type GenerateBookmark = {
	name: string;
	toolbar?: boolean;
	folder?: boolean;
	url?: string;
	children: GenerateBookmark[];
}
/**
 * 将解析后的书签转换为书签HTML文件
 *
 * @export
 * @param {Bookmark} bookmark 书签对象
 * @return {*}  {string} HTML
 */
export function generateBookMarkHtml(bookmark: GenerateBookmark): string {
	let str = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`
	const loop = (root: GenerateBookmark[]) => {
		let str = [] as string[];
		root.forEach((item) => {
			if (item.folder) {
				str.push(`<DT><H3${item.toolbar ? ` PERSONAL_TOOLBAR_FOLDER="true"` : ''}>${item.name}</H3>`);
				str.push(`<DL><p>`);
				if (item.children?.length) {
					str.push(...loop(item.children));
				}
				str.push(`</DL><p>`)
			} else {
				str.push(`<DT><A HREF="${item.url}">${item.name}</A>`)
			}
		})
		return str
	}
	const r = loop([bookmark])
	let currentPaddingPrefix = 4;
	const getPaddingPrefix = () => ' '.repeat(currentPaddingPrefix);
	r.forEach(i => {
		if (i === '<DL><p>') {
			str += getPaddingPrefix() + i + '\n';
			currentPaddingPrefix += 4;
		} else if (i === '</DL><p>') {
			currentPaddingPrefix -= 4;
			str += getPaddingPrefix() + i + '\n';
		} else {
			str += getPaddingPrefix() + i + '\n';
		}
		
		
	})
	
	str += `
</DL><p>
`
	return str
}