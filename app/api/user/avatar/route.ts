import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

// GET - Fetch user avatar
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    // Debug logging
    console.log("GET /api/user/avatar - userId from cookie:", userId);

    if (!userId) {
      console.log("No userId cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarId: true },
    });

    if (!user) {
      console.log("User not found for userId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Avatar fetched successfully:", user.avatarId);
    return NextResponse.json({ avatarId: user.avatarId });
  } catch (error) {
    console.error("Error fetching avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update user avatar
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    // Debug logging
    console.log("PUT /api/user/avatar - userId from cookie:", userId);

    if (!userId) {
      console.log("No userId cookie found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { avatarId } = await req.json();

    if (typeof avatarId !== "number") {
      console.log("Invalid avatarId:", avatarId);
      return NextResponse.json({ error: "Invalid avatarId" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarId },
      select: { avatarId: true },
    });

    console.log("Avatar updated successfully:", updatedUser.avatarId);

    // Create response with updated avatar
    const response = NextResponse.json({
      success: true,
      avatarId: updatedUser.avatarId,
    });

    // Set cookie with avatar ID for client-side access
    response.cookies.set("avatarId", avatarId.toString(), {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error updating avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}