"use client";

import { redirect, useParams } from "next/navigation";
import { TimePeriod } from "@energyapp/shared/enums";

export default function RuuviDevice() {
  const params = useParams();
  const deviceId = params.deviceId;

  redirect(
    `/statistics/ruuvi/${deviceId?.toString()}/${TimePeriod.PT15M}`,
  );
}
