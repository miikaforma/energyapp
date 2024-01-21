import { db } from "@energyapp/server/db";
import { info } from "console";
import dayjs from "dayjs";
import { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc)
dayjs.extend(timezone)

const API_URL = 'https://app.melcloud.com/Mitsubishi.Wifi.Client';
const CUSTOM_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
const APP_VERSION = "1.31.0.0";

export async function getAccessTokenByDeviceId(deviceId: string) {
    const access = await db.serviceAccess.findUnique({
        where: {
            accessId: deviceId,
            type: 'MELCLOUD',
        },
    });

    if (!access) {
        throw new Error('No service access found');
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
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': CUSTOM_USER_AGENT,
            'X-MitsContextKey': accessToken,
        },
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
}

export async function getEnergyReport(deviceId: string, fromDate: Dayjs, toDate: Dayjs) {
    const startTime = dayjs(fromDate).tz('Europe/Helsinki');
    const endTime = dayjs(toDate).tz('Europe/Helsinki');

    info(`Fetching energy report for ${deviceId} from ${startTime.format('YYYY-MM-DDTHH:mm:ss')} to ${endTime.format('YYYY-MM-DDTHH:mm:ss')}`);

    const body = JSON.stringify({
        DeviceId: deviceId,
        FromDate: startTime.format('YYYY-MM-DDTHH:mm:ss'),
        ToDate: endTime.format('YYYY-MM-DDTHH:mm:ss'),
        UseCurrency: false,
    });

    const accessToken = await getAccessTokenByDeviceId(deviceId);

    const response = await fetch(`${API_URL}/EnergyCost/Report`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': CUSTOM_USER_AGENT,
            'X-MitsContextKey': accessToken,
        },
        body: body,
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
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
    "Due to high load on our servers, we are temporarily requesting you enter the code below in order to log in."
];

async function getAccessToken(email: string, password: string) {
    const serviceAccess = await db.serviceAccess.findFirst({
        where: {
            type: 'MELCLOUD',
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
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': CUSTOM_USER_AGENT,
        },
        body: JSON.stringify({
            Email: email,
            Password: password,
            Language: 17,
            AppVersion: APP_VERSION,
            Persist: 'true',
            CaptchaResponse: null,
        }),
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
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