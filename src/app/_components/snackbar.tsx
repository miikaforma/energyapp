'use client';

import {Fragment, useState, useEffect, type ReactNode, type MutableRefObject} from 'react'
import {Alert, Button, IconButton, Snackbar} from "@mui/material"
import CloseIcon from '@mui/icons-material/Close'

interface SimpleSnackbarProps {
    children: ReactNode;
    clickHandler?: MutableRefObject<() => void> | null;
}

export default function SimpleSnackbar({children, clickHandler}: SimpleSnackbarProps) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (clickHandler) {
            clickHandler.current = handleClick
        }
    }, [])

    const handleClick = () => {
        setOpen(true);
    }

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpen(false);
    }

    const action = (
        <Fragment>
            <Button color="secondary" size="small" onClick={handleClose}>
                UNDO
            </Button>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleClose}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </Fragment>
    );

    return (
        <div>
            <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                    {children}
                </Alert>
            </Snackbar>
        </div>
    );
}