/* eslint-disable */
import React, { useEffect, useState } from 'react'

import Image from 'next/image';


import {
	Alert,
	Box,
	Button,
	Container,
	Grid,
	TextField,
	Typography,
} from '@mui/material'
import PasswordInput from '../../components/PasswordInput';
import { login, register } from '../../api';
import { setToken } from '../../utils/token';

// @ts-ignore
import hash from 'hash.js/lib/hash/sha/256';
import CustomThemeProvider from '../../components/Theme';


export default function Login() {

	const [isRegister, setIsRegister] = useState(false);

	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');

	const clearAllInput = () => {
		setUsername('');
		setPassword('');
		setConfirmPassword('');

	}

	const goToLogin = () => {
		clearAllInput();
		setIsRegister(false);
	}

	const goToRegister = () => {
		clearAllInput();
		setIsRegister(true);
	}

	const clickLoginOrRegister = async () => {
		if (isRegister && errorTips) return;
		if (isRegister) {
			if (password.length < 6) {
				setErrorTips('密码长度过短，超过6位即可');
				return;
			}
			const registerData = await register(username, hash().update(password).digest('hex'));
			if (registerData.data?.token) {
				setToken(registerData.data.token);
				location.href = '/';
			} else {
				setErrorTips(registerData.message);
			}
		} else {
			const loginData = await login(username, hash().update(password).digest('hex'))
			if (loginData) {
				if (loginData.data?.token) {
					setToken(loginData.data.token);
					location.href = '/';
				} else {
					setErrorTips(loginData.message);
				}
			}
		}
	}

	const [errorTips, setErrorTips] = useState('');

	useEffect(() => {
		setErrorTips('');
		if (isRegister) {
			if (password && confirmPassword && password !== confirmPassword) {
				setErrorTips('密码不一致');
			}
		}
	}, [
		isRegister,
		password,
		confirmPassword,
	]);

	return <CustomThemeProvider>
		<Box sx={{
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'background.paper',
		}}>
			<Container maxWidth='md' sx={{
				boxShadow: {
					xs: 0,
					md: 4,
				},
				borderRadius: 2,
				height: 500,
				userSelect: 'none',
			}}>
				<Grid container sx={{
					height: '100%',
					borderColor: 'divider',
				}}>
					<Grid item
						sx={{
							width: 0,
							flexGrow: 1,
							display: {
								xs: 'none',
								sm: 'block',
							}
						}}
					>
						<Box sx={{
							height: '100%',
							width: '100%',
							display: 'flex',
							alignItems: 'center',
						}}
						>
							<Image alt='' src='/img/login.svg' width={300} height={300} style={{
								// borderRight: '1px solid #dcdcdc',
								width: '100%',
							}} />
						</Box>

					</Grid>

					<Grid item sx={{
						flexGrow: 1,
						width: 0,
					}}>
						<Grid container sx={{
							width: '100%',
						}}>
							<Grid item sx={{
								pt: 8,
								width: '100%',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								fontSize: 28,
							}}>
								<Image alt='' src='/icon.png' width={24} height={24} style={{
									marginRight: 16,
								}} />
								<Typography variant='h5' sx={{
									color: 'text.primary',
								}}>传送站</Typography>
							</Grid>
							<Grid item sx={{
								pt: 6,
								px: 4,
								width: '100%',
							}}>
								<TextField value={username}
									onChange={e => {
										setUsername(e.target.value);
									}}
									fullWidth size='small' label="用户名" variant="outlined" />
							</Grid>

							<Grid item sx={{
								pt: 4,
								px: 4,
								width: '100%',
							}}>
								<PasswordInput key={'p1-' + isRegister} label="密码" value={password} handleChange={(e) => {
									setPassword(e.target.value)
								}} />
							</Grid>
							{
								isRegister ? <Grid item sx={{
									pt: 4,
									px: 4,
									width: '100%',
								}}>
									<PasswordInput key={'p2-' + isRegister} label="确认密码" value={confirmPassword} handleChange={(e) => {
										setConfirmPassword(e.target.value)
									}} />
								</Grid> : null
							}

							{
								errorTips ? <Box sx={{
									pt: 2,
									px: 4,
									width: '100%',
								}}>
									<Alert severity="error" color='error'>{errorTips}</Alert>
								</Box> : null
							}

							<Grid item sx={{
								pt: isRegister ? 4 : 6,
								px: 4,
								width: '100%',
							}}>
								<Button fullWidth size='large' variant="contained" onClick={clickLoginOrRegister}>
									{
										isRegister ? '注册' : '登录'
									}
								</Button>
							</Grid>

							<Grid item sx={{
								pt: 4,
								px: 4,
								width: '100%',
								display: 'flex',
								justifyContent: 'flex-end',
							}}>
								{
									isRegister ? <Button
										size="small" onClick={goToLogin}
									>已有账号？立即登录！</Button> : <Button size="small" onClick={goToRegister}>没有账号？立即注册！</Button>
								}
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Container>
		</Box>
	</CustomThemeProvider>;
}


