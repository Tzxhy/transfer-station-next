import {
	Box,
	TextField,
	IconButton,
	Autocomplete,
} from '@mui/material';
import { useEffect, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { ClipBoard } from '../../api';

export default function Edit(props: {
	onChange: (v: ClipBoard[]) => void;
	useClipboardDataOnMount?: boolean;
	allNotes: string[];
}) {
	const [note, setNote] = useState('')
	const [newString, setNewString] = useState([''] as string[])
	useEffect(() => {
		if (props.useClipboardDataOnMount) {
			(async function() {
				const text = await navigator.clipboard.readText().catch(() => '');
				setNewString([text]);
			})();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		props.onChange(newString.map(i => ({
			content: i,
			type: 'text',
			note: note,
			created_at: '',
			id: '',
		})));
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [newString, note]);

	return <Box>
		<Autocomplete
			freeSolo
			options={props.allNotes}
			inputValue={note}
			onInputChange={(event, newInputValue) => {
				setNote(newInputValue || '');
			}}
			renderInput={(params) => (
				<TextField
					{...params}
					margin="dense"
					label="备注"
					fullWidth
					variant="standard"
					InputProps={{
						...params.InputProps,
					}}
				/>
			)}
		/>
		{
			newString.map((string, index) => (<TextField
				key={'idx: ' + index}
				autoFocus
				margin="dense"
				label={"数据" + (index + 1)}
				fullWidth
				variant="standard"
				value={newString[index]}
				multiline
				maxRows={2}
				onChange={e => {
					const newStringArr = [
						...newString.slice(0, index),
						e.target.value,
						...newString.slice(index + 1),
					];
					setNewString(newStringArr)
				}}
			/>))
		}
		<IconButton onClick={() => {
			setNewString([
				...newString,
				'',
			]);
		}}>
			<AddIcon />
		</IconButton>
		<IconButton onClick={() => {
			setNewString([
				...newString.slice(0, -1),
			]);
		}}>
			<RemoveIcon />
		</IconButton>
	</Box>
}