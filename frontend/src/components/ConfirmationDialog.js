import * as React from 'react';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import EditIcon from '@mui/icons-material/Edit';
import {IconButton} from "@mui/material";

const instrumentTypes = [
    'Drums',
    'Piano',
    'Acoustic bass',
    'Electric bass',
    'Trumpet',
    'Saxophone',
    'Trombone',
    'Guitar'
];

const genreTypes = [
    'Jazz',
    'Classical',
    'Rock',
    'Punk',
    'Hip-Hop',
    'Alternative',
    'Pop'
];

function ConfirmationDialogRaw(props) {
    const { onClose, open, type, elements, ...other } = props;
    const [selected, setSelected] = React.useState(elements);
    const radioGroupRef = React.useRef(null);
    let types;

    if (type === "instrument") {
        types = instrumentTypes;
    } else {
        types = genreTypes;
    }

    React.useEffect(() => {
        setSelected(elements);
    }, [open]);

    const handleEntering = () => {
        if (radioGroupRef.current != null) {
            radioGroupRef.current.focus();
        }
    };

    const handleCancel = () => {
        onClose();
    };

    const handleOk = () => {
        onClose(selected);
    };

    const handleChange = (name) => {
        if (selected.includes(name)) {
            setSelected(selected.filter(val => val !== name));
        } else {
            setSelected([...selected, name]);
        }
    };

    return (
        <Dialog
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435} }}
            maxWidth="xs"
            TransitionProps={{ onEntering: handleEntering }}
            open={open}
            {...other}
        >
            <DialogTitle>Select {type === 'instrument' ? "Instruments" : "Genres"}</DialogTitle>
            <DialogContent dividers>
                {types.map((name) => (
                    <MenuItem key={name} value={name} id={name} onClick={() => { handleChange(name) }}>
                        <Checkbox checked={selected ? selected.indexOf(name) > -1 : false} />
                        <ListItemText primary={name} />
                    </MenuItem>
                ))}
            </DialogContent>
            <DialogActions>
                <Button autoFocus onClick={handleCancel}>
                    Cancel
                </Button>
                <Button onClick={handleOk}
                        id={type + '-confirm-button'}
                >
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default function ConfirmationDialog({elements, update, type, refresh}) {
    const [open, setOpen] = React.useState(false);

    const handleClickListItem = () => {
        setOpen(true);
    };

    const handleClose = (newValue) => {
        setOpen(false);

        if (newValue) {
            update(newValue);
            refresh((curr) => !curr);
        }
    };

    return (
            <List component="div" role="group">
                <IconButton onClick={handleClickListItem}
                            id={type + '-edit-button'}
                >
                    <EditIcon />
                </IconButton>
                <ConfirmationDialogRaw
                    id="ringtone-menu"
                    keepMounted
                    open={open}
                    onClose={handleClose}
                    elements={elements}
                    type={type}
                />
            </List>
    );
}
