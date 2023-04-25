import {
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Toolbar,
} from '@mui/material'

import Header from '../components/Header';
import CustomThemeProvider from '../components/Theme';
import HomeIcon from '@mui/icons-material/Home';

function App() {

	return (
		<CustomThemeProvider>
			<Box sx={{
				flexGrow: 1,
			}}>
				<Header
					title='功能导航'
					leftIcon={<HomeIcon />}
					showHomeIcon={false}
				/>
				<Toolbar />
				<List>
					<ListItem>
						<ListItemButton onClick={() => {
							location.href = '/text/';
						}}>

							<ListItemText primary="剪切板" />

						</ListItemButton>
					</ListItem>
					<ListItem>
						<ListItemButton onClick={() => {
							location.href = '/bookmark/';
						}}>
							<ListItemText primary="书签" />
						</ListItemButton>
					</ListItem>
				</List>
			</Box>
		</CustomThemeProvider>
	)
}

export default App
