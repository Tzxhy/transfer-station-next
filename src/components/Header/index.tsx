/* eslint-disable */
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import React, { memo, useEffect, useState } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import { FORCE_OFFLINE_KEY } from '../../constants/string';
import { cacheData, getCacheData } from '../../utils/network';
import config from '../../config';
import { getToken, setToken } from '../../utils/token';
import useDialog from '../../hooks/useDialog';
import useTip from '../../hooks/useTip';
import PasswordInput from '../PasswordInput';
import { changePassword } from '../../api';

// @ts-ignore
import hash from 'hash.js/lib/hash/sha/256';

import Link from 'next/link'

/** Header组件。只相应 title 属性的更新 */
export default memo(function Header(props: {
	leftIcon?: React.ReactNode;
	title: React.ReactNode;
	settingList?: React.ReactNode[];
	showHomeIcon?: boolean;
}) {
    const showHomeIcon = typeof props.showHomeIcon === 'boolean' ? props.showHomeIcon : true;
	
    const [showDrawer, setShowDrawer] = useState(false)
    const [useForceOfflineMode, setUseForceOfflineMode] = useState(getCacheData<boolean>(FORCE_OFFLINE_KEY) || false)
    const defaultIsOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    const [isOfflineByBrowser, setIsOfflineByBrowser] = useState(defaultIsOffline)
    const [useOfflineMode, setUseOfflineMode] = useState(useForceOfflineMode || isOfflineByBrowser)

    const [title, setTitle] = useState(`传送站 - ${props.title}`);
    useEffect(() => {
        setTitle(`${useOfflineMode ? '[离线]' : ''}传送站 - ${props.title}`)
    },
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

    const {
        tip,
        openTip,
    } = useTip()

    // 修改密码弹窗
    const [pwdDialogOpen, setPwdDialogOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdError, setPwdError] = useState('');

    const openPasswordDialog = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPwdError('');
        setPwdDialogOpen(true);
    }

    const submitChangePassword = async () => {
        if (newPassword.length < 6) {
            setPwdError('新密码长度至少 6 位');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdError('两次输入的新密码不一致');
            return;
        }
        const data = await changePassword(
            hash().update(oldPassword).digest('hex'),
            hash().update(newPassword).digest('hex'),
        );
        if (data.code === 0) {
            setPwdDialogOpen(false);
            setPwdError('');
            openTip({
                content: '密码修改成功',
                color: 'success',
            });
        } else {
            setPwdError(data.message || '修改失败，请稍后再试');
        }
    }

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
                showHomeIcon ? <Link href="/"><IconButton
                    size="large"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    color="inherit"
                >
                    <HomeIcon />
                </IconButton></Link> : null
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
                                variant='outlined' color='primary' onClick={openPasswordDialog}>修改密码</Button>
                        </ListItem>
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
        <Dialog open={pwdDialogOpen} onClose={() => setPwdDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>修改密码</DialogTitle>
            <DialogContent>
                <Box sx={{
                    pt: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}>
                    <PasswordInput label="当前密码" value={oldPassword} handleChange={e => setOldPassword(e.target.value)} />
                    <PasswordInput label="新密码" value={newPassword} handleChange={e => setNewPassword(e.target.value)} />
                    <PasswordInput label="确认新密码" value={confirmPassword} handleChange={e => setConfirmPassword(e.target.value)} />
                    {
                        pwdError ? <Alert severity="error">{pwdError}</Alert> : null
                    }
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setPwdDialogOpen(false)}>取消</Button>
                <Button onClick={submitChangePassword}>确定</Button>
            </DialogActions>
        </Dialog>
        {
            tip
        }
    </AppBar>
}, (prevProps, nextProps) => {
    return prevProps.title === nextProps.title;
})