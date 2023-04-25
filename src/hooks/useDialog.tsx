import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useStateRef from './useStateRef';

type ShowDialogConf = {
	title?: React.ReactNode;
	desc?: React.ReactNode;
	body?: React.ReactNode;
	onClickOk?: () => void;
}
export default function useDialog() {

	const [open, setOpen] = useState(false);

	const handleClose = () => {
		setOpen(false);
	}

	const [staticConf, setStaticConf] = useState<ShowDialogConf>({
		title: '提示',
		desc: null,
		body: undefined,
	});
	const onClickRef = useRef(staticConf.onClickOk);
	onClickRef.current = staticConf.onClickOk;
	const handleOk = useCallback(() => {
		onClickRef.current?.();
	}, []);

	const [lastUpdateDialog, setLastUpdateDialog, lastUpdateDialogRef] = useStateRef(1);

	useEffect(() => {
		if (!open) {
			setTimeout(() => {
				setLastUpdateDialog(i => i + 1)
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])
	

	const dialog = useMemo(() => (<Dialog open={open} onClose={handleClose} maxWidth="xs">
		{
			staticConf.title ? <DialogTitle>{staticConf.title}</DialogTitle> : null
		}
		<DialogContent key={lastUpdateDialogRef.current}>
			{
				staticConf.desc ? <DialogContentText>
					{
						staticConf.desc
					}
				</DialogContentText> : null
			}
			{
				staticConf.body
			}
		</DialogContent>
		<DialogActions>
			<Button onClick={handleClose}>取消</Button>
			<Button onClick={handleOk}>确定</Button>
		</DialogActions>
	</Dialog>), 
	// eslint-disable-next-line react-hooks/exhaustive-deps
	[
		staticConf,
		open,
	]);

	const openDialog = (conf: ShowDialogConf) => {
		setStaticConf(conf);
		setOpen(true);
		return handleClose;
	}

	return {
		dialog,
		openDialog,
	}
}