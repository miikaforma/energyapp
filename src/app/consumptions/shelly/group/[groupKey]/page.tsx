'use client'

import { redirect, useParams } from "next/navigation";
import { TimePeriod } from "@energyapp/shared/enums";

export default function ShellyGroup() {
  const params = useParams();
  const groupKey = params.groupKey;

  redirect(`/consumptions/shelly/group/${groupKey?.toString()}/${TimePeriod.PT1H}`);
}
