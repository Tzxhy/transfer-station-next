
import {
    Container,
    List,
    ListItem,
    IconButton,
    Button,
    ListItemText
} from '@mui/material';
import { memo, useCallback } from 'react';
import { ClipBoard } from '../../api';
import DeleteIcon from '@mui/icons-material/Delete';


type ListInnerProps = {
	list: ClipBoard[];
	onDeleteItem: (item: ClipBoard) => void;
	onClickItem: (item: ClipBoard) => void;
}
export default memo(function ListInner(props: ListInnerProps) {

    const onClickDelete = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const target = e.currentTarget as HTMLElement;
        const idx = Number(target.dataset.idx);
        props.onDeleteItem(props.list[idx]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        props.onDeleteItem,
        props.list,
    ]);

    const onClickItem = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        const target = e.currentTarget as HTMLElement;
        const idx = Number(target.dataset.idx);
        props.onClickItem(props.list[idx]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        props.onClickItem,
        props.list,
    ]);

    return <Container sx={{
        width: '100%',
        py: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    }} maxWidth="lg">
        <List sx={{
            width: '100%',
        }} dense={true}>
            {
                props.list.map((i, idx) => (
                    <ListItem
                        key={i._id}
                        secondaryAction={
                            <IconButton edge="end" aria-label="delete" data-idx={idx} onClick={onClickDelete}>
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        {
                            i.type === 'text' ? <Button fullWidth sx={{
                                textAlign: 'left',
                            }} data-idx={idx} onClick={onClickItem}>
                                <ListItemText
                                    primary={i.content}
                                    secondary={i.note}
                                    sx={{
                                        wordBreak: 'break-word',
                                    }}
                                />
                            </Button> : null
                        }
                    </ListItem>)
                )
            }
        </List>
    </Container>
})
