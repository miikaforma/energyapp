"use client";

import {Radio, type RadioChangeEvent} from "antd";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function StatisticsNavigation() {
  const { status } = useSession();

  const router = useRouter();
  const pathname = usePathname();
  let currentPage = "fingrid";
  if (pathname) {
    const pathArray = pathname.split("/");
    if (pathArray.length > 2) {
      currentPage = pathArray[2]!;
    }
  }

  const [selectedType, setSelectedType] = useState(currentPage ?? "fingrid");

  const onTypeChange = (e: RadioChangeEvent) => {
    const value = e.target.value as string
    setSelectedType(value);
    router.push(`/statistics/${value}`);
  };

  return (
    <Radio.Group
      value={selectedType}
      onChange={onTypeChange}
      style={{ width: "100%", marginBottom: 12 }}
    >
      <Radio.Button key={"fingrid"} value="fingrid">
        Fingrid
      </Radio.Button>
      {/*
      <Radio.Button key={"fmi"} value="fmi">
        Ilmatieteen laitos
      </Radio.Button> */}
      {status === "authenticated" && (
        <Radio.Button key={"solar"} value="solar">
          Aurinko
        </Radio.Button>
      )}
    </Radio.Group>
  );
}
