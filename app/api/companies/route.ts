import { Prisma } from "@/generated/prisma/client";
import { CompanyWhereInput } from "@/generated/prisma/models";
import { generateSlug } from "@/lib/actions/makeSlug";
import imagekit from "@/lib/image-kit";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json("Unauthorized!", { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("company") || "";

    const whereClause: CompanyWhereInput = {
      AND: [
        {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        },
        {
          questions: { some: {} },
        },
      ],
    };

    const allCompanies = await prisma.company.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return NextResponse.json(allCompanies, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json("Failed to get companies", { status: 500 });
  }
}
/**
 * /api/companies
 * @description
 * fetches all companies or by name.
 */

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const body = await request.json();
    const { name, slug, logoId, logo, websiteUrl } = body;

    if ([name, slug].some((t) => typeof t !== "string" || !t.trim())) {
      return NextResponse.json("All fields required!", { status: 400 });
    }

    const newCompany = await prisma.company.create({
      data: {
        name,
        slug,
        logoId: logoId || null,
        logo: logo || null,
        websiteUrl: websiteUrl || null,
      },
    });

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("CREATE COMPANY ERROR:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json("A company with this Name, Slug, or Logo already exists!", {
          status: 409,
        });
      }
    }

    return NextResponse.json("Failed to register company!", { status: 500 });
  }
}
/**
 * /api/companies
 * @description
 * creates a new company.
 */

export async function PUT(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("companyId");

    if (!id) return NextResponse.json("No company provided!", { status: 400 });

    const body = await request.json();
    const { name, logoId, logo, websiteUrl } = body;

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json("Name is required!", { status: 400 });
    }

    const oldComp = await prisma.company.findUnique({
      where: { id },
    });

    if (!oldComp) return NextResponse.json("No such company found!", { status: 404 });

    const isReplacing = logoId && oldComp.logoId && logoId !== oldComp.logoId;
    const isDeleting = logoId === null && oldComp.logoId;

    if (isReplacing || isDeleting) {
      await imagekit.deleteFile(oldComp.logoId!).catch((err) => {
        console.error("Image deletion failed (non-critical):", err);
      });
    }
    const slug = generateSlug(name);
    const updateData: Prisma.CompanyUpdateInput = {
      name,
      slug,
      websiteUrl: websiteUrl === undefined ? undefined : websiteUrl || null,
    };

    if (logo !== undefined) updateData.logo = logo;
    if (logoId !== undefined) updateData.logoId = logoId;

    const updatedComp = await prisma.company.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedComp, { status: 200 });
  } catch (error) {
    console.error("UPDATE COMPANY ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json("A company with this name/slug already exists!", { status: 409 });
      }
      if (error.code === "P2025") {
        return NextResponse.json("Company not found!", { status: 404 });
      }
    }

    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
/**
 * /api/companies
 * @description
 * updates a company.
 */

export async function DELETE(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("companyId");

    if (!id) return NextResponse.json("No company provided!", { status: 400 });

    const comp = await prisma.company.findUnique({
      where: { id },
      select: { logoId: true },
    });
    if (!comp) {
      return NextResponse.json("Company not found!", { status: 404 });
    }
    if (comp && comp.logoId) {
      await imagekit.deleteFile(comp.logoId).catch((err) => {
        console.error("Failed to delete image from ImageKit:", err);
      });
    }
    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json("Company deleted!", { status: 200 });
  } catch (error) {
    console.error("DELETE COMPANY ERROR:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json("Company not found!", { status: 404 });
      }
      if (error.code === "P2003") {
        return NextResponse.json("Cannot delete: This company has questions attached to it.", {
          status: 409,
        });
      }
    }

    return NextResponse.json("Failed to delete company.", { status: 500 });
  }
}
/**
 * /api/companies
 * @description
 * deletes a company.
 */