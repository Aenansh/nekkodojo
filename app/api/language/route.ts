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
/**
 * /api/language
 * @description
 * fetches supported languages for users and all language settings for administrators.
 */

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
/**
 * /api/language
 * @description
 * creates a language configuration for administrators.
 */

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== "admin") {
      return NextResponse.json("Unauthorized!", { status: 401 });
    }

    const languageId = new URL(request.url).searchParams.get("languageId");
    if (!languageId) {
      return NextResponse.json("languageId is required", { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json("Invalid JSON body", { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json("Request body must be an object", { status: 400 });
    }

    const payload = body as Record<string, unknown>;
    const data: {
      name?: string;
      slug?: string;
      monacoSlug?: string;
      extension?: string;
      dockerImage?: string;
      compileCmd?: string | null;
      runCmd?: string;
      isSupported?: boolean;
    } = {};

    for (const field of [
      "name",
      "slug",
      "monacoSlug",
      "extension",
      "dockerImage",
      "runCmd",
    ] as const) {
      if (field in payload) {
        if (typeof payload[field] !== "string" || !payload[field].trim()) {
          return NextResponse.json(`${field} must be a non-empty string`, {
            status: 400,
          });
        }
        data[field] = payload[field];
      }
    }
    if ("compileCmd" in payload) {
      if (
        payload.compileCmd !== null &&
        typeof payload.compileCmd !== "string"
      ) {
        return NextResponse.json("compileCmd must be a string or null", {
          status: 400,
        });
      }
      data.compileCmd =
        typeof payload.compileCmd === "string"
          ? payload.compileCmd
          : null;
    }
    if ("isSupported" in payload) {
      if (typeof payload.isSupported !== "boolean") {
        return NextResponse.json("isSupported must be a boolean", {
          status: 400,
        });
      }
      data.isSupported = payload.isSupported;
    }
    if (Object.keys(data).length === 0) {
      return NextResponse.json("At least one language field must be provided", {
        status: 400,
      });
    }

    const language = await prisma.language.update({
      where: { id: languageId },
      data,
    });
    return NextResponse.json(language, { status: 200 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        "A language with this name or slug already exists",
        { status: 409 },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json("Language not found", { status: 404 });
    }
    console.error("[LANGUAGE_PATCH]", error);
    return NextResponse.json("Failed to update language", { status: 500 });
  }
}
/**
 * /api/language
 * @description
 * updates a language configuration selected by languageId for administrators.
 */