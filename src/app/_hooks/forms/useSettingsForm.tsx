import { useValidation } from "@energyapp/app/_hooks/forms/useValidation";
import { type ISettings } from "@energyapp/shared/interfaces";
import { Form } from "antd";
import { useEffect, useMemo } from "react";
import { z } from "zod";

const getSettingsFormValidator = () => {
  return z.object({
    margin: z.number().min(0).max(20).default(0.59),
    transferDay: z.number().min(0).max(20).default(2.95),
    transferNight: z.number().min(0).max(20).default(1.5),
    addElectricityTax: z.boolean().default(true),
    nightTransfer: z.boolean().default(false),
    // nightStart: z.number().default(22),
    // nightEnd: z.number().default(7),
    nightRange: z.array(z.number()).length(2).default([1, 10]),
  });
};

const validator = getSettingsFormValidator();
export type SettingsFormValues = z.infer<typeof validator>;

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

const marks = {
  0: 21,
  1: 22,
  2: 23,
  3: 0,
  4: 1,
  5: 2,
  6: 3,
  7: 4,
  8: 5,
  9: 6,
  10: 7,
  11: 8,
  12: 9,
};

export default function useSettingsForm(settings: ISettings) {
  const validator = useValidation(getSettingsFormValidator());
  const [form] = Form.useForm<SettingsFormValues>();

  const initialValues = useMemo(() => {
    const {
      margin,
      transferDay,
      transferNight,
      addElectricityTax,
      nightTransfer,
      nightStart,
      nightEnd,
    } = settings ?? {};
    return {
      margin: margin || 0.0,
      transferDay: transferDay || 0.0,
      transferNight: transferNight || 0.0,
      addElectricityTax: addElectricityTax || false,
      nightTransfer: nightTransfer || false,
      nightRange: [
        nightStart >= 0 ? getKeyByValue(marks, nightStart) : 1,
        nightEnd >= 0 ? getKeyByValue(marks, nightEnd) : 10,
      ],
    };
  }, [settings]);

  useEffect(() => {
    form.resetFields();
  }, [form, initialValues]);

  return { form, validator, initialValues };
}
