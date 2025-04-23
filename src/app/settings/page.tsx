"use client";

import { Box } from "@mui/material";
import {Form, InputNumber, Switch, Slider, Space, Button, type SliderSingleProps, FloatButton, Typography, Input} from "antd";
import { type MutableRefObject, useRef } from "react";
import SimpleSnackbar from "@energyapp/app/_components/snackbar";
import useSettingsForm, {
  type SettingsFormValues,
} from "@energyapp/app/_hooks/forms/useSettingsForm";
import { useSettingsStore } from "@energyapp/app/_stores/settings/settings";
import {SaveOutlined} from "@ant-design/icons";
import { useSession } from "next-auth/react";

const { Text } = Typography;

// const vats = [
//   { label: "0 %", value: 0 },
//   { label: "10 %", value: 10 },
//   { label: "24 %", value: 24 },
//   { label: "25,5 %", value: 25.5 },
// ];

const cKWHSuffix = <span>c/kWh</span>;

export default function Settings() {
  const { status } = useSession();
  const settingsStore = useSettingsStore();
  const { form, validator, initialValues } = useSettingsForm(
    settingsStore.settings,
  );

  const snackBarOpen = useRef<() => void | null>(null);

  const onFinish = (values: SettingsFormValues) => {
    console.log("Received values of form:", values);

    let nightStart = 22
    let nightEnd = 7
    if (values.nightRange?.[0] !== undefined && values.nightRange[1] !== undefined) {
      nightStart = marks[values.nightRange[0]] ?? 22
      nightEnd = marks[values.nightRange[1]] ?? 7
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

  const marks: Record<number, number> = {
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

  const formatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] = (value) =>
    value !== undefined && marks.hasOwnProperty(value)
      ? `klo ${marks[value]?.toString().padStart(2, "0")}`
      : value;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", textAlign: "center" }} justifyContent="center">
      <Form
          form={form}
          style={{
            maxWidth: 600,
          }}
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          layout="horizontal"
          onFinish={onFinish}
          initialValues={initialValues}
      >
        {/* <Form.Item name="vat" label="Arvonlisävero">
            <Select options={vats} value={settings?.vat || 0} />
          </Form.Item> */}
        <Form.Item name="showSpot" hidden>
          <Input type="hidden" />
        </Form.Item>

        <Form.Item
            name="additionalHourInSpotPrices"
            label="Näytä lisätunti spot-hinnoissa"
            help={
              "Näytä seuraavan vuorokauden ensimmäinen tunti spot-hinnoissa. Oletuksena tämä on päällä."
            }
            rules={[validator]}
        >
          <Switch />
        </Form.Item>
        
        <Form.Item
            name="margin"
            label="Marginaali"
            help={
              "Marginaali vaihtelee sähköyhtiöiden ja -sopimusten mukaan. Esimerkiksi Oomilla se on 0,59 snt / kWh."
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
            help={
              <Space.Compact direction="vertical">
                <Text type="secondary">2,79372 c/kWh (sis. alv. 24 % ja huoltovarmuusmaksun)</Text>
                <Text type="secondary">01.09.2024 alkaen 25,5 % ALV</Text>
                <Text type="secondary">2,827515 c/kWh (sis. alv. 25,5 % ja huoltovarmuusmaksun)</Text>
              </Space.Compact>
            }
            rules={[validator]}
        >
          <Switch />
        </Form.Item>
        {status === "authenticated" && (
          <>
            <Form.Item
                name="showConsumptionEffects"
                label="Näytä kulutusvaikutukset"
                rules={[validator]}
            >
              <Switch />
            </Form.Item>
            
          <Form.Item
              name="addMarginToShowSpot"
              label="Lisää marginaali fixed/hybrid spot laskuihin"
              rules={[validator]}
          >
            <Switch />
          </Form.Item>
          </>
        )}
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
    </Box>
  );
}
