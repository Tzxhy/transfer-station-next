import { Box, IconButton, Slide, useScrollTrigger, NoSsr} from '@mui/material';
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
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		props.anchor,
		props.target,
	])

	return (
		<div style={{position: 'absolute', zIndex: 1,}}>
			<NoSsr>
				<Slide key={1} in={isTriggered} direction='left'>
					<div>123</div>
				</Slide>
				{
					props.whenHiddenNode ? <Slide key={2} in={!isTriggered} direction='left'>
						<Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>{
							props.whenHiddenNode
						}</Box>
					</Slide> : null
				}
			</NoSsr>
			
		</div>
	)
})
