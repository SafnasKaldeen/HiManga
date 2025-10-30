// ==============================================
// FILE: app/api/manga/image/route.ts
// ==============================================
import { NextRequest, NextResponse } from "next/server";
import { WATERMARK_CONFIG } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const manga = searchParams.get("manga");
  const chapter = searchParams.get("chapter");
  const panel = searchParams.get("panel");

  // Validate input
  if (!manga || !chapter || !panel) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const chapterNum = parseInt(chapter);
  const panelNum = parseInt(panel);

  if (isNaN(chapterNum) || isNaN(panelNum) || chapterNum < 1 || panelNum < 1) {
    return NextResponse.json(
      { error: "Invalid chapter or panel number" },
      { status: 400 }
    );
  }

  // Generate Cloudinary URL (server-side only)
  const paddedChapter = String(chapterNum).padStart(3, "0");
  const paddedPanel = String(panelNum).padStart(3, "0");
  const baseUrl = "https://res.cloudinary.com/dk9ywbxu1/image/upload";
  const imagePath = `manga/${manga}/chapter-${paddedChapter}/panel-${paddedPanel}.jpg`;

  // Base transformations
  const baseTransformations = [
    "f_auto",
    "q_auto:good",
    "w_1200",
    "c_limit",
    "dpr_auto",
    "fl_progressive",
    "fl_lossy",
  ];

  const overlays: string[] = [];

  // Add logo watermark
  if (WATERMARK_CONFIG.logo.enabled) {
    let logoPublicId = WATERMARK_CONFIG.logo.path;

    if (logoPublicId.startsWith("http")) {
      logoPublicId = logoPublicId
        .replace(
          /^https?:\/\/res\.cloudinary\.com\/[^\/]+\/image\/upload\//,
          ""
        )
        .replace(/^v\d+\//, "")
        .replace(/\.[^.]+$/, "");
    }

    const formattedLogoId = logoPublicId.replace(/\//g, ":");

    overlays.push(
      `l_${formattedLogoId}`,
      `w_${WATERMARK_CONFIG.logo.width}`,
      `o_${WATERMARK_CONFIG.logo.opacity}`,
      `g_${WATERMARK_CONFIG.logo.position}`,
      `x_${WATERMARK_CONFIG.logo.offsetX}`,
      `y_${WATERMARK_CONFIG.logo.offsetY}`,
      "fl_layer_apply"
    );
  }

  // Add text watermark for specific manga
  const isHideWaterMark = manga === "one-piece" && chapterNum <= 700;

  if (isHideWaterMark) {
    const textContent = encodeURIComponent(WATERMARK_CONFIG.text.content);
    const fontStyle = `${WATERMARK_CONFIG.text.font}_${WATERMARK_CONFIG.text.size}_${WATERMARK_CONFIG.text.weight}`;

    if (WATERMARK_CONFIG.text.background.enabled) {
      overlays.push(
        `l_text:${fontStyle}:${textContent}`,
        `co_rgb:${WATERMARK_CONFIG.text.color}`,
        `b_rgb:${WATERMARK_CONFIG.text.background.color}`,
        `bo_${WATERMARK_CONFIG.text.background.padding}px_solid_rgb:${WATERMARK_CONFIG.text.background.color}`,
        `g_${WATERMARK_CONFIG.text.position}`,
        `x_${WATERMARK_CONFIG.text.offsetX}`,
        `y_${WATERMARK_CONFIG.text.offsetY}`,
        `o_${WATERMARK_CONFIG.text.opacity}`,
        "fl_layer_apply"
      );
    } else {
      overlays.push(
        `l_text:${fontStyle}:${textContent}`,
        `co_rgb:${WATERMARK_CONFIG.text.color}`,
        `g_${WATERMARK_CONFIG.text.position}`,
        `x_${WATERMARK_CONFIG.text.offsetX}`,
        `y_${WATERMARK_CONFIG.text.offsetY}`,
        `o_${WATERMARK_CONFIG.text.opacity}`,
        "fl_layer_apply"
      );
    }
  }

  const allTransformations = [...baseTransformations, ...overlays].join(",");
  const imageUrl = `${baseUrl}/${allTransformations}/${imagePath}`;

  try {
    // Fetch image from Cloudinary
    const imageResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "HiManga-Server/1.0",
      },
    });

    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Stream the image to client
    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}
