import { db } from "@energyapp/server/db";
import { info, warn } from "console";
import dayjs from "dayjs";
import { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { type IEnergyCostReport } from "@energyapp/shared/interfaces";
import {
  type melcloud_daily_energy_consumption,
  type melcloud_hourly_energy_consumption,
} from "@prisma/client";

dayjs.extend(utc);
dayjs.extend(timezone);

const API_URL = "https://app.melcloud.com/Mitsubishi.Wifi.Client";
const CUSTOM_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
const APP_VERSION = "1.31.0.0";

export async function getAccessTokenByDeviceId(deviceId: string) {
  const access = await db.serviceAccess.findUnique({
    where: {
      accessId: deviceId,
      type: "MELCLOUD",
    },
  });

  if (!access) {
    throw new Error("No service access found");
  }

  if (!access.email || !access.password) {
    throw new Error(`Service access doesn't have email or password`);
  }

  const accessToken = await getAccessToken(access.email, access.password);
  return accessToken;
}

export async function getDevices(accessToken: string) {
  info(`Fetching devices`);
  const response = await fetch(`${API_URL}/Device/Get`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": CUSTOM_USER_AGENT,
      "X-MitsContextKey": accessToken,
    },
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  return data;
}

export async function getEnergyReport(
  deviceId: string,
  fromDate: Dayjs,
  toDate: Dayjs,
) {
  const startTime = dayjs(fromDate)
    .tz("Europe/Helsinki")
    .hour(0)
    .minute(0)
    .second(0)
    .millisecond(0);
  let endTime = dayjs(toDate)
    .tz("Europe/Helsinki")
    .hour(23)
    .minute(59)
    .second(59)
    .millisecond(999);

  const now = dayjs().tz("Europe/Helsinki");
  if (endTime.isAfter(now)) {
    endTime = now;
  }

  info(
    `Retrieving energy report for ${deviceId} from ${startTime.format(
      "YYYY-MM-DDTHH:mm:ss",
    )} to ${endTime.format("YYYY-MM-DDTHH:mm:ss")}`,
  );

  const access = await db.serviceAccess.findUnique({
    where: {
      accessId: deviceId,
      type: "MELCLOUD",
    },
  });

  // Which LabelType to use?
  const differenceInHours = endTime.diff(startTime, "hour");
  const differenceInDays = endTime.diff(startTime, "day");
  const differenceInMonths = endTime.diff(startTime, "month");

  info(`Difference in hours: ${differenceInHours}`);
  info(`Difference in days: ${differenceInDays}`);
  info(`Difference in months: ${differenceInMonths}`);

  // 0: Hourly
  if (differenceInHours < 48) {
    info(
      "The time difference is less than 48 hours so using LabelType 0 if hourly data is found.",
    );
    const cachedData = await fetchHourlyData(
      Number(deviceId),
      startTime,
      endTime,
    );

    // Check if the cached data is up to date
    info(`Cached data has ${cachedData.length} items.`);
    if (cachedData.length > differenceInHours) {
      let outdated = false;
      for (const dataPoint of cachedData) {
        const time = dayjs(dataPoint.time).tz("Europe/Helsinki");
        const updatedAt = dayjs(dataPoint.updatedAt);

        // If the data point is from a fully completed hour
        if (time.isBefore(now, "hour")) {
          if (time.add(1, "hour").isAfter(updatedAt)) {
            info(
              `Data point ${dayjs(dataPoint.time).toISOString()} is outdated.`,
            );
            outdated = true;
            break;
          }
        }
        // If the data point is from the ongoing hour
        else if (time.isSame(now, "hour")) {
          if (updatedAt.isBefore(now.subtract(30, "minute"))) {
            info(
              `Data point ${dayjs(
                dataPoint.time,
              ).toISOString()} has not been updated in the last 30 minutes.`,
            );
            outdated = true;
            break;
          }
        }
      }

      if (!outdated) {
        return cachedHourlyDataToResponse(cachedData, access?.accessName ?? "");
      }
    }

    if (now.diff(startTime, "day") > 13) {
      info(`Diff in days: ${now.diff(startTime, "day")}`);
      const cachedDailyData = await fetchDailyData(
        Number(deviceId),
        startTime,
        endTime,
      );

      // Check if the cached data is up to date
      const dataPoint = cachedDailyData?.[0];
      if (dataPoint) {
        let outdated = false;
        const time = dayjs(dataPoint.time).tz("Europe/Helsinki");
        const updatedAt = dayjs(dataPoint.updatedAt);

        // If the data point is from a previous day
        if (time.isBefore(now.startOf("day"), "day")) {
          if (time.add(1, "day").isAfter(updatedAt)) {
            // if (updatedAt.isBefore(time.endOf("day"))) {
            info(
              `Data point ${dayjs(dataPoint.time).toISOString()} is outdated.`,
            );
            outdated = true;
          }
        }

        if (!outdated) {
          return cachedDailyDataToResponse(
            cachedData,
            access?.accessName ?? "",
          );
        }
      }
    }
  }
  // 1: Daily
  // else if (differenceInHours < 745) {
  else if (differenceInDays < 32) {
    info(
      "The time difference is less than 32 days so using LabelType 1 if daily data is found.",
    );
    const cachedData = await fetchDailyData(
      Number(deviceId),
      startTime,
      endTime,
    );

    // Check if the cached data is up to date
    info(`Cached data has ${cachedData.length} items.`);
    if (cachedData.length > differenceInDays) {
      let outdated = false;

      for (const dataPoint of cachedData) {
        const time = dayjs(dataPoint.time).tz("Europe/Helsinki");
        const updatedAt = dayjs(dataPoint.updatedAt);

        // If the data point is from a previous day
        if (time.isBefore(now.startOf("day"), "day")) {
          if (time.add(1, "day").isAfter(updatedAt)) {
            // if (updatedAt.isBefore(time.endOf("day"))) {
            info(
              `Data point ${dayjs(dataPoint.time).toISOString()} is outdated.`,
            );
            outdated = true;
            break;
          }
        }
        // If the data point is from the current day
        else if (time.isSame(now, "day")) {
          if (updatedAt.isBefore(now.subtract(30, "minute"))) {
            info(
              `Data point ${dayjs(
                dataPoint.time,
              ).toISOString()} has not been updated in the last 30 minutes.`,
            );
            outdated = true;
            break;
          }
        }
      }

      if (!outdated) {
        return cachedDailyDataToResponse(cachedData, access?.accessName ?? "");
      }
    }
  }
  // 2: Monthly
  // else if (differenceInHours < 8785) {
  else if (differenceInDays < 367) {
    info(
      "The time difference is less than 367 days so using LabelType 2 if monthly data is found.",
    );
    const cachedData = await fetchDailyData(
      Number(deviceId),
      startTime,
      endTime,
    );

    // Check if the cached data is up to date
    info(`Cached data has ${cachedData.length} items.`);
    if (cachedData.length > differenceInMonths) {
      let outdated = false;

      for (const dataPoint of cachedData) {
        const time = dayjs(dataPoint.time).tz("Europe/Helsinki");
        const updatedAt = dayjs(dataPoint.updatedAt);

        // If the data point is from a previous day
        if (time.isBefore(now.startOf("day"), "day")) {
          if (time.add(1, "day").isAfter(updatedAt)) {
            // if (updatedAt.isBefore(time.endOf("day"))) {
            info(
              `Data point ${dayjs(dataPoint.time).toISOString()} is outdated.`,
            );
            outdated = true;
            break;
          }
        }
        // Let's ignore the current day for monthly data
        // // If the data point is from the current day
        // else if (time.isSame(now, "day")) {
        //   if (updatedAt.isBefore(now.subtract(30, "minute"))) {
        //     info(
        //       `Data point ${dayjs(
        //         dataPoint.time,
        //       ).toISOString()} has not been updated in the last 30 minutes.`,
        //     );
        //     outdated = true;
        //     break;
        //   }
        // }
      }

      if (!outdated) {
        return cachedDailyDataToMonthlyResponse(
          cachedData,
          access?.accessName ?? "",
        );
      }
    }
  }
  // 3: Yearly
  else {
    info("Yearly data fetched so skipping cache.");
  }
  
  const data = await fetchDataFromMelCloud(deviceId, fromDate, toDate);
  return data;
  info("No cached data found.");
  return {} as IEnergyCostReport;
}

async function fetchHourlyData(
  deviceId: number,
  fromDate: Dayjs,
  toDate: Dayjs,
): Promise<melcloud_hourly_energy_consumption[]> {
  const startTime = dayjs(fromDate).tz("Europe/Helsinki");
  const endTime = dayjs(toDate).tz("Europe/Helsinki");

  return await db.melcloud_hourly_energy_consumption.findMany({
    where: {
      device_id: deviceId,
      time: {
        gte: startTime.toDate(),
        lte: endTime.toDate(),
      },
    },
  });
}

async function fetchDailyData(
  deviceId: number,
  fromDate: Dayjs,
  toDate: Dayjs,
): Promise<melcloud_daily_energy_consumption[]> {
  const startTime = dayjs(fromDate).tz("Europe/Helsinki");
  const endTime = dayjs(toDate).tz("Europe/Helsinki");

  return await db.melcloud_daily_energy_consumption.findMany({
    where: {
      device_id: deviceId,
      time: {
        gte: startTime.toDate(),
        lte: endTime.toDate(),
      },
    },
  });
}

async function fetchDataFromMelCloud(
  deviceId: string,
  fromDate: Dayjs,
  toDate: Dayjs,
) {
  const startTime = dayjs(fromDate).tz("Europe/Helsinki");
  const endTime = dayjs(toDate).tz("Europe/Helsinki");

  info(
    `Fetching energy report from MELCLOUD for ${deviceId} from ${startTime.format(
      "YYYY-MM-DDTHH:mm:ss",
    )} to ${endTime.format("YYYY-MM-DDTHH:mm:ss")}`,
  );

  const body = JSON.stringify({
    DeviceId: deviceId,
    FromDate: startTime.format("YYYY-MM-DDTHH:mm:ss"),
    ToDate: endTime.format("YYYY-MM-DDTHH:mm:ss"),
    UseCurrency: false,
  });

  const accessToken = await getAccessTokenByDeviceId(deviceId);

  const response = await fetch(`${API_URL}/EnergyCost/Report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": CUSTOM_USER_AGENT,
      "X-MitsContextKey": accessToken ?? "",
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = (await response.json()) as IEnergyCostReport;

  // Save the data to the database
  if (data.LabelType === 0) {
    await saveHourlyDataToDatabase(Number(deviceId), data);
  } else if (data.LabelType === 1) {
    await saveDailyDataToDatabase(Number(deviceId), data);
  } else if (data.LabelType === 4) {
    await saveDailyDataToDatabase(Number(deviceId), data);
  } else {
    warn(`Unsupported label type: ${data.LabelType}`);
  }

  return data;
}

async function saveHourlyDataToDatabase(
  deviceId: number,
  data: IEnergyCostReport,
) {
  const fromDate = dayjs.tz(data.FromDate, "Europe/Helsinki");
  // const toDate = dayjs(data.ToDate).tz("Europe/Helsinki");

  const consumptions = data.Labels.map((label, index) => {
    return {
      time: fromDate.add(index, "hour"),
      heating: data.Heating[index] ?? 0.0,
      cooling: data.Cooling[index] ?? 0.0,
      fan: data.Fan[index] ?? 0.0,
      dry: data.Dry[index] ?? 0.0,
      auto: data.Auto[index] ?? 0.0,
      other: data.Other[index] ?? 0.0,
    };
  });

  for (const consumption of consumptions) {
    await db.melcloud_hourly_energy_consumption.upsert({
      where: {
        time_device_id: {
          time: consumption.time.toDate(),
          device_id: deviceId,
        },
      },
      update: {
        heating: consumption.heating,
        cooling: consumption.cooling,
        auto: consumption.auto,
        dry: consumption.dry,
        fan: consumption.fan,
        other: consumption.other,
        updatedAt: new Date(),
      },
      create: {
        time: consumption.time.toDate(),
        device_id: deviceId,
        heating: consumption.heating,
        cooling: consumption.cooling,
        auto: consumption.auto,
        dry: consumption.dry,
        fan: consumption.fan,
        other: consumption.other,
        updatedAt: new Date(),
      },
    });
  }

  await db.melcloud_daily_energy_consumption.upsert({
    where: {
      time_device_id: {
        time: fromDate.toDate(),
        device_id: deviceId,
      },
    },
    update: {
      heating: data.TotalHeatingConsumed,
      cooling: data.TotalCoolingConsumed,
      auto: data.TotalAutoConsumed,
      dry: data.TotalDryConsumed,
      fan: data.TotalFanConsumed,
      other: data.TotalOtherConsumed,
      updatedAt: new Date(),
    },
    create: {
      time: fromDate.toDate(),
      device_id: deviceId,
      heating: data.TotalHeatingConsumed,
      cooling: data.TotalCoolingConsumed,
      auto: data.TotalAutoConsumed,
      dry: data.TotalDryConsumed,
      fan: data.TotalFanConsumed,
      other: data.TotalOtherConsumed,
      updatedAt: new Date(),
    },
  });
}

async function saveDailyDataToDatabase(
  deviceId: number,
  data: IEnergyCostReport,
) {
  const fromDate = dayjs.tz(data.FromDate, "Europe/Helsinki");
  // const toDate = dayjs(data.ToDate).tz("Europe/Helsinki");

  const consumptions = data.Labels.map((label, index) => {
    return {
      time: fromDate.add(index, "day"),
      heating: data.Heating[index] ?? 0.0,
      cooling: data.Cooling[index] ?? 0.0,
      fan: data.Fan[index] ?? 0.0,
      dry: data.Dry[index] ?? 0.0,
      auto: data.Auto[index] ?? 0.0,
      other: data.Other[index] ?? 0.0,
    };
  });

  for (const consumption of consumptions) {
    await db.melcloud_daily_energy_consumption.upsert({
      where: {
        time_device_id: {
          time: consumption.time.toDate(),
          device_id: deviceId,
        },
      },
      update: {
        heating: consumption.heating,
        cooling: consumption.cooling,
        auto: consumption.auto,
        dry: consumption.dry,
        fan: consumption.fan,
        other: consumption.other,
        updatedAt: new Date(),
      },
      create: {
        time: consumption.time.toDate(),
        device_id: deviceId,
        heating: consumption.heating,
        cooling: consumption.cooling,
        auto: consumption.auto,
        dry: consumption.dry,
        fan: consumption.fan,
        other: consumption.other,
        updatedAt: new Date(),
      },
    });
  }
}

const LOGIN_ERRORS: string[] = [
  "The latest terms and conditions have not been uploaded by Mitsubishi in your language. This is an error on our part. Please contact support.",
  "Please check your email address and password are both correct.",
  "You must verify your email address before logging in. You should have received an email message with a link to perform verification.",
  "Please contact administrator, your account has been disabled.",
  "We have sent you an email with a link to verify your email address. You must verify your email address to login.",
  "This version of MELCloud is no longer supported. Please download an updated version from the app store.",
  "Your account has temporarily been locked due to repeated attempts to login with incorrect password. It will be unlocked in %MINUTES% minute(s)",
  "Please re-enter the captcha",
  "Since you last logged in to MELCloud, we have made security improvements to the way we store user account information. As a consequence, we are no longer able to verify your current password. Please use the 'Forgotten Password' button below to reset your password.",
  "Due to high load on our servers, we are temporarily requesting you enter the code below in order to log in.",
];

async function getAccessToken(
  email: string,
  password: string,
): Promise<string | null> {
  const serviceAccess = await db.serviceAccess.findFirst({
    where: {
      type: "MELCLOUD",
      email,
    },
  });

  if (serviceAccess) {
    const tokenExpiry = serviceAccess.tokenExpiresAt;
    if (tokenExpiry && new Date() < tokenExpiry) {
      info(`Using cached access token for ${email}`);
      return serviceAccess.token;
    }
  }

  info(`Fetching new access token for ${email}`);
  const response = await fetch(`${API_URL}/Login/ClientLogin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": CUSTOM_USER_AGENT,
    },
    body: JSON.stringify({
      Email: email,
      Password: password,
      Language: 17,
      AppVersion: APP_VERSION,
      Persist: "true",
      CaptchaResponse: null,
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();

  if (data.ErrorId) {
    throw new Error(LOGIN_ERRORS[data.ErrorId]);
  }

  const accessToken = data?.LoginData?.ContextKey;
  const expiry = new Date(data?.LoginData?.Expiry);

  // After fetching the new access token, update the serviceAccess in the database
  await db.serviceAccess.update({
    where: {
      id: serviceAccess?.id,
    },
    data: {
      token: accessToken,
      tokenExpiresAt: expiry,
    },
  });

  return accessToken;
}

function cachedHourlyDataToResponse(
  data: melcloud_hourly_energy_consumption[],
  deviceName?: string,
) {
  const totalHeating = data.reduce((acc, curr) => acc + curr.heating, 0);
  const totalCooling = data.reduce((acc, curr) => acc + curr.cooling, 0);
  const totalFan = data.reduce((acc, curr) => acc + curr.fan, 0);
  const totalDry = data.reduce((acc, curr) => acc + curr.dry, 0);
  const totalAuto = data.reduce((acc, curr) => acc + curr.auto, 0);
  const totalOther = data.reduce((acc, curr) => acc + curr.other, 0);

  data.sort((a, b) => a.time.getTime() - b.time.getTime());

  const labels = data.map((consumption) => {
    return dayjs(consumption.time).tz("Europe/Helsinki").hour();
  });

  const start = dayjs(data?.[0]?.time).tz("Europe/Helsinki");
  const end = dayjs(data?.[data.length - 1]?.time).tz("Europe/Helsinki");

  return {
    FromDate: start.format("YYYY-MM-DDTHH:mm:ss"),
    ToDate: end.format("YYYY-MM-DDTHH:mm:ss"),
    DeviceName: deviceName ?? "",
    TotalHeatingConsumed: totalHeating,
    TotalCoolingConsumed: totalCooling,
    TotalFanConsumed: totalFan,
    TotalDryConsumed: totalDry,
    TotalAutoConsumed: totalAuto,
    TotalOtherConsumed: totalOther,
    Heating: data.map((consumption) => consumption.heating),
    Cooling: data.map((consumption) => consumption.cooling),
    Fan: data.map((consumption) => consumption.fan),
    Dry: data.map((consumption) => consumption.dry),
    Auto: data.map((consumption) => consumption.auto),
    Other: data.map((consumption) => consumption.other),
    Labels: labels,
    LabelType: 0,
    CurrencySymbol: "kWh",
    BuildingAddress: null,
    BuildingCity: null,
    BuildingCountry: null,
    CustomerName: null,
    costs: null,
  };
}

function cachedDailyDataToResponse(
  data: melcloud_daily_energy_consumption[],
  deviceName?: string,
) {
  const totalHeating = data.reduce((acc, curr) => acc + curr.heating, 0);
  const totalCooling = data.reduce((acc, curr) => acc + curr.cooling, 0);
  const totalFan = data.reduce((acc, curr) => acc + curr.fan, 0);
  const totalDry = data.reduce((acc, curr) => acc + curr.dry, 0);
  const totalAuto = data.reduce((acc, curr) => acc + curr.auto, 0);
  const totalOther = data.reduce((acc, curr) => acc + curr.other, 0);

  data.sort((a, b) => a.time.getTime() - b.time.getTime());

  const labels = data.map((consumption) => {
    const date = dayjs(consumption.time).tz("Europe/Helsinki");
    return data.length > 2 && data.length < 9 ? date.day() : date.date();
  });

  const start = dayjs(data?.[0]?.time).tz("Europe/Helsinki");
  const end = dayjs(data?.[data.length - 1]?.time).tz("Europe/Helsinki");

  return {
    FromDate: start.format("YYYY-MM-DDTHH:mm:ss"),
    ToDate: end.format("YYYY-MM-DDTHH:mm:ss"),
    DeviceName: deviceName ?? "",
    TotalHeatingConsumed: totalHeating,
    TotalCoolingConsumed: totalCooling,
    TotalFanConsumed: totalFan,
    TotalDryConsumed: totalDry,
    TotalAutoConsumed: totalAuto,
    TotalOtherConsumed: totalOther,
    Heating: data.map((consumption) => consumption.heating),
    Cooling: data.map((consumption) => consumption.cooling),
    Fan: data.map((consumption) => consumption.fan),
    Dry: data.map((consumption) => consumption.dry),
    Auto: data.map((consumption) => consumption.auto),
    Other: data.map((consumption) => consumption.other),
    Labels: labels,
    LabelType: data.length > 2 && data.length < 9 ? 4 : 1,
    CurrencySymbol: "kWh",
    BuildingAddress: null,
    BuildingCity: null,
    BuildingCountry: null,
    CustomerName: null,
    costs: null,
  };
}

function cachedDailyDataToMonthlyResponse(
  data: melcloud_daily_energy_consumption[],
  deviceName?: string,
) {
  // Group data by month
  const groupedData: Record<string, melcloud_daily_energy_consumption[]> = {};

  data.forEach((item) => {
    const month = dayjs(item.time)
      .tz("Europe/Helsinki")
      .startOf("month")
      .format("YYYY-MM-DD");
    if (!groupedData[month]) {
      groupedData[month] = [];
    }
    groupedData[month]?.push(item);
  });

  const monthlyData = Object.entries(groupedData).map(([month, data]) => {
    const totalHeating = data.reduce((acc, curr) => acc + curr.heating, 0);
    const totalCooling = data.reduce((acc, curr) => acc + curr.cooling, 0);
    const totalFan = data.reduce((acc, curr) => acc + curr.fan, 0);
    const totalDry = data.reduce((acc, curr) => acc + curr.dry, 0);
    const totalAuto = data.reduce((acc, curr) => acc + curr.auto, 0);
    const totalOther = data.reduce((acc, curr) => acc + curr.other, 0);

    const deviceId = data?.[0]?.device_id;

    return {
      time: dayjs(month).toDate(),
      device_id: deviceId,
      heating: totalHeating,
      cooling: totalCooling,
      auto: totalAuto,
      dry: totalDry,
      fan: totalFan,
      other: totalOther,
    };
  });

  const totalHeating = monthlyData.reduce((acc, curr) => acc + curr.heating, 0);
  const totalCooling = monthlyData.reduce((acc, curr) => acc + curr.cooling, 0);
  const totalFan = monthlyData.reduce((acc, curr) => acc + curr.fan, 0);
  const totalDry = monthlyData.reduce((acc, curr) => acc + curr.dry, 0);
  const totalAuto = monthlyData.reduce((acc, curr) => acc + curr.auto, 0);
  const totalOther = monthlyData.reduce((acc, curr) => acc + curr.other, 0);

  monthlyData.sort((a, b) => a.time.getTime() - b.time.getTime());

  const labels = monthlyData.map((consumption) => {
    return dayjs(consumption.time).tz("Europe/Helsinki").month() + 1;
  });

  const start = dayjs(monthlyData?.[0]?.time).tz("Europe/Helsinki");
  const end = dayjs(monthlyData?.[monthlyData.length - 1]?.time).tz(
    "Europe/Helsinki",
  );

  return {
    FromDate: start.format("YYYY-MM-DDTHH:mm:ss"),
    ToDate: end.format("YYYY-MM-DDTHH:mm:ss"),
    DeviceName: deviceName ?? "",
    TotalHeatingConsumed: totalHeating,
    TotalCoolingConsumed: totalCooling,
    TotalFanConsumed: totalFan,
    TotalDryConsumed: totalDry,
    TotalAutoConsumed: totalAuto,
    TotalOtherConsumed: totalOther,
    Heating: monthlyData.map((consumption) => consumption.heating),
    Cooling: monthlyData.map((consumption) => consumption.cooling),
    Fan: monthlyData.map((consumption) => consumption.fan),
    Dry: monthlyData.map((consumption) => consumption.dry),
    Auto: monthlyData.map((consumption) => consumption.auto),
    Other: monthlyData.map((consumption) => consumption.other),
    Labels: labels,
    LabelType: 2,
    CurrencySymbol: "kWh",
    BuildingAddress: null,
    BuildingCity: null,
    BuildingCountry: null,
    CustomerName: null,
    costs: null,
  };
}
