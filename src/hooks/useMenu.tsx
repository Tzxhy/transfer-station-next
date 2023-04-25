import {
	Menu,
	MenuItem,
} from '@mui/material';
import { useMemo, useState } from 'react';

type MenuItem = {
	title: React.ReactNode;
	onClick: () => void;
}
type UseMenuConf = {
	list?: MenuItem[];
}

export function useMenu(conf: UseMenuConf) {

	const [list, setList] = useState<MenuItem[]>(conf.list ?? []);
	const [isMenuOpened, setMenuOpen] = useState(false)
	const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null)

	const handleMenuClose = () => {
		setMenuOpen(false);
	}

	const menu = useMemo(() => <Menu
		anchorEl={menuAnchorEl}
		open={isMenuOpened}
		onClose={handleMenuClose}
		sx={{
			'& .MuiPaper-root': {
				minWidth: 100,
				'& .MuiButtonBase-root': {
					justifyContent: 'center',
				},
				'& 	.Mui-focusVisible': {
					backgroundColor: 'background.default',
				}
			}
		}}
	>
		{
			list.map((i, idx) => (
				<MenuItem key={idx} onClick={i.onClick}>
					{
						i.title
					}
				</MenuItem>
			))
		}
	</Menu>, [
		menuAnchorEl,
		isMenuOpened,
		list,
	]);

	const menuOpen = (ele: HTMLElement, list?: UseMenuConf['list']) => {
		setMenuAnchorEl(ele);
		if (list?.length) {
			setList(list);
		}
		setTimeout(() => setMenuOpen(true))

		return handleMenuClose;
	};

	return {
		menu,
		menuOpen,
	};

}