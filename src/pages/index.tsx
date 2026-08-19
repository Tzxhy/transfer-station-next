import {
    Box,
    CssBaseline,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Toolbar,
} from '@mui/material'

import Link from 'next/link';

import Header from '../components/Header';
import CustomThemeProvider from '../components/Theme';
import HomeIcon from '@mui/icons-material/Home';
import useCheckLogin from '../hooks/useCheckLogin';

function App() {
    useCheckLogin();

    return (
        <CustomThemeProvider>
            <CssBaseline />
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
                        <Link style={{width: '100%'}} href='/text'>
                            <ListItemButton>

                                <ListItemText primary="剪切板" />

                            </ListItemButton>
                        </Link>
                        
                    </ListItem>
                    <ListItem>
                        <Link style={{width: '100%'}} href='/bookmark'>
                            <ListItemButton>

                                <ListItemText primary="书签" />

                            </ListItemButton>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link style={{width: '100%'}} href='/file'>
                            <ListItemButton>

                                <ListItemText primary="文件" />

                            </ListItemButton>
                        </Link>
                    </ListItem>
                    <ListItem>
                        <Link style={{width: '100%'}} href='/short'>
                            <ListItemButton>

                                <ListItemText primary="短链" />

                            </ListItemButton>
                        </Link>
                    </ListItem>
                </List>
            </Box>
        </CustomThemeProvider>
    )
}

export default App
