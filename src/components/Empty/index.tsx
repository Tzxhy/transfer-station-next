import { Box, Typography } from '@mui/material';

export default function Empty(props: {text?: string}) {
    return <Box>
        <Typography variant='body1' sx={{
        textAlign: 'center',
    }}>{
            props.text || '暂无数据'
        }</Typography>
    </Box>
}