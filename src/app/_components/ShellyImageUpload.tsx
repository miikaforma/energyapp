import React from "react";
import useUploadShellyImage from "../_hooks/mutations/useUploadShellyImage";
import { ShellyViewType } from "@energyapp/shared/enums";

interface ShellyImageUploadProps {
  deviceId: string;
  viewType: ShellyViewType;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const ShellyImageUpload: React.FC<ShellyImageUploadProps> = ({ deviceId, viewType, inputRef }) => {
  const { mutate, isLoading } = useUploadShellyImage();

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      mutate({ accessKey: deviceId, viewType, image: base64 });
    };
    reader.readAsDataURL(file);
  };

  return (
    <input
      ref={inputRef}
      id="shelly-image-upload-input"
      type="file"
      accept="image/*"
      style={{ display: "none" }}
      onChange={handleFileInput}
    />
  );
};

export default ShellyImageUpload;
