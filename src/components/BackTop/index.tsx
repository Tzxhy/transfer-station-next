import { Box, IconButton, Slide, useScrollTrigger } from '@mui/material';
import { memo, useCallback } from 'react';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';


export default memo(function BackTop(props: {
	/** 目标 */
	target?: () => HTMLElement;
	/** 阈值 */
	threshold?: number;
	anchor?: string;
	whenHiddenNode?: React.ReactNode;
}) {
	const target = props.target?.() || (typeof window !== 'undefined' ? window : null) || global.window;
	const isTriggered = useScrollTrigger({
		target,
		threshold: props.threshold,
	});

	const click = useCallback(() => {
		if (props.anchor) {
			document.querySelector(props.anchor)!.scrollIntoView();
		} else if (props.target) {
			props.target()!.scrollTop = 0;			
		}
	}, [
		props.anchor,
		props.target,
	])

	return (
		<div style={{position: 'absolute', zIndex: 1,}}>
			<Slide key={1} in={isTriggered} direction='left'>
				<IconButton color='primary' onClick={click} sx={{
					position: 'fixed',
					border: 1,
					borderColor: 'divider',
					bottom: 16,
					right: 16,
					bgcolor: 'background.default',
				}}>
					<ArrowUpwardRoundedIcon fontSize='large' />
				</IconButton>
			</Slide>
			{
				props.whenHiddenNode ? <Slide key={2} in={!isTriggered} direction='left'>
					<Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>{
						props.whenHiddenNode
					}</Box>
				</Slide> : null
			}
		</div>
	)
})
