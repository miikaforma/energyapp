import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface ContractDeleteProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ContractDelete({ open, onClose, onConfirm }: ContractDeleteProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Vahvista poisto</DialogTitle>
      <DialogContent>
        <Typography>
          Haluatko varmasti poistaa sopimuksen?
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
