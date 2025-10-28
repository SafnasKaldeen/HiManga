// app/api/manga/signed-url/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In-memory cache for signed URLs
const urlCache = new Map<string, { url: string; expiresAt: number }>();

// Cache cleanup interval (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of urlCache.entries()) {
      if (value.expiresAt < now) {
        urlCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ===== CONFIGURATION: Customize your watermarks here =====
const WATERMARK_CONFIG = {
  logo: {
    enabled: true,
    path: "xdsafsa_nm4rmb",
    width: 150,
    opacity: 60,
    position: "south_east",
    offsetX: 2,
    offsetY: 2,
    background: {
      enabled: true,
      color: "0f172a",
      opacity: 40,
      padding: 1,
    },
  },
  
  text: {
    enabled: false,
    content: "HiManga.fun",
    font: "Raleway",
    size: 40,
    weight: "bold",
    color: "00FFFF",
    opacity: 100,
    position: "south_east",
    offsetX: 2,
    offsetY: 0,
    background: {
      enabled: true,
      color: "0f172a",
      opacity: 40,
      padding: 1,
    },
  },
};

// Build transformation string (computed once)
function buildTransformation(): string {
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
    const logoPublicId = WATERMARK_CONFIG.logo.path;

    if (WATERMARK_CONFIG.logo.background.enabled) {
      overlays.push(
        `l_${logoPublicId}`,
        `w_${WATERMARK_CONFIG.logo.width}`,
        `c_pad`,
        `b_rgb:${WATERMARK_CONFIG.logo.background.color}`,
        `bo_${WATERMARK_CONFIG.logo.background.padding}px_solid_rgb:${WATERMARK_CONFIG.logo.background.color}`,
        `o_${WATERMARK_CONFIG.logo.background.opacity}`,
        `g_${WATERMARK_CONFIG.logo.position}`,
        `x_${WATERMARK_CONFIG.logo.offsetX}`,
        `y_${WATERMARK_CONFIG.logo.offsetY}`,
        "fl_layer_apply"
      );
      
      overlays.push(
        `l_${logoPublicId}`,
        `w_${WATERMARK_CONFIG.logo.width}`,
        `o_${WATERMARK_CONFIG.logo.opacity}`,
        `g_${WATERMARK_CONFIG.logo.position}`,
        `x_${WATERMARK_CONFIG.logo.offsetX}`,
        `y_${WATERMARK_CONFIG.logo.offsetY}`,
        "fl_layer_apply"
      );
    } else {
      overlays.push(
        `l_${logoPublicId}`,
        `w_${WATERMARK_CONFIG.logo.width}`,
        `o_${WATERMARK_CONFIG.logo.opacity}`,
        `g_${WATERMARK_CONFIG.logo.position}`,
        `x_${WATERMARK_CONFIG.logo.offsetX}`,
        `y_${WATERMARK_CONFIG.logo.offsetY}`,
        "fl_layer_apply"
      );
    }
  }

  // Add text watermark
  if (WATERMARK_CONFIG.text.enabled) {
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

  return [...baseTransformations, ...overlays].join(",");
}

// Cache the transformation string
const TRANSFORMATION = buildTransformation();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mangaSlug = searchParams.get("mangaSlug");
    const chapter = searchParams.get("chapter");
    const panel = searchParams.get("panel");

    if (!mangaSlug || !chapter || !panel) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `${mangaSlug}-${chapter}-${panel}`;
    
    // Check cache first
    const cached = urlCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      // REDIRECT to cached URL (this is what makes images show)
      return NextResponse.redirect(cached.url);
    }

    // Build the image path
    const imagePath = `manga/${mangaSlug}/chapter-${chapter}/panel-${panel}.jpg`;

    // Generate signed URL with 1 hour expiration
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const signedUrl = cloudinary.url(imagePath, {
      transformation: TRANSFORMATION,
      sign_url: true,
      type: "authenticated",
      expires_at: expiresAt,
    });

    // Cache the URL (expire 5 minutes before actual expiration for safety)
    urlCache.set(cacheKey, {
      url: signedUrl,
      expiresAt: (expiresAt - 300) * 1000, // Convert to ms and subtract 5 min
    });

    // REDIRECT to the signed URL (this is what makes images show)
    return NextResponse.redirect(signedUrl);

  } catch (error) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}