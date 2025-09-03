export const API_CONFIG = {
  JOLPICA: process.env.NEXT_PUBLIC_JOLPICA_API_BASE || "",
  DHL: process.env.NEXT_PUBLIC_DHL_API_BASE || "",
  OPENF1: process.env.NEXT_PUBLIC_OPEN_F1_API_BASE || "",
  F1MEDIA: process.env.NEXT_PUBLIC_F1_MEDIA_BASE || "",
  MULTVIEWER: process.env.NEXT_PUBLIC_MULTVIEWER_BASE || "",
  REVALIDATION_TIME: Number(process.env.REVALIDATION_TIME || 3600),
};
export type ApiConfig = typeof API_CONFIG;
