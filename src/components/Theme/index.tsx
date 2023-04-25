import {
	useMediaQuery,
	createTheme,
	ThemeProvider,
} from '@mui/material';
import {
	PropsWithChildren,
	useEffect,
	useMemo
} from 'react';

// declare module '@mui/material/styles' {
// 	interface Theme {
// 		forceOffline: boolean;
// 	}
// 	// allow configuration using `createTheme`
// 	interface ThemeOptions {
// 		forceOffline?: boolean;
// 	}
// }

export default function CustomThemeProvider(props: PropsWithChildren) {
	const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
	const theme = useMemo(() => createTheme({
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: 'none',
					},
				},
			},
		},
		palette: {
			mode: prefersDarkMode ? 'dark' : 'light',
		},
	}), [prefersDarkMode]);
	useEffect(() => {
		const ele = document.createElement('meta');
		ele.setAttribute('name', 'theme-color');
		ele.setAttribute('content', prefersDarkMode ? '#121212' : '#1976d2');
		document.head.appendChild(ele);

		return () => {
			ele.remove();
		}
	}, [prefersDarkMode]);
	return <ThemeProvider theme={theme}>
		{
			props.children
		}
	</ThemeProvider>
}