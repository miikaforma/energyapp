import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUploadRuuviImage = () => {
  const utils = api.useUtils();

  return api.ruuvi.uploadImage.useMutation({
    onSuccess: (data) => {
      if (data?.imageUrl) {
        toast.success("Kuva ladattu!");
      }
      // Optionally invalidate device details
      void utils.ruuvi.getDevicesWithInfo.invalidate();
      void utils.ruuvi.getDevice.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Kuvan lataus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useUploadRuuviImage;
