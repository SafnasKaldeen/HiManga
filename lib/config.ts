// ===== CONFIGURATION: Customize your watermarks here =====
export const WATERMARK_CONFIG = {
  logo: {
    enabled: true,
    path: "xdsafsa_nm4rmb", // Just the public ID
    width: 150,
    opacity: 60,
    position: "south_east",
    offsetX: 2,
    offsetY: 2,
    background: {
      enabled: true,
      color: "0f172a", // Tailwind slate-900 (or any hex color without #)
      opacity: 40,
      padding: 1, // Padding around the logo in percentage
    },
  },
  
  text: {
    enabled: false,
    content: "HiManga.com",
    font: "Raleway", // Try: Roboto, Montserrat, Oswald, Raleway, Lato
    size: 40,
    weight: "bold",
    color: "00FFFF",
    opacity: 100,
    position: "south_east",
    offsetX: 2,
    offsetY: 0,
    background: {
      enabled: true,
      color: "0f172a", // Tailwind slate-900
      opacity: 40,
      padding: 1,
    },
  },
};