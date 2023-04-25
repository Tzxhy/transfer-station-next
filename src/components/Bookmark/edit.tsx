/* eslint-disable */
import {
	Autocomplete,
	Box,
	FormControl,
	FormLabel,
	TextField,
} from '@mui/material';
import debounce from 'lodash.debounce';
import { useCallback, useEffect, useState } from 'react';
import { BookMarkWithGet, getFavicon, wrapperBookMark } from '../../api';
import useStateRef from '../../hooks/useStateRef';
import { getHostname } from '../../utils/network';

type EditBookMark = Partial<BookMarkWithGet> & {
	onChange: (data: BookMarkWithGet) => void;
	icons: Record<string, string>;
	allClasss: string[];
	onIconUpdate: (iconData: {img: string; domain: string;}) => void;
}

export default function EditBookMarkDialogBody(props: EditBookMark) {

	const [newClass, setNewClass] = useState(props.class ?? '');
	const [newTitle, setNewTitle] = useState(props.title ?? '');
	const [newLink, setNewLink, newLinkRef] = useStateRef(props.link ?? '');
	const [newIcon, setNewIcon] = useState(props.icon ?? '');
	useEffect(() => {
		const h = getHostname(props.link!);
		setNewIcon(props.icons[h || '*'] ?? props.icon ?? '');
	}, [
		props.link,
		props.icons,
	])

	useEffect(() => {
		props.onChange(wrapperBookMark({
			id: props.id ?? '',
			created_at: props.created_at ?? '',
			title: newTitle,
			class: newClass,
			link: newLink,
			icon: newIcon,
			icon_id: props.icon_id!,
		}));
	}, [
		newClass,
		newTitle,
		newLink,
		newIcon,
	]);

	const updateIcon = useCallback(debounce(async () => {
		const icon = await getFavicon(newLinkRef.current);
		if (icon?.data?.img) {
			setNewIcon(icon.data.img);
		}
		if (typeof icon?.data?.domain === 'string') {
			props.onIconUpdate(icon.data);
		}
	}, 2000), [])

	useEffect(() => {
		updateIcon();
	}, [newLink])

	return <Box>
		<Autocomplete
			freeSolo
			options={props.allClasss}
			inputValue={newClass}
			onInputChange={(event, newInputValue) => {
				setNewClass(newInputValue || '');
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					margin="dense"
					label="分类"
					fullWidth
					variant="standard"
					InputProps={{
						...params.InputProps,
					}}
				/>
			)}
		/>
		<TextField
			margin="dense"
			autoComplete='new-password'
			label="标题"
			fullWidth
			variant="standard"
			value={newTitle}
			onChange={e => {
				setNewTitle(e.target.value)
			}}
		/>
		<TextField
			autoComplete='new-password'
			margin="dense"
			label="链接"
			fullWidth
			variant="standard"
			value={newLink}
			onChange={e => {
				setNewLink(e.target.value)
			}}
		/>
		<FormControl sx={{
			alignItems: 'flex-start',
		}}>
			<FormLabel>网址icon(填写链接后自动生成)</FormLabel>
			{
				newIcon ? <img src={newIcon} alt="icon" height={64} /> : null
			}
		</FormControl>
		
	</Box>
}