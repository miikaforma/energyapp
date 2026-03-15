import { api } from "@energyapp/trpc/react";
import { TRPCClientError } from "@trpc/client";
import toast from "react-hot-toast";

const useUploadShellyImage = () => {
  const utils = api.useUtils();

  return api.shelly.uploadImage.useMutation({
    onSuccess: (data) => {
      if (data?.imageUrl) {
        toast.success("Kuva ladattu!");
      }

      void utils.shelly.getDevicesWithInfo.invalidate();
      void utils.shelly.getGroups.invalidate();
    },
    onError: (err: unknown) => {
      if (err instanceof TRPCClientError) {
        toast.error("Kuvan lataus epäonnistui. Yritä uudelleen.");
      }
    },
  });
};

export default useUploadShellyImage;
