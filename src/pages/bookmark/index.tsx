
import debounce from 'lodash.debounce'
import {
	CssBaseline,
	Toolbar,
	Container,
	Button,
	TextField,
	SpeedDial,
	Autocomplete,
	Box,
	Input,
	NoSsr,
} from '@mui/material';
import { bookmarksToJSON, Bookmark as JSONBookMark } from 'bookmarks-to-json';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useCallback, useEffect, useRef } from 'react';
import {
	addBookMark,
	BookMark,
	deleteBookMark,
	getBookMarkList,
	createBookmarks,
	modifyBookMark,
	BookMarkWithGet,
	wrapperBookMark,
	deleteAllBookmarks,
	modifyBookMarks,
} from '../../api';
import CustomThemeProvider from '../../components/Theme';
import { useMenu } from '../../hooks/useMenu';
import useDialog from '../../hooks/useDialog';
import EditBookMarkDialogBody from '../../components/Bookmark/edit';
import useStateRef from '../../hooks/useStateRef';
import useTip from '../../hooks/useTip';
import Empty from '../../components/Empty';
import AddIcon from '@mui/icons-material/Add';
import ListInner from '../../components/Bookmark/listInner';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import deleteWithRevoke from '../../utils/deleteWithRevoke';
import BackTop from '../../components/BackTop';
import { BOOKMARK_CLASS_DIVIDER } from '../../constants/string';
import { GenerateBookmark, generateBookMarkHtml } from '../../utils/bookmarks';
import FileSaver from 'file-saver';

type BookMarkListItem = {
	class: string;
	list: BookMarkWithGet[];
}

let menuClose!: () => void;

export default function ClipBoardList() {

	const currentBookMarkRef = useRef<BookMarkWithGet | null>(null);
	const [list, updateList, listRef] = useStateRef<BookMarkListItem[]>([]);

	const [showList, updateShowList, showListRef] = useStateRef<BookMarkListItem[]>([]);
	const [icons, updateIcons, iconsRef] = useStateRef<Record<string, string>>({});
	const [search, updateSearch, searchRef] = useStateRef('');
	const debouncedHandle = useCallback(debounce(() => {
		const search = searchRef.current;
		if (search) {
			const searchReg = new RegExp(search, 'i');
			const newShowList = listRef.current.map(i => {
				return {
					class: i.class,
					list: i.list.filter(j => searchReg.test(j.class + j.link + j.title)),
				}
			}).filter(i => i.list.length);
			updateShowList(newShowList);
		} else {
			updateShowList([...listRef.current]);
		}
	}, 400), []);

	useEffect(() => {
		debouncedHandle();
	}, [list, search])

	const {
		dialog,
		openDialog,
	} = useDialog()


	const {
		tip,
		openTip,
	} = useTip();

	const deleteBookmarksWithRevoke = useCallback((items: BookMark[]) => {
		const title = items.length === 1 ? (
			`书签 "${items[0].title}"`
		) : (`分组 "${items[0].class}" 共${items.length}个书签`)
			
		deleteWithRevoke(
			() => {
				if (items.length === 1 && menuClose) { // 只有一个时，只能点击卡片的右上角，此时需要关闭该弹卡
					menuClose();
				}
			},
			async () => {
				const idsMap = new Set(items.map(i => i.id));
				const succ = await deleteBookMark([...idsMap]);
				if (succ) {
					
					const newListObj = listRef.current.map(classArr => {
						return {
							class: classArr.class,
							list: classArr.list.filter(i => !idsMap.has(i.id)),
						}
					}).filter(i => i.list.length);
					updateList(newListObj);
				}
			},
			openTip,
			title,
		);
	}, [])

	const renameBookmarks = useCallback((items: BookMark[]) => {
		let newClass = items[0].class;
		const closeDialog = openDialog({
			title: '重命名分组',
			body: <Box>
				<Input placeholder='请输入新的分组名称，不可为空' defaultValue={newClass} onChange={e => {
					newClass = e.target.value;
				}} />
			</Box>,
			async onClickOk() {
				if (!newClass) return;
				await modifyBookMarks(items.map(i => ({
					...i,
					class: newClass,
				})));
				closeDialog();
				getBookMarkData();
			},
		})
	}, []);

	const onIconUpdate = useCallback((item: {
		img: string;
		domain: string;
	}) => {
		if (item.domain) {
			updateIcons({
				...iconsRef.current,
				[item.domain]: item.img,
			});
			updateShowList([...showListRef.current]);
		}
		
	}, []);

	const {
		menu,
		menuOpen,
	} = useMenu({
		list: [
			{
				title: '修改',
				onClick: () => {
					menuClose();
					const item = currentBookMarkRef.current!;
					let final = wrapperBookMark({
						created_at: item.created_at,
						id: item.id,
						class: item.class,
						title: item.title,
						link: item.link,
						icon: item.iconOfThis,
						icon_id: item.iconId,
					});
					const closeDialog = openDialog({
						title: '修改',
						desc: '添加新的数据到远端。当成功保存后，可在任意登陆页面复制该内容。',
						body: <EditBookMarkDialogBody
							icons={iconsRef.current}
							onIconUpdate={onIconUpdate} {...final} onChange={(d) => final = d} allClasss={list.map(i => i.class)} />,
						async onClickOk() {
							const succ = await modifyBookMark(final)
							if (succ) {
								openTip({
									color: 'success',
									content: '成功修改',
								});
								let hasSameClass = false;
								let newListObj = listRef.current.map(classArr => {
									const list = classArr.list.map(i => {
										if (i.id === final.id) {
											return final;
										}
										return i;
									}).filter(j => j.class === classArr.class);
									if (classArr.class === final.class) {
										hasSameClass = true;
									}
									return {
										class: classArr.class,
										list,
									}
								}).filter(i => i.list.length);
								if (!hasSameClass) {
									// 添加新的到头
									newListObj = [{
										class: final.class,
										list: [final],
									}, ...newListObj];
								}
								updateList(newListObj);
							}
							closeDialog();

						},
					});
				},
			},
			{
				title: '删除',
				onClick: () => {
					deleteBookmarksWithRevoke([currentBookMarkRef.current!]);
				},
			},
		],
	})

	const addNew = async () => {
		let final = {
			title: '',
			link: '',
			icon: '',
			class: '',
		};
		const closeDialog = openDialog({
			title: '新增',
			desc: '添加新的数据到远端。当成功保存后，可在任意登陆页面复制该内容。',
			body: <EditBookMarkDialogBody
				icons={iconsRef.current}
				onIconUpdate={onIconUpdate} onChange={(d) => final = d} allClasss={list.map(i => i.class)} />,
			async onClickOk() {
				const succ = await addBookMark(final)
				if (succ) {
					openTip({
						color: 'success',
						content: '成功添加',
					});
					const newListObj = [...listRef.current];
					let inserted = false;
					const target = wrapperBookMark({
						...final,
						...succ.data,
					});
					newListObj.some(i => {
						if (i.class === final.class) {
							inserted = true;
							i.list.push(target);
						}
						return inserted;
					})
					if (!inserted) {
						newListObj.push({
							class: final.class,
							list: [target],
						});
					}
					updateList(newListObj);
				}
				closeDialog();
			},
		});
	}

	const getBookMarkData = async () => {
		const data = await getBookMarkList();
		updateIcons(data.data.icons);
		const newList: BookMarkListItem[] = [];
		const newListKeys: Record<string, BookMarkWithGet[]> = {};
		data.data.list.forEach((i: BookMarkWithGet) => {
			const c = i.class;
			if (!(c in newListKeys)) {
				newListKeys[c] = [];
			}
			const list = newListKeys[c];
			list.push(i);
		});

		Object.keys(newListKeys).sort((a, b) => Number(a < b ? -1 : 1)).forEach(i => {
			const list = newListKeys[i];
			newList.push({
				class: i,
				list,
			});
		})
		updateList(newList);
	}

	useEffect(() => {
		getBookMarkData()
	}, []);

	const handleSearchChange = useCallback((v: string) => {
		updateSearch(v);
	}, []);

	const setCurrentHandleItem = useCallback((item: BookMarkWithGet, ele: HTMLElement) => {
		currentBookMarkRef.current = item;
		menuClose = menuOpen(ele);
	}, []);

	const totalNum = listRef.current.reduce((total, item) => total + item.list.length, 0);

	return (
		<CustomThemeProvider>
			<CssBaseline />
			<Header
				title='书签'
				leftIcon={<BookmarkIcon />}
				settingList={[
					<Button key={1} variant="outlined" component="label" fullWidth>
						从书签文件导入
						<input hidden accept="text/html" onChange={async e => {
							if (!e.target.files?.length) {
								return
							}
							const file = e.target.files[0]
							const html = await file.text();
							let bookmarks = bookmarksToJSON(html, {
								stringify: false,
							});

							if (bookmarks.length === 1) {
								bookmarks = bookmarks[0].children!;
							}
							
							const bookmarkList = [] as Omit<BookMark, 'created_at' | 'id'>[];
							function handleBookmarkList(parentTitle: string, list: JSONBookMark[]) {
								list.forEach(b => {
									if (b.type === 'link') {
										bookmarkList.push({
											title: b.title,
											link: b.url!,
											class: parentTitle ? parentTitle : '书签栏',
											icon: b.icon ?? '',
											icon_id: 0,
										});
									} else if (b.type === 'folder') {
										b.children?.length && handleBookmarkList((parentTitle ? 
											(parentTitle + BOOKMARK_CLASS_DIVIDER) : ''
										) + b.title, b.children)
									} else {
										throw new Error('未知类型：' + b.type);
									}
								})
							}
							handleBookmarkList('', bookmarks);
							await createBookmarks(bookmarkList);
							getBookMarkData();
						}} type="file" />
					</Button>,
					<Button key={2} variant="outlined" component="label" fullWidth onClick={() => {
						const bookmarks: GenerateBookmark = {
							name: '书签栏',
							toolbar: true,
							folder: true,
							children: [],
							url: '',
						};
						const dirMap = new Map<string, GenerateBookmark[]>();
						const patchChildrenForBookmark = (path: string[]) => {
							if (path.length === 1) { // 只有一层，那么当作 “书签栏” 的直接下级
								if (path[0] === '书签栏') {
									return bookmarks.children;
								}
								const item = bookmarks.children.find(i => i.name === path[0])
								if (item) {
									return item.children;
								}
								const newItem = {
									name: path[0],
									toolbar: false,
									folder: true,
									children: [],
								} as GenerateBookmark;
								bookmarks.children.push(newItem);
								return newItem.children;
							}
							let nowLevel = bookmarks;
							path.forEach(i => {
								const item = nowLevel.children.find(j => j.name === i);
								if (item) { // 有，
									nowLevel = item;
								} else { // 无，创建新的item
									const newItem = {
										name: i,
										toolbar: false,
										folder: true,
										children: [],
									} as GenerateBookmark;
									nowLevel.children.push(newItem);
									nowLevel = newItem;
								}
							});
							return nowLevel.children;
						}
						const uniquePath = (str: string[]) => {
							return str.filter(i => i !== '书签栏');
						}
						listRef.current.forEach(i => {
							i.list.forEach(item => {
								const dirPath = uniquePath(i.class.split(BOOKMARK_CLASS_DIVIDER));
								let list = [] as (typeof bookmarks)[];
								if (!dirMap.has(item.class)) { // 无路径索引，则先创建
									list = patchChildrenForBookmark(dirPath)
									dirMap.set(item.class, list);
								} else {
									list = dirMap.get(item.class)!;
								}
								list.push({
									name: item.title,
									toolbar: false,
									folder: false,
									children: [],
									url: item.link,
								})
								
							});
						})
						const html = generateBookMarkHtml(bookmarks)
						const b = new Blob([html], {type: 'text/html;charset=utf-8'})
						const date = new Date();
						FileSaver.saveAs(b, 'transfer_station_bookmarks_' + `${date.getFullYear()}_${date.getMonth() + 1}_${
							date.getDate()
						}.html`);
					}}>
						书签导出
					</Button>,
					<Button key={3} variant="outlined" fullWidth color='warning' onClick={() => {
						const closeDialog = openDialog({
							title: '确认删除所有',
							desc: '删除所有书签数据，将无法恢复。',
							async onClickOk() {
								const ret = await deleteAllBookmarks().catch(e => e);
								if (typeof ret === 'string') {
									openTip({
										content: ret,
										color: 'error',
									})
								} else {
									openTip({
										content: '成功删除所有书签了哦～',
										color: 'success',
									})
									updateList([]);
								}
								closeDialog();
							},
						})
					}}>
						删除全部
					</Button>
				]}	
			/>
			<Toolbar />
			<main>
				{
					list.length ? <Container sx={{
						bgcolor: 'background.default',
						mt: 1,
						pb: 1,
					}}>
						<Autocomplete
							freeSolo
							options={[...new Set(list.map(i => i.class.replace('书签栏' + BOOKMARK_CLASS_DIVIDER, '')).filter(Boolean))]}
							inputValue={search}
							onInputChange={(event, newInputValue) => {
								handleSearchChange(newInputValue || '');
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									margin="dense"
									label={`在${listRef.current.length}个类别，${totalNum}个书签中搜索`}
									fullWidth
									size='small'
									variant="standard"
									InputProps={{
										...params.InputProps,
									}}
								/>
							)}
						/>
					</Container> : null
				}
				{
					!list.length || !showList.length ? <Container sx={{
						py: 4,
					}}>
						<Empty text={!list.length ? '无数据，请先添加书签' : (
							!showList.length ? '无符合筛选条件的数据' : '暂无数据'
						)} />
					</Container> : null
				}
				<Container sx={{
					pt: 1,
					width: '100%',
					maxWidth: 'unset !important',
				}}>
					{/* End hero unit */}
					<ListInner
						className='list-hidden'
						search={search}
						list={showList}
						icons={icons}
						setCurrentHandleItem={setCurrentHandleItem}
						deleteGroup={deleteBookmarksWithRevoke}
						renameGroup={renameBookmarks}
					/>
				</Container>
			</main>
			{
				dialog
			}
			{
				tip
			}
			{
				menu
			}
			<NoSsr>
				<BackTop
					target={() => document.querySelector('.list-hidden')!}
					threshold={1000}
					whenHiddenNode={
						<SpeedDial
							ariaLabel="SpeedDial basic example"
							icon={<AddIcon />}
							onClick={addNew}
						></SpeedDial>
					}
				/>
			</NoSsr>

		</CustomThemeProvider>
	);
}