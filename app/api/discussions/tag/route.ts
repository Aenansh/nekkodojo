import { Prisma } from "@/generated/prisma/client";
import { generateSlug } from "@/lib/actions/makeSlug";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const tags = await prisma.tag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { discussions: true },
        },
      },
    });

    return NextResponse.json(tags, { status: 200 });
  } catch (error) {
    console.error("GET DISCUSSION TAGS ERROR:", error);
    return NextResponse.json("Failed to fetch discussion tags", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const body = await request.json();
    const { name, slug, color } = body;

    if ([name, slug, color].some((t) => typeof t !== "string" || !t.trim())) {
      return NextResponse.json("All fields are required!", { status: 400 });
    }
    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        color,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json("A tag with this slug already exists!", { status: 409 });
      }
    }
    return NextResponse.json("Failed to create the tag.", { status: 500 });
  }
}
/**
 * /api/discussions/tag
 * @description
 * creates a new tag for the discussions.
 */

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin")
      return NextResponse.json("Unauthorized!", { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("tagId");

    if (!id) return NextResponse.json("No tag found!", { status: 400 });

    await prisma.tag.delete({
      where: {
        id,
      },
    });

    return NextResponse.json("Tag deleted!", { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json("Tag not found!", { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          "Cannot delete: This tag contains questions or is a prerequisite for others.",
          { status: 409 }
        );
      }
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/discussions/tag
 * @description
 * deletes a tag for the discussions.
 */

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin")
      return NextResponse.json("Unauthorized!", { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("tagId");

    if (!id) return NextResponse.json("No tag found!", { status: 400 });

    const body = await request.json();
    const { name, color } = body;

    if ([name, color].some((t) => typeof t !== "string" || !t.trim()))
      return NextResponse.json("Name and color are required!", { status: 400 });

    const slug = generateSlug(name);

    const updatedTag = await prisma.tag.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
        color,
      },
    });

    return NextResponse.json(updatedTag, { status: 200 });
  } catch (error) {
    console.error("UPDATE TAG ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json("A tag with this name/slug already exists!", { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json("Category not found!", { status: 404 });
      }
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/discussions/tag
 * @description
 * updates a tag for the discussions.
 */