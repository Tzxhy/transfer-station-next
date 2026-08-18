/* eslint-disable */
import {
	Typography,
	CssBaseline,
	Toolbar,
	Box,
	Container,
	Button,
	TextField,
	List,
	ListItem,
	ListItemAvatar,
	Avatar,
	ListItemText,
	IconButton,
	LinearProgress,
	Fab,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import {
	deleteAllFileList,
	deleteFileList,
	getFileList,
	renameFile,
	FileItem,
} from '../../api';

import CustomThemeProvider from '../../components/Theme';
import useDialog from '../../hooks/useDialog';
import useTip from '../../hooks/useTip';
import Empty from '../../components/Empty';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Loading from '../../components/Loading';
import BackTop from '../../components/BackTop';
import { getToken } from '../../utils/token';

import UploadFileIcon from '@mui/icons-material/UploadFile';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DeleteIcon from '@mui/icons-material/Delete';

const formatSize = (size: number) => {
	if (size < 1024) return `${size} B`;
	const units = ['KB', 'MB', 'GB', 'TB'];
	let i = -1;
	let n = size;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	return `${n.toFixed(1)} ${units[i]}`;
};

const formatTime = (time: string) => {
	const d = new Date(time);
	const pad = (v: number) => String(v).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getFileIcon = (item: FileItem) => {
	const is = (regex: RegExp) => regex.test(item.name);
	if (is(/\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i)) return <ImageIcon />;
	if (is(/\.(mp4|webm|mkv|mov|avi|flv)$/i)) return <MovieIcon />;
	if (is(/\.(mp3|wav|flac|aac|ogg|m4a)$/i)) return <AudioFileIcon />;
	if (is(/\.(txt|md|json|xml|html?|js|mjs|cjs|ts|tsx|jsx|css|scss|log|csv|yaml|yml)$/i)) return <DescriptionIcon />;
	return <InsertDriveFileIcon />;
};

/** 通过 XHR 将文件原始内容上传到服务端 API（可获得上传进度） */
const uploadFileToServer = (file: File, onProgress: (percentage: number) => void) => new Promise<void>((resolve, reject) => {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', `/api/file?name=${encodeURIComponent(file.name)}`);
	xhr.setRequestHeader('Authorization', getToken());
	xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
	xhr.upload.onprogress = (e) => {
		if (e.lengthComputable) {
			onProgress(Math.round((e.loaded / e.total) * 100));
		}
	};
	xhr.onload = () => {
		try {
			const resp = JSON.parse(xhr.responseText);
			if (xhr.status >= 200 && xhr.status < 300 && resp.code === 0) {
				resolve();
			} else {
				reject(new Error(resp?.message || '上传失败'));
			}
		} catch (err) {
			reject(err);
		}
	};
	xhr.onerror = () => reject(new Error('网络错误，上传失败'));
	xhr.send(file);
});

export default function FileListPage() {

	const [list, updateList] = useState<FileItem[]>([]);
	const [uid, setUid] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [uploadingList, updateUploadingList] = useState<{
		name: string;
		progress: number;
	}[]>([]);

	const {
		dialog,
		openDialog,
	} = useDialog();

	const {
		tip,
		openTip,
	} = useTip()

	const getFileListData = useCallback(async () => {
		const data = await getFileList();
		if (data.code === 0) {
			setUid(data.data.uid);
			updateList(data.data.list);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		getFileListData()
	}, [getFileListData]);

	const isUploading = !!uploadingList.length;

	// 上传文件（客户端直传服务端 API，服务端写入 Vercel Blob）
	const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);
		e.target.value = '';
		if (!files.length || !uid) return;

		// 上传前先校验同名文件，提前给出提示
		const existingNames = new Set(list.map(i => i.name));

		let successCount = 0;
		let failCount = 0;
		const tasks = files.map(file => {
			const alreadyExists = existingNames.has(file.name);
			return (async () => {
				updateUploadingList(prev => [...prev, { name: file.name, progress: 0 }]);
				try {
					if (alreadyExists) {
						throw new Error(`已存在同名文件「${file.name}」`);
					}
					await uploadFileToServer(file, (percentage) => {
						updateUploadingList(prev => prev.map(i => i.name === file.name ? ({
							...i,
							progress: percentage,
						}) : i));
					});
					successCount++;
				} catch (err) {
					failCount++;
					throw err;
				} finally {
					updateUploadingList(prev => prev.filter(i => i.name !== file.name));
				}
			})();
		});
		const results = await Promise.allSettled(tasks);
		const failReasons = results
			.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
			.map(r => (r.reason as Error)?.message || '上传失败');
		openTip({
			content: failCount
				? `上传完成：成功 ${successCount} 个，失败 ${failCount} 个（${[...new Set(failReasons)].join('；')}）`
				: `成功上传 ${successCount} 个文件`,
			color: failCount ? 'warning' : 'success',
			autoHideDuration: 3000,
		});
		getFileListData();
	}, [uid, list, getFileListData]);

	// 下载文件（通过服务端 API 流转，私有 store 需要鉴权）
	const download = useCallback(async (item: FileItem) => {
		try {
			const resp = await fetch(`/api/file?action=download&pathname=${encodeURIComponent(item.pathname)}`, {
				headers: {
					Authorization: getToken(),
				},
			});
			if (!resp.ok) {
				throw new Error('下载失败');
			}
			const blob = await resp.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = item.name;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.log('下载失败: ', err);
			openTip({
				content: '下载失败',
				color: 'error',
				autoHideDuration: 1500,
			});
		}
	}, []);

	// 重命名文件
	const renameItem = useCallback((item: FileItem) => {
		let newName = item.name;
		const closeDialog = openDialog({
			title: '重命名',
			desc: '请输入新的文件名',
			body: (
				<TextField
					defaultValue={item.name}
					size="small"
					fullWidth
					autoFocus
					onChange={e => {
						newName = e.target.value;
					}}
				/>
			),
			async onClickOk() {
				const target = newName.trim();
				if (!target || target === item.name) {
					closeDialog();
					return;
				}
				if (target.includes('/') || target.includes('\\') || target.includes('..')) {
					openTip({
						content: '文件名不合法',
						color: 'error',
						autoHideDuration: 1500,
					});
					return;
				}
				try {
					const resp = await renameFile(item.pathname, target);
					if (resp.code === 0) {
						openTip({
							content: '重命名成功',
							color: 'success',
							autoHideDuration: 1000,
						});
						getFileListData();
					} else {
						openTip({
							content: resp.message || '重命名失败',
							color: 'error',
							autoHideDuration: 1500,
						});
					}
				} catch (err) {
					console.log('重命名失败: ', err);
					openTip({
						content: '重命名失败',
						color: 'error',
						autoHideDuration: 1500,
					});
				}
				closeDialog();
			},
		})
	}, [getFileListData]);

	// 删除单个文件
	const deleteItem = useCallback((item: FileItem) => {
		const closeDialog = openDialog({
			title: '确认删除',
			desc: `确定删除「${item.name}」吗？删除后不可恢复。`,
			async onClickOk() {
				const resp = await deleteFileList([item.url]);
				if (resp.code === 0) {
					openTip({
						content: '删除成功',
						color: 'success',
						autoHideDuration: 1000,
					});
					getFileListData();
				} else {
					openTip({
						content: resp.message || '删除失败',
						color: 'error',
						autoHideDuration: 1000,
					});
				}
				closeDialog();
			},
		})
	}, [getFileListData]);

	// 删除全部文件
	const deleteAll = useCallback(() => {
		const closeDialog = openDialog({
			title: '确认删除',
			desc: '确认删除全部文件？删除后，将无法恢复所有文件。',
			async onClickOk() {
				const resp = await deleteAllFileList().catch(() => {
					return null;
				});
				if (resp && resp.code === 0) {
					openTip({
						content: '成功清空所有文件了哦～',
						color: 'success',
						autoHideDuration: 1000,
					})
					updateList([]);
				} else {
					openTip({
						content: '删除失败了哦～',
						color: 'error',
						autoHideDuration: 1000,
					})
				}
				closeDialog();
			},
		})
	}, [])

	return (
		<CustomThemeProvider>
			<CssBaseline />
			<Header title="文件" leftIcon={<FolderOpenIcon />} />
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
							文件
						</Typography>
						<Typography variant="h5" align="center" color="text.secondary" sx={{ mb: 2 }}>
							使用 Vercel Blob 存储文件，随时随地取用（单文件最大 100MB）
						</Typography>
					</Container>
				</Box>

				{
					isUploading ? (
						<Container sx={{
							py: 1,
							position: 'sticky',
							top: 64,
							bgcolor: 'background.default',
							zIndex: 1,
						}}>
							<Box sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1,
							}}>
								<Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
									{uploadingList[0].name}
								</Typography>
								<LinearProgress
									variant="determinate"
									value={uploadingList[0].progress}
									sx={{ flex: 1 }}
								/>
								<Typography variant="body2">
									{uploadingList[0].progress}%
								</Typography>
							</Box>
						</Container>
					) : null
				}

				{
					isLoading ? <Loading /> : (
						!list.length ? <Container>
							<Empty text="暂无文件，点击右下角按钮上传" />
						</Container> : null
					)
				}
				{
					!isLoading && !!list.length ? <Container maxWidth="lg" sx={{
						py: 0,
					}}>
						<List dense={true}>
							{
								list.map((item, idx) => (
									<ListItem
										key={item.pathname}
										secondaryAction={
											<Box>
												<IconButton
													edge="end"
													aria-label="下载"
													data-idx={idx}
													onClick={() => download(item)}
												>
													<DownloadIcon />
												</IconButton>
												<IconButton
													edge="end"
													aria-label="重命名"
													data-idx={idx}
													onClick={() => renameItem(item)}
												>
													<DriveFileRenameOutlineIcon />
												</IconButton>
												<IconButton
													edge="end"
													aria-label="删除"
													data-idx={idx}
													onClick={() => deleteItem(item)}
												>
													<DeleteIcon />
												</IconButton>
											</Box>
										}
									>
										<ListItemAvatar>
											<Avatar sx={{
												bgcolor: 'transparent',
												color: 'text.secondary',
											}}>
												{getFileIcon(item)}
											</Avatar>
										</ListItemAvatar>
										<ListItemText
											primary={item.name}
											secondary={`${formatSize(item.size)} · ${formatTime(item.uploadedAt)}`}
											sx={{
												wordBreak: 'break-all',
												pr: 1,
											}}
										/>
									</ListItem>
								))
							}
						</List>
					</Container> : null
				}
				<Container>
					{
						!isLoading && !!list.length
							? <Button fullWidth color='error' variant='outlined' onClick={deleteAll}>删除所有</Button> : null
					}
				</Container>
				<Container sx={{
					height: 32,
				}} />
			</main>

			<Fab
				component="label"
				color="primary"
				aria-label="上传文件"
				disabled={isLoading || isUploading || !uid}
				sx={{
					position: 'fixed',
					right: 24,
					bottom: 24,
					zIndex: 10,
				}}
			>
				<UploadFileIcon />
				<input
					type="file"
					multiple
					hidden
					onChange={handleFileChange}
				/>
			</Fab>

			{
				dialog
			}

			{
				tip
			}

			<BackTop anchor='#toolbar-hidden' threshold={500} />

			<Footer />
		</CustomThemeProvider>
	);
}