
import { Box, Link, Typography } from '@mui/material';
import { memo } from 'react';

function Copyright() {
	return (
		<Typography variant="body2" color="text.secondary" align="center">
			{'Copyright © '}
			<Link color="inherit" href="https://tzxhy.github.io/" target="_blank">
				transfer-station
			</Link>{' '}
			{new Date().getFullYear()}
			{'.'}
		</Typography>
	);
}


export default memo(function Footer() {
	return <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
		<Typography
			variant="subtitle1"
			align="center"
			color="text.secondary"
			component="p"
		>
			简单易用的数据同步工具！
		</Typography>
		<Copyright />
	</Box>
})