import { memo } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Container } from '@mui/material';
import './index.module.scss'

export default memo(function Loading() {

	return <Container sx={{
		py: 5,
		display: 'flex',
		justifyContent: 'center',
	}}>
		<RefreshIcon className='loading' sx={{
			fontSize: 60,
		}}/>
	</Container>
})