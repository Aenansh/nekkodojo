import { Prisma } from "@/generated/prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LanguagePayload = {
  name: string;
  slug: string;
  monacoSlug: string;
  extension: string;
  dockerImage: string;
  compileCmd?: string | null;
  runCmd: string;
  isSupported?: boolean;
};

function isLanguagePayload(body: unknown): body is LanguagePayload {
  if (typeof body !== "object" || body === null) return false;
  const payload = body as Record<string, unknown>;

  return (
    ["name", "slug", "monacoSlug", "extension", "dockerImage", "runCmd"].every(
      (field) =>
        typeof payload[field] === "string" &&
        payload[field].trim().length > 0
    ) &&
    (payload.compileCmd === undefined ||
      payload.compileCmd === null ||
      typeof payload.compileCmd === "string") &&
    (payload.isSupported === undefined ||
      typeof payload.isSupported === "boolean")
  );
}

export async function GET() {
  try {
    const user = await currentUser();
    const isAdmin = user?.publicMetadata.role === "admin";

    const languages = await prisma.language.findMany({
      where: isAdmin ? undefined : { isSupported: true },
      select: isAdmin
        ? {
            id: true,
            name: true,
            slug: true,
            monacoSlug: true,
            extension: true,
            dockerImage: true,
            compileCmd: true,
            runCmd: true,
            isSupported: true,
            createdAt: true,
            updatedAt: true,
          }
        : {
            id: true,
            name: true,
            slug: true,
            monacoSlug: true,
            extension: true,
          },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(languages, { status: 200 });
  } catch (error) {
    console.error("[LANGUAGE_GET]", error);
    return NextResponse.json("Failed to fetch languages", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }

    if (!isLanguagePayload(body)) {
      return NextResponse.json(
        "name, slug, monacoSlug, extension, dockerImage, and runCmd are required; compileCmd must be a string or null and isSupported must be a boolean",
        { status: 400 }
      );
    }

    const language = await prisma.language.create({
      data: {
        name: body.name,
        slug: body.slug,
        monacoSlug: body.monacoSlug,
        extension: body.extension,
        dockerImage: body.dockerImage,
        compileCmd: body.compileCmd,
        runCmd: body.runCmd,
        isSupported: body.isSupported,
      },
    });

    return NextResponse.json(language, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        "A language with this name or slug already exists",
        { status: 409 }
      );
    }
    console.error("[LANGUAGE_POST]", error);
    return NextResponse.json("Failed to create language", { status: 500 });
  }
}