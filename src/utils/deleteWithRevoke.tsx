import { Container, Typography, Button } from '@mui/material';

export default function deleteWithRevoke(
	preExec: () => void,
	deleteFunc: () => void,
	openTip: (conf: any) => () => void,
	title: string,
) {

	const DELAY_TO_CONFIRM_TIMEOUT = 3000;
	const revoke = () => {
		closeTip();
	};
	preExec()
	
	const closeTip = openTip({
		clickOtherToClose: false,
		onClose: () => {
			// 超时或者按Esc或者手动点击alert的关闭
			deleteFunc();
		},
		content: <Container sx={{
			width: '100%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
		}}>
			<Typography variant='body1' sx={{
				flexGrow: 1,
			}}>即将删除{title}！</Typography>
			<Button onClick={revoke} variant='contained' color='warning'>撤销</Button>
		</Container>,
		autoHideDuration: DELAY_TO_CONFIRM_TIMEOUT - 100,
		color: 'info',
	})
}