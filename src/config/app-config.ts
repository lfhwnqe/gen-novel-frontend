import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "小说生成系统",
  version: packageJson.version,
  copyright: `© ${currentYear}, mmc-小说生成系统.`,
  meta: {
    title: "mmc-小说生成系统",
    description: "mmc-小说生成系统",
  },
};
