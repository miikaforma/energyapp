"use client";

import { Box } from "@mui/material";
import { Form, InputNumber, Switch, Slider, Space, Button } from "antd";
import { type MutableRefObject, useRef } from "react";
import SimpleSnackbar from "@energyapp/app/_components/snackbar";
import useSettingsForm, {
  type SettingsFormValues,
} from "@energyapp/app/_hooks/forms/useSettingsForm";
import { useSettingsStore } from "@energyapp/app/_stores/settings/settings";

// const vats = [
//   { label: "0 %", value: 0 },
//   { label: "10 %", value: 10 },
//   { label: "24 %", value: 24 },
//   { label: "25,5 %", value: 25.5 },
// ];

const cKWHSuffix = <span>c/kWh</span>;

export default function Settings() {
  const settingsStore = useSettingsStore();
  const { form, validator, initialValues } = useSettingsForm(
    settingsStore.settings,
  );

  console.log(settingsStore.settings);

  const snackBarOpen = useRef<() => void | null>(null);

  const onFinish = (values: SettingsFormValues) => {
    console.log("Received values of form:", values);

    // let settings = { ...values };
    // settings.nightStart = parseInt(marks[values.nightRange[0]]);
    // settings.nightEnd = parseInt(marks[values.nightRange[1]]);
    // delete settings.nightRange;
    let nightStart = 22
    let nightEnd = 7
    if (values.nightRange?.[0] !== undefined && values.nightRange[1] !== undefined) {
        nightStart = parseInt(marks[values.nightRange[0]])
        nightEnd = parseInt(marks[values.nightRange[1]])
    }

    settingsStore.setSettings({
        ...values,
        nightStart,
        nightEnd,
    });
    if (snackBarOpen?.current) {
      snackBarOpen.current();
    }
  };

  const nightTransfer = Form.useWatch("nightTransfer", form);

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

  const formatter = (value) =>
    marks.hasOwnProperty(value)
      ? `klo ${marks[value].toString().padStart(2, "0")}`
      : value;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap" }} justifyContent="center">
      <div>
        <Form
          form={form}
          style={{
            maxWidth: 600,
          }}
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          layout="horizontal"
          onFinish={onFinish}
          initialValues={initialValues}
        >
          {/* <Form.Item name="vat" label="Arvonlisävero">
            <Select options={vats} value={settings?.vat || 0} />
          </Form.Item> */}
          <Form.Item
            name="margin"
            label="Marginaali"
            help={
              "Marginaali vaihtelee sähköyhtiöiden ja -sopimusten mukaan, esimerkiksi 0,59 snt / kWh."
            }
            rules={[validator]}
          >
            <InputNumber
              style={{ width: "100%" }}
              decimalSeparator={","}
              precision={2}
              addonAfter={cKWHSuffix}
            />
          </Form.Item>
          <Form.Item
            name="transferDay"
            label="Siirtohinta (päivä)"
            rules={[validator]}
          >
            <InputNumber
              style={{ width: "100%" }}
              decimalSeparator={","}
              precision={2}
              addonAfter={cKWHSuffix}
            />
          </Form.Item>
          <Form.Item name="nightTransfer" label="Yösiirto" rules={[validator]}>
            <Switch />
          </Form.Item>
          <Form.Item
            name="transferNight"
            label="Siirtohinta (yö)"
            hidden={!nightTransfer}
            rules={[validator]}
          >
            <InputNumber
              style={{ width: "100%" }}
              decimalSeparator={","}
              precision={2}
              addonAfter={cKWHSuffix}
            />
          </Form.Item>
          <Form.Item
            style={{ paddingBottom: 30 }}
            name="nightRange"
            label="Yösiirron aikaväli"
            hidden={!nightTransfer}
            rules={[validator]}
          >
            <Slider
              range
              step={1}
              min={0}
              max={12}
              tooltip={{
                formatter,
                open: nightTransfer,
                placement: "bottom",
                zIndex: 0,
              }}
              disabled={!nightTransfer}
            />
          </Form.Item>
          <Form.Item
            name="addElectricityTax"
            label="Sähkövero"
            help={"2,79372 c/kWh (sis. alv. 24 % ja huoltovarmuusmaksu)"}
            rules={[validator]}
          >
            <Switch />
          </Form.Item>
          <Space style={{ margin: 8 }}>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Tallenna
              </Button>
            </Form.Item>
          </Space>
        </Form>
        <SimpleSnackbar clickHandler={snackBarOpen as MutableRefObject<() => void | null>}>
            {"Asetukset tallennettu onnistuneesti!"}
        </SimpleSnackbar>
      </div>
    </Box>
  );
}
