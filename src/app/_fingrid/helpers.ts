import { Configuration } from "@energyapp/app/_fingrid";
import axios, { type AxiosInstance } from "axios";
import { FINGRID_API } from "@energyapp/shared/constants";

type NewApi<T> = new (config: Configuration, url?: string, axiosInstance?: AxiosInstance) => T;

export function getConfiguredApi<T>(apiClass: NewApi<T>): T {
  const config = new Configuration();
  const axiosInstance = axios.create();
  return new apiClass(config, FINGRID_API, axiosInstance);
}
