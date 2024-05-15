"use client";

import { Radio } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function StatisticsNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  let currentPage = "cbase";
  if (pathname) {
    const pathArray = pathname.split("/");
    if (pathArray.length > 2) {
      currentPage = pathArray[2]!;
    }
  }

  const [selectedType, setSelectedType] = useState(currentPage ?? "cbase");

  const onTypeChange = (value: string) => {
    setSelectedType(value);
    router.push(`/statistics/${value}`);
  };

  return (
    <Radio.Group
      value={selectedType}
      onChange={(e) => onTypeChange(e.target.value)}
      style={{ width: "100%", marginBottom: 12 }}
    >
      {/* <Radio.Button key={"fingrid"} value="fingrid">
        Fingrid
      </Radio.Button>
      <Radio.Button key={"fmi"} value="fmi">
        Ilmatieteen laitos
      </Radio.Button> */}
      <Radio.Button key={"cbase"} value="cbase">
        CBase
      </Radio.Button>
    </Radio.Group>
  );
}
