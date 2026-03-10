import React from "react";
import useUploadRuuviImage from "@energyapp/app/_hooks/mutations/useUploadRuuviImage";

interface RuuviImageUploadProps {
  deviceId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const RuuviImageUpload: React.FC<RuuviImageUploadProps> = ({ deviceId, inputRef }) => {
  const { mutate, isLoading } = useUploadRuuviImage();

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      mutate({ deviceId, image: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <input
      ref={inputRef}
      id="ruuvi-image-upload-input"
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={handleFileInput}
    />
  );
};

export default RuuviImageUpload;
