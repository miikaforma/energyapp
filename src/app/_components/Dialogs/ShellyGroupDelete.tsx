import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface ShellyGroupDeleteProps {
  open: boolean;
  groupName: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ShellyGroupDelete({ open, groupName, onClose, onConfirm }: ShellyGroupDeleteProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Vahvista poisto</DialogTitle>
      <DialogContent>
        <Typography>
          Haluatko varmasti poistaa ryhmän <b>{groupName}</b>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Peruuta
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Poista
        </Button>
      </DialogActions>
    </Dialog>
  );
}
