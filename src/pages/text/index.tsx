/* eslint-disable */
import {
	Typography,
	Link,
	CssBaseline,
	Toolbar,
	Box,
	Container,
	Button,
	TextField,
	SpeedDial,
	SpeedDialAction,
	SpeedDialIcon,
	Backdrop,
	Autocomplete,
	NoSsr,
} from '@mui/material';

import { useCallback, useEffect, useState } from 'react';
import React from 'react';

import {
	createClipBoard,
	deleteAllClipBoardList,
	deleteClipBoardList,
	getClipBoardList
} from '../../api';

import CustomThemeProvider from '../../components/Theme';
import useDialog from '../../hooks/useDialog';
import Edit from '../../components/Text/add';
import useTip from '../../hooks/useTip';
import useStateRef from '../../hooks/useStateRef';
import debounce from 'lodash.debounce';
import Empty from '../../components/Empty';
import ListInner from '../../components/Text/listInner';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import { isPc } from '../../utils/env';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import BackTop from '../../components/BackTop';
import Loading from '../../components/Loading';
import { ListDataItemWithCache } from '../../utils';
const isPcEnv = isPc();

const actions = [
	{ icon: <ContentPasteIcon />, name: '空白数据', useClipboardDataOnMount: false, },
	{ icon: <ContentPasteGoIcon />, name: '剪切板数据', useClipboardDataOnMount: true, },
];

export default function ClipBoardList() {

	const [isLoading, setIsLoading] = useState(true)
	const {
		dialog,
		openDialog,
	} = useDialog();

	const {
		tip,
		openTip,
	} = useTip()

	const [list, updateList, listRef] = useStateRef<ListDataItemWithCache<ClipBoard>[]>([]);

	const [showList, updateShowList] = useState<ListDataItemWithCache<ClipBoard>[]>([])

	const [search, updateSearch, searchRef] = useStateRef('');

	const debounceUpdateList = useCallback(debounce(async function () {
		const v = searchRef.current;
		if (v) {
			const newList = listRef.current.filter(i => !i._isLocalDeleted && (i.content.includes(v) || i.note.includes(v)))
			updateShowList(newList);
		} else {
			updateShowList([...listRef.current.filter(i => !i._isLocalDeleted)]);
		}
	}, 400, {
		maxWait: 1000,
	}), [])

	useEffect(() => {
		debounceUpdateList();
	}, 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[
		list,
		search,
	]);

	const clickItem = useCallback(async (i: ClipBoard) => {
		if (i.type === 'text') {
			await navigator.clipboard.writeText(
				i.content
			);
			openTip({
				content: '已粘贴至剪切板',
				color: 'success',
				autoHideDuration: 1000,
			})
		}
	}, 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[])

	const deleteItem = useCallback(async (i: ClipBoard) => {
		const succ = await deleteClipBoardList([i._id]);
		if (!succ) {
			openTip({
				content: '请求失败了哦～',
				color: 'error',
				autoHideDuration: 1000,
			});
		} else {
			openTip({
				content: '删除成功了哦～',
				color: 'success',
				autoHideDuration: 1000,
			});
			getClipBoardData();
		}
	},
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[]);



	const addNew = useCallback(async (useClipboardDataOnMount: boolean) => {
		let value = [] as ClipBoard[];
		const closeDialog = openDialog({
			title: '新增',
			desc: '添加新的数据到远端。当成功保存后，可在任意登陆页面复制该内容。',

			body: <Edit
				allNotes={[...new Set(listRef.current.map(i => i.note).filter(Boolean))]}
				useClipboardDataOnMount={useClipboardDataOnMount} onChange={v => value = v} />,
			async onClickOk() {
				const data = await createClipBoard(value.map(i => ({
					type: i.type,
					content: i.content,
					note: i.note,
				})))
				openTip({
					content: `成功创建${data.data.successCount}条记录`,
					color: 'success',
					autoHideDuration: 1000,
				})
				getClipBoardData()
				closeDialog();
			},
		})
	}, []);

	const getClipBoardData = useCallback(async () => {

		const data = await getClipBoardList();
		updateList(data.data.list);
		setIsLoading(false)
	}, []);

	const deleteAll = useCallback(async () => {
		const closeDialog = openDialog({
			title: '确认删除',
			async onClickOk() {
				const succ = await deleteAllClipBoardList().catch((e) => {
					if (typeof e === 'string') {
						return e;
					}
					return null;
				});
				console.log('succ: ', succ);
				if (succ && typeof succ !== 'string') {
					openTip({
						content: `成功清空所有数据了哦～`,
						color: 'success',
						autoHideDuration: 1000,
					})
					updateList([]);
				} else {
					openTip({
						content: typeof succ === 'string' ? succ : `网络出错了哦～`,
						color: 'error',
						autoHideDuration: 1000,
					})
				}
				closeDialog();
			},
			desc: '确认删除全部记录？删除后，将无法查看所有历史记录。',
		})
	}, [])

	const setClipboard = useCallback(async () => {
		if (listRef.current.length) {
			const list = listRef.current;
			await navigator.clipboard.writeText(list[0].content).then(
				() => {
					openTip({
						content: '成功复制最近一条数据',
						color: 'success',
						autoHideDuration: 1000,
					});
				}
			).catch(() => '');
		} else {
			openTip({
				content: '还没有数据，快去添加吧',
				color: 'warning',
				autoHideDuration: 1000,
			})
		}
	}, [])

	const handleSearchChange = useCallback(async (v: string) => {
		updateSearch(v);
	}, []);

	useEffect(() => {
		getClipBoardData()
	}, []);

	const handleSpeedDialClick = useCallback((e: React.MouseEvent) => {
		const target = e.currentTarget as HTMLElement;
		const idx = Number(target.dataset.idx);
		addNew(actions[idx].useClipboardDataOnMount)
	}, []);

	const [speedDialOpen, setSpeedDialOpen] = useState(false);
	const handleSpeedDialClose = useCallback(function () {
		setSpeedDialOpen(false);
	}, []);

	const handleSpeedDialOpen = useCallback(function () {
		setSpeedDialOpen(true);
	}, [])

	return (
		<CustomThemeProvider>
			<CssBaseline />
			<Header title="剪切板" leftIcon={<ContentPasteGoIcon />} />
			<Toolbar id='toolbar-hidden' />
			<main>
				{/* Hero unit */}
				<Box
					sx={{
						bgcolor: 'background.paper',
						pt: 8,
						pb: 2,
					}}
				>
					<Container maxWidth="sm">
						<Typography
							component="h1"
							variant="h2"
							align="center"
							color="text.primary"
							gutterBottom
						>
							剪切板
						</Typography>
						<Typography variant="h5" align="center" color="text.secondary" paragraph onClick={setClipboard}>
							快速获取你在各处保存的剪切板文本内容(点击该处，快速复制最近一条数据)
						</Typography>
					</Container>
				</Box>

				{
					list.length ? <Container sx={{
						py: 0,
						position: 'sticky',
						top: 64,
						bgcolor: 'background.default',
						zIndex: 1,
					}}>
						<Autocomplete
							freeSolo
							options={[...new Set(list.map(i => i.note).filter(Boolean))]}
							inputValue={search}
							onInputChange={(event, newInputValue) => {
								handleSearchChange(newInputValue || '');
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									margin="dense"
									label="搜索"
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
					isLoading ? <Loading /> : (
						!list.length || !showList.length ? <Container>
						<Empty text={!list.length ? '无数据' : (
							!showList.length ? '无符合筛选条件的数据' : '暂无数据'
						)} />
					</Container> : null
					)
				}
				<ListInner list={showList} onClickItem={clickItem} onDeleteItem={deleteItem} />
				<Container>
					{
						!!list.length && list.length === showList.length
							? <Button fullWidth color='error' variant='outlined' onClick={deleteAll}>删除所有</Button> : null
					}
				</Container>
				<Container sx={{
					height: 32,
				}} />
			</main>

			{
				dialog
			}

			{
				tip
			}
			{
				!isPcEnv ? <NoSsr>
					<Backdrop open={speedDialOpen} sx={{
						zIndex: 1,
					}}/>
				</NoSsr>: null
			}
			<BackTop anchor='#toolbar-hidden' threshold={1000} whenHiddenNode={
				<SpeedDial
					ariaLabel=""
					icon={<SpeedDialIcon />}
					onClose={handleSpeedDialClose}
					onOpen={handleSpeedDialOpen}
					open={speedDialOpen}
					sx={{
						position: 'absolute',
						right: 0,
						bottom: 0,
					}}
				>
					{
						actions.map((action, idx) => (
							<SpeedDialAction
								key={action.name}
								icon={action.icon}
								tooltipTitle={action.name}
								tooltipOpen
								data-idx={idx}
								onClick={handleSpeedDialClick}
							/>
						))
					}

				</SpeedDial>
			} />

			<Footer />
		</CustomThemeProvider>
	);
}