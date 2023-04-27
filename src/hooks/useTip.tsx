import { Snackbar, AlertColor, Alert as MuiAlert, AlertProps, SnackbarCloseReason } from '@mui/material';
import React from 'react';
import { useMemo, useState } from 'react';
import useStateRef from './useStateRef';

type OpenTipConf = {
	color?: AlertColor;
	content?: React.ReactNode;
	autoHideDuration?: number;
	onClose?: () => void;
	clickOtherToClose?: boolean;
}
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
export default function useTip(conf?: OpenTipConf) {
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [snackbarConf, setSnackbarConf, snackbarConfRef] = useStateRef<OpenTipConf>({
        color: 'success',
        content: null,
        autoHideDuration: 3000,
        ...conf,
    })

    const triggerClose = () => {
        setSnackbarOpen(false)
    }

    // 只会处理由于 reason 造成的关闭：超时；点击其他地方；Esc按键
    const handleSnackbarClose = (e: React.SyntheticEvent | Event, reason: SnackbarCloseReason) => {
        if (reason === 'clickaway' && snackbarConf.clickOtherToClose === false) { // 点击屏幕其他地方
            return;
        }
        setSnackbarOpen(false);
        snackbarConf.onClose?.();
    }

    const tip = useMemo(() => <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarConf.autoHideDuration}
        onClose={handleSnackbarClose}
    >
        <Alert severity={snackbarConf.color} sx={{
            width: '100%',
            alignItems: 'center',
            '& .MuiAlert-message': {
                width: '100%',
            },
        }}>
            {
                snackbarConf.content
            }
        </Alert>
    </Snackbar>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        snackbarOpen,
        snackbarConf,
    ]);

    const openTip = (conf: OpenTipConf) => {
        setSnackbarConf({
            ...snackbarConfRef.current,
            ...conf,
        });
        setSnackbarOpen(true);
        return triggerClose;
    }

    return {
        tip,
        openTip,
    }
}