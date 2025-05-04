"use client";

import { redirect, useParams } from "next/navigation";
import { TimePeriod } from "@energyapp/shared/enums";

export default function ShellyDevice() {
  const params = useParams();
  const deviceId = params.deviceId;

  redirect(
    `/consumptions/shelly/device/${deviceId?.toString()}/${TimePeriod.PT1H}`,
  );
}
