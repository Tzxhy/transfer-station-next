import {
	AppBar,
	Toolbar,
	Typography,
	IconButton,
	SwipeableDrawer,
	List,
	ListItem,
	ListItemText,
	FormControlLabel,
	Switch,
	Divider,
	Box,
	Button,
} from '@mui/material';
import React, { memo, useEffect, useState } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import { FORCE_OFFLINE_KEY } from '../../constants/string';
import { cacheData, getCacheData } from '../../utils/network';
import config from '../../config';
import { getToken, setToken } from '../../utils/token';
import useDialog from '../../hooks/useDialog';

/** Header组件。只相应 title 属性的更新 */
export default memo(function Header(props: {
	leftIcon?: React.ReactNode;
	title: React.ReactNode;
	settingList?: React.ReactNode[];
	showHomeIcon?: boolean;
}) {
	const showHomeIcon = typeof props.showHomeIcon === 'boolean' ? props.showHomeIcon : true;
	const goHome = () => {
		location.href = '/';
	}
	
	const [showDrawer, setShowDrawer] = useState(false)
	const [useForceOfflineMode, setUseForceOfflineMode] = useState(getCacheData<boolean>(FORCE_OFFLINE_KEY) || false)
	const defaultIsOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
	const [isOfflineByBrowser, setIsOfflineByBrowser] = useState(defaultIsOffline)
	const [useOfflineMode, setUseOfflineMode] = useState(useForceOfflineMode || isOfflineByBrowser)

	const [title, setTitle] = useState(`传送站 - ${props.title}`);
	useEffect(() => {
		setTitle(`${useOfflineMode ? '[离线]' : ''}传送站 - ${props.title}`)
	},
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[useOfflineMode])

	const isLogin = !!getToken();

	useEffect(() => {
		const handler = (e: Event) => {
			const t = e.type;
			if (t === 'offline') {
				setIsOfflineByBrowser(true)
			} else if (t === 'online') {
				setIsOfflineByBrowser(false)
			}
		}
		window.addEventListener('online', handler);
		window.addEventListener('offline', handler);
		return () => {
			window.removeEventListener('online', handler);
			window.removeEventListener('offline', handler);
		}
	}, [])

	const handleSetForceOffline = (v: boolean) => {
		setUseForceOfflineMode(v)
		cacheData(FORCE_OFFLINE_KEY, v);
	}

	useEffect(() => {
		config.nowUseOfflineMode = useForceOfflineMode || isOfflineByBrowser
		setUseOfflineMode(config.nowUseOfflineMode);
	}, [
		isOfflineByBrowser,
		useForceOfflineMode,
	])

	const showSettings = () => {
		setShowDrawer(true);
	}

	const {
		dialog,
		openDialog,
	} = useDialog()


	return <AppBar position="fixed" sx={{
		zIndex: 3,
	}}>
		<Toolbar sx={{
			height: '64px !important',
		}}>
			{
				props.leftIcon ? <Box sx={{
					pr: 2,
				}}>
					<IconButton color="inherit" onClick={showSettings} sx={{
						'&:focus': {
							outline: 'unset',
						}
					}}>
						{
							props.leftIcon
						}
					</IconButton>
				</Box> : null
			}
			<Typography variant="h6" color="inherit" noWrap sx={{
				flexGrow: 1,
			}}>
				{title}
			</Typography>
			{
				showHomeIcon ? <IconButton
					size="large"
					aria-label="account of current user"
					aria-controls="menu-appbar"
					aria-haspopup="true"
					onClick={goHome}
					color="inherit"
				>
					<HomeIcon />
				</IconButton> : null
			}
		</Toolbar>
		<SwipeableDrawer
			anchor='left'
			open={showDrawer}
			onClose={() => setShowDrawer(false)}
			onOpen={() => setShowDrawer(true)}
		>
			<List sx={{
				width: 200,
			}}>
				<ListItem>
					<ListItemText sx={{
						textAlign: 'center',
					}}>
						<Typography variant='h5' >
							设置
						</Typography>
					</ListItemText>
				</ListItem>
				<Divider />
				<ListItem>
					<FormControlLabel
						control={<Switch checked={useForceOfflineMode} onChange={e => {
							const v = (e.target as HTMLInputElement).checked;
							handleSetForceOffline(v);
						}} />} label="强制离线模式" />
				</ListItem>
				<ListItem>
					<ListItemText>当恢复在线模式且有网情况下，刷新页面，会同步所有离线改动。注意离线期间不要清除浏览器数据，否则所有操作将丢失。</ListItemText>
				</ListItem>
				<Divider />
				{
					props.settingList && props.settingList.length ? props.settingList.map((i, idx) => <ListItem key={idx}>
						{
							i
						}
					</ListItem>) : null
				}
				{
					isLogin ? <>
						<Divider />
							<ListItem>
								<Button
									fullWidth
									variant='outlined' color='warning' onClick={() => {
										const closeDialog = openDialog({
											title: '登出',
											desc: '确认登出？确认后将回到登录页面',
											async onClickOk() {
												setToken('');
												location.href = '/html/login/';
												closeDialog();
											},
										});
										
								}}>登出</Button>
							</ListItem>
					</> : null
				}
			</List>
		</SwipeableDrawer>
		{
			dialog
		}
	</AppBar>
}, (prevProps, nextProps) => {
	return prevProps.title === nextProps.title;
})