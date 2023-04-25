/* eslint-disable */
import {
	Grid,
	Typography,
	Card,
	Link,
	CardContent,
	Stack,
	Avatar,
	IconButton,
	Button,
	Tooltip,
	useMediaQuery,
	Theme,
	Box,
} from '@mui/material';
import React, {
	createRef,
	memo,
	useCallback,
	useEffect,
	useRef
} from 'react';
import { BookMark, BookMarkWithGet } from '../../api';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { isPc } from '../../utils/env';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { BOOKMARK_CLASS_DIVIDER } from '../../constants/string';


type BookMarkListItem = {
	class: string;
	list: BookMarkWithGet[];
}

type ListInnerProps = {
	className: string;
	list: BookMarkListItem[];
	icons: Record<string, string>;
	search: string;
	setCurrentHandleItem: (item: BookMarkWithGet, ele: HTMLElement) => void;
	deleteGroup: (items: BookMark[]) => void;
	renameGroup: (items: BookMark[]) => void;
}

const isPcEnv = isPc();

export default memo(function ListInner(props: ListInnerProps) {
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);
	const handleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
		const target = e.currentTarget as HTMLElement;

		const row = Number(target.dataset.row);
		const col = Number(target.dataset.col);
		props.setCurrentHandleItem(props.list[row].list[col], target);
	}, [
		props.list,
		props.setCurrentHandleItem,
	]);

	const deleteGroup = useCallback((e: React.MouseEvent) => {
		const target = e.currentTarget as HTMLButtonElement;
		const row = Number(target.dataset.row);
		props.deleteGroup(props.list[row].list)
	}, [
		props.list,
		props.deleteGroup,
	]);

	const renameGroup = useCallback((e: React.MouseEvent) => {
		const target = e.currentTarget as HTMLButtonElement;
		const row = Number(target.dataset.row);
		props.renameGroup(props.list[row].list)
	}, [
		props.list,
		props.deleteGroup,
	]);

	const renderRow = memo(function renderRow(innerProps: ListChildComponentProps) {
		const { index, style, data } = innerProps;
		const i = data[index];
		return (<div style={style} className={props.className + '-' + (index + 1)}>
			<Grid container key={i.class} rowSpacing={{
				xs: 2,
			}} columnSpacing={{
				xs: 3,
				sm: 2,
				md: 2,
			}} sx={{
				pb: 4,
			}}>
				<Grid item xs={12}>
					<Grid container alignItems='flex-end'>
						<Grid item xs={7} sm={8}>
							<Typography variant='h4' className='one-line'>
								{
									i.class.replace('书签栏' + BOOKMARK_CLASS_DIVIDER, '')
								}
							</Typography>
						</Grid>
						<Grid container item xs={5} sm={4} justifyContent='flex-end'>
							{
								isPcEnv ? <>
									<Button
										color='primary'
										data-row={index}
										onClick={renameGroup}
										variant='text'
										sx={{
											mr: 1,
										}}
									>重命名分组</Button>
									<Button
										color='warning'
										data-row={index}
										onClick={deleteGroup}
										variant='text'
									>删除该分组</Button>
								</> : <>
									<IconButton
										color='primary'
										data-row={index}
										onClick={renameGroup}
									><DriveFileRenameOutlineIcon /></IconButton>
									<IconButton
										color='warning'
										data-row={index}
										onClick={deleteGroup}
									><DeleteForeverIcon /></IconButton>
								</>
							}
							
						</Grid>
					</Grid>
				</Grid>
				{
					i.list.map((j: BookMarkWithGet, jIdx: number) => (<Grid item key={j.id} xs={12} sm={6} md={4} lg={3}>
						<Card sx={{
							height: '100%',
							position: 'relative',
						}}>
							<Link href={j.link} target='_blank'>
								<CardContent sx={{
									width: '94%',
									textAlign: 'left',
								}}>

									<Stack sx={{
										width: '100%',
										overflow: 'hidden',
										alignItems: 'center',
									}} spacing={2} direction='row'>
										<Avatar src={props.icons[j.hostname] || j.iconOfThis
											|| props.icons['*']
										} alt={j.title} />
										{
											isPcEnv ? <Tooltip title={j.title} placement='top'>
												<Typography className='two-line' sx={{
													width: 0,
													flexGrow: 1,
												}} variant='body1'>{j.title}</Typography>
											</Tooltip> : <Typography className='two-line' sx={{
													width: 0,
													flexGrow: 1,
												}} variant='body1'>{j.title}</Typography>
										}
									</Stack>

								</CardContent>
							</Link>

							<IconButton
								onMouseDown={handleMouseDown}
								onClick={handleClick}
								data-row={index}
								data-col={jIdx}
								sx={{
									position: 'absolute',
									right: 4,
									top: 4,
								}}
							>
								<MoreHorizIcon />
							</IconButton>
						</Card>
					</Grid>))
				}
			</Grid>
		</div>
		);
	})

	const matchSm = useMediaQuery((theme: Theme) => theme.breakpoints.up('sm'))
	const matchMd = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))
	const matchLg = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'))

	const getDivider = () => {
		// xs={12} sm={6} md={4} lg={3}
		if (matchLg) return 4;
		if (matchMd) return 3;
		if (matchSm) return 2;
		return 1;
	}
	const getItemSize = (index: number) => {
		const list = props.list[index].list;
		const size = 58 + Math.ceil(list.length / getDivider()) * 104 + 16;
		return size;
	};

	const ref = createRef<VariableSizeList>()

	const listStructureHasChangedRef = useRef('');
	listStructureHasChangedRef.current = props.list.map((i, idx) => `i-${idx
		}-c-${i.class}-l-${i.list.length}`).join('_')

	useEffect(() => {
		console.log('列表结构改变，重新计算');
		ref.current!.resetAfterIndex(0);
	}, [
		listStructureHasChangedRef.current,
	]);

	useEffect(() => {
		console.log('搜索词改变，回到顶部 + 重新计算');
		ref.current!.resetAfterIndex(0);
		ref.current!.scrollTo(0);
	}, [props.search]);

	const itemKey = (index: number, data: typeof props.list) => {
		const key = data[index].class + data[index].list.length
		return key;
	}
	return <Box
		onContextMenu={e => e.preventDefault()}
	>
		<VariableSizeList
			ref={ref}
			// key={key}
			itemData={props.list}
			itemKey={itemKey}
			className={props.className}
			width='100%'
			height={props.list.length > 0 ? window.innerHeight - 145 : 1}
			itemCount={props.list.length}
			itemSize={getItemSize}
			overscanCount={3}
		>
			{
				renderRow
			}
		</VariableSizeList>
	</Box>
})