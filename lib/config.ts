  // ===== CONFIGURATION: Customize your watermarks here =====
 export const WATERMARK_CONFIG = {
    logo: {
      enabled: true,
      path: "dfsfdsfs_gqmfct",
      width: 140,
      opacity: 70,
      position: "south_east",
      offsetX: 20,
      offsetY: 20,
    },
    text: {
      enabled: true,
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
        padding: 3,
      },
    },
  };