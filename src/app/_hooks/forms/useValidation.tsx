import { type FormInstance, type FormRule } from "antd";
import { useCallback } from "react";
import { type z } from "zod";

export const useValidation = <T = unknown,>(schema: z.ZodType<T>) =>
  useCallback(
    ({ getFieldsValue }: FormInstance) => ({
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      validator: async ({ field }) => {
        const result = await schema.safeParseAsync(getFieldsValue());

        const error =
          !result.success &&
          result.error.issues.filter((issue) => {
            const path = Array.isArray(issue.path)
              ? issue.path.join(".")
              : issue.path;
            return path === field;
          });

        return error ? Promise.reject(error) : Promise.resolve();
      },
    }),
    [schema],
  ) as FormRule;
