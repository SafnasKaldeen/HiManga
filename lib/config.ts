  // ===== CONFIGURATION: Customize your watermarks here =====
 export const WATERMARK_CONFIG = {
    logo: {
      enabled: true,
      path: "https://res.cloudinary.com/dk9ywbxu1/image/upload/v1761317156/logo_eyzwjk.png",
      width: 140,
      opacity: 70,
      position: "south_east",
      offsetX: 20,
      offsetY: 20,
    },
    text: {
      enabled: true,
      content: "██HiManga.com██",
      font: "Courier",
      size: 40,
      weight: "bold",
      color: "FFFFFF",
      opacity: 100,
      position: "south_east",
      offsetX: 2,
      offsetY: 0,
      background: {
        enabled: true,
        color: "0f172a", // Tailwind slate-900
        opacity: 40,
        padding: 3,
      },
    },
  };