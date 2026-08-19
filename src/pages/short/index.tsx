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
    List,
    ListItem,
    ListItemText,
    IconButton,
    Paper,
    Divider,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';

import {
    createShortLink,
    deleteShortLink,
    getShortLinkList,
} from '../../api';
import type { ShortLinkItem } from '../../api';

import CustomThemeProvider from '../../components/Theme';
import useCheckLogin from '../../hooks/useCheckLogin';
import useDialog from '../../hooks/useDialog';
import useTip from '../../hooks/useTip';
import Empty from '../../components/Empty';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

const CUSTOM_PATH_REGEX = /^[A-Za-z0-9_-]+$/;

const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text);
    }
    // 兼容非安全上下文
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
};

export default function ShortLinkPage() {
    useCheckLogin();

    const [note, setNote] = useState('');
    const [url, setUrl] = useState('');
    const [customPath, setCustomPath] = useState('');
    const [generated, setGenerated] = useState('');
    const [list, setList] = useState<ShortLinkItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const {
        dialog,
        openDialog,
    } = useDialog();

    const {
        tip,
        openTip,
    } = useTip();

    const getData = useCallback(async () => {
        const data = await getShortLinkList();
        setList(data.data.list);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        getData();
    }, [
        getData,
    ]);

    const submit = useCallback(async () => {
        if (!url.trim()) {
            openTip({ content: '请输入链接', color: 'warning' });
            return;
        }
        let parsed: URL;
        try {
            parsed = new URL(url.trim());
        } catch (e) {
            openTip({ content: '链接格式不正确', color: 'warning' });
            return;
        }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            openTip({ content: '仅支持 http/https 链接', color: 'warning' });
            return;
        }
        const custom = customPath.trim();
        if (custom && (!CUSTOM_PATH_REGEX.test(custom) || custom.length > 32)) {
            openTip({ content: '自定义后缀仅支持 32 位以内的英文字母、数字、- 和 _', color: 'warning' });
            return;
        }
        const data = await createShortLink({
            note: note.trim(),
            url: url.trim(),
            customPath: custom,
        });
        if (data.code === 0) {
            setGenerated(data.data.shortUrl);
            openTip({ content: '短链生成成功', color: 'success' });
            getData();
        } else {
            openTip({ content: data.message || '生成失败，请稍后再试', color: 'error' });
        }
    }, [
        note,
        url,
        customPath,
        getData,
    ]);

    const copyShortUrl = useCallback(async (shortUrl: string) => {
        await copyText(shortUrl);
        openTip({ content: '已复制', color: 'success' });
    }, []);

    const removeItem = useCallback((item: ShortLinkItem) => {
        const closeDialog = openDialog({
            title: '删除短链',
            desc: `确认删除短链 /s/${item.path}？删除后该链接将无法访问。`,
            async onClickOk() {
                const data = await deleteShortLink([item._id]);
                if (data.code === 0) {
                    openTip({ content: '删除成功', color: 'success' });
                    getData();
                } else {
                    openTip({ content: '删除失败，请稍后再试', color: 'error' });
                }
                closeDialog();
            },
        });
    }, [
        getData,
    ]);

    return (
        <CustomThemeProvider>
            <CssBaseline />
            <Header title="短链" leftIcon={<LinkIcon />} />
            <Toolbar id='toolbar-hidden' />
            <main>
                <Box sx={{
                    bgcolor: 'background.paper',
                    pt: 6,
                    pb: 2,
                }}>
                    <Container maxWidth="sm">
                        <Typography
                            component="h1"
                            variant="h4"
                            align="center"
                            color="text.primary"
                            gutterBottom
                        >
                            短链
                        </Typography>
                        <Typography variant="h6" align="center" color="text.secondary">
                            将长链接转换为简洁的短链接，便于分享
                        </Typography>
                    </Container>
                </Box>

                <Container maxWidth="sm">
                    <Paper variant="outlined" sx={{
                        p: 2,
                        mt: 3,
                    }}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                        }}>
                            <TextField
                                fullWidth size='small' label="链接" variant="outlined"
                                placeholder="https://example.com/very/long/path"
                                value={url} onChange={e => setUrl(e.target.value)}
                            />
                            <TextField
                                fullWidth size='small' label="短链备注（可选）" variant="outlined"
                                value={note} onChange={e => setNote(e.target.value)}
                            />
                            <TextField
                                fullWidth size='small' label="自定义短链后缀（可选）" variant="outlined"
                                placeholder="6 位以内英文字母和数字（自动生成时留空）"
                                value={customPath} onChange={e => setCustomPath(e.target.value)}
                            />
                            <Button
                                fullWidth size='large' variant="contained"
                                onClick={submit}
                            >
                                生成短链
                            </Button>
                        </Box>
                    </Paper>
                    {
                        generated ? <Paper variant="outlined" sx={{
                            p: 2,
                            mt: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}>
                            <Typography variant="body1" sx={{
                                flexGrow: 1,
                                wordBreak: 'break-all',
                            }}>
                                <Link href={generated} target="_blank" rel="noreferrer">
                                    {generated}
                                </Link>
                            </Typography>
                            <IconButton size="small" onClick={() => copyShortUrl(generated)}>
                                <ContentCopyIcon />
                            </IconButton>
                        </Paper> : null
                    }

                    <Typography variant="h6" sx={{
                        mt: 4,
                        mb: 1,
                    }}>
                        我的短链
                    </Typography>
                    {
                        isLoading ? null : (
                            !list.length ? <Container sx={{ py: 2 }}>
                                <Empty text="暂无短链" />
                            </Container> : null
                        )
                    }
                    <List>
                        {
                            list.map((item, idx) => (
                                <Box key={item._id}>
                                    {
                                        idx > 0 ? <Divider component="li" /> : null
                                    }
                                    <ListItem
                                        secondaryAction={
                                            <>
                                                <IconButton size="small" onClick={() => copyShortUrl(`${window.location.origin}/s/${item.path}`)}>
                                                    <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => removeItem(item)}>
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                <Link href={`/s/${item.path}`} target="_blank" rel="noreferrer">
                                                    /s/{item.path}
                                                </Link>
                                            }
                                            secondary={`${item.note || item.url} · 访问 ${item.hits} 次 · ${new Date(item.created_at).toLocaleString()}`}
                                        />
                                    </ListItem>
                                </Box>
                            ))
                        }
                    </List>
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

            <Footer />
        </CustomThemeProvider>
    );
}