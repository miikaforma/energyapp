import { formatMeasurement, isValueDefined, MeasurementType } from "@energyapp/utils/valueHelpers";
import {
  Grid,
  Stack,
  Typography,
} from "@mui/material";

interface MeasurementValueProps {
  value?: number | null;
  label: string;
  measurementType: MeasurementType;
}

export default function MeasurementValue({ value, label, measurementType }: MeasurementValueProps) {
  if (!isValueDefined(value)) {
    return null;
  }

  const formattedMeasurement = formatMeasurement(measurementType, value);

  return (
    <Grid size={1} sx={{ display: 'flex', alignItems: 'center' }}>
      <Stack spacing={0}>
        <Typography
          sx={{ color: "text.secondary", fontSize: "16px", fontWeight: "bold", whiteSpace: 'nowrap' }}
          justifyContent="flex-start"
          alignItems="center"
          display="flex"
          component="div"
        >
          {formattedMeasurement?.value ?? `${value}`} {formattedMeasurement?.unit ?? ""}
        </Typography>
        <Typography
          sx={{ color: "text.secondary", fontSize: "12px" }}
          justifyContent="flex-start"
          alignItems="center"
          display="flex"
          component="div"
        >
          {label}
        </Typography>
      </Stack>
    </Grid>
  );
}
