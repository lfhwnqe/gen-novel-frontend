import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "mmc-交易管理系统",
  version: packageJson.version,
  copyright: `© ${currentYear}, mmc-交易管理系统.`,
  meta: {
    title: "mmc-交易管理系统",
    description: "mmc-交易管理系统",
  },
};
