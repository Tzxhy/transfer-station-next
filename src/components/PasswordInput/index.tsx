import { VisibilityOff, Visibility } from '@mui/icons-material';
import { FormControl, IconButton, Input, InputAdornment, InputLabel, OutlinedInput } from '@mui/material';
import { useState } from 'react';

type PasswordInputProps = {
	label: string;
	value: string;
	handleChange: React.ChangeEventHandler<HTMLInputElement>;
}
let idx = 0;
export default function PasswordInput(props: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [index] = useState(++idx);
    const handleClickShowPassword = () => {
        setShowPassword(i => !i)
    }
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    }
    return <FormControl variant="outlined" sx={{
        width: '100%',
    }}>
        <InputLabel size='small' htmlFor={"outlined-adornment-password-" + index}>{props.label}</InputLabel>
        <OutlinedInput
            id={'outlined-adornment-password-' + index}
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={props.value}
            label={props.label}
            size='small'
            onChange={props.handleChange}
            endAdornment={
                <InputAdornment position="end">
                    <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                    >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
            }
        />
    </FormControl>
	
}