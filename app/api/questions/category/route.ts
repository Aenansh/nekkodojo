import { Prisma } from "@/generated/prisma/client";
import { generateSlug } from "@/lib/actions/makeSlug";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { name, slug, categoryOrder, prerequisiteArray = [] } = body;

    if (!name || !slug || categoryOrder === undefined) {
      return NextResponse.json("Name, Slug, and Order are required!", { status: 400 });
    }

    if (typeof categoryOrder !== "number") {
      return NextResponse.json("Category Order must be a number!", { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        slug,
        categoryOrder,
        prerequisiteArray: {
          connect: prerequisiteArray.map((preSlug: string) => ({
            slug: preSlug,
          })),
        },
      },
    });

    if (!newCategory)
      return NextResponse.json("Couldn't create the new category!", { status: 400 });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json("Failed to add the category. Prerequisite might not exist.", {
      status: 500,
    });
  }
}
/**
 * /api/questions/category
 * @description
 * creates a new category.
 */

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin")
      return NextResponse.json("Unauthorized!", { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("categoryId");

    if (!id) return NextResponse.json("No category found!", { status: 400 });

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return NextResponse.json("Category deleted!", { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json("Category not found!", { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          "Cannot delete: This category contains questions or is a prerequisite for others.",
          { status: 409 }
        );
      }
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/questions/category
 * @description
 * deletes a category.
 */

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin")
      return NextResponse.json("Unauthorized!", { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("categoryId");

    if (!id) return NextResponse.json("No category found!", { status: 400 });

    const body = await request.json();
    const { name, categoryOrder, prerequisiteArray = [] } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      categoryOrder === undefined ||
      typeof categoryOrder !== "number"
    )
      return NextResponse.json("Name (string) and Order (number) are required!", { status: 400 });

    const slug = generateSlug(name);

    const updatedCat = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
        categoryOrder,
        prerequisiteArray: {
          set: prerequisiteArray.map((preSlug: string) => ({
            slug: preSlug,
          })),
        },
      },
    });

    return NextResponse.json(updatedCat, { status: 200 });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json("A category with this name/slug already exists!", { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json("Category not found!", { status: 404 });
      }
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/questions/category
 * @description
 * updates a category.
 */