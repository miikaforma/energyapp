import { CardMedia, Box } from "@mui/material";

interface DeviceImageProps {
  imageUrl: string | null;
  alt: string;
}

export default function DeviceImage({ imageUrl, alt }: DeviceImageProps) {
  if (imageUrl) {
    return (
      <CardMedia
        component="img"
        sx={{ width: "25%" }}
        image={imageUrl}
        alt={alt}
        onError={(e) => {
          // If image fails to load, hide it
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: "25%",
        background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    />
  );
}
