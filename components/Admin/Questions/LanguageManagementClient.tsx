"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type LanguagePayload = {
  name: string;
  slug: string;
  monacoSlug: string;
  extension: string;
  dockerImage: string;
  compileCmd: string | null;
  runCmd: string;
  isSupported: boolean;
};

const inputClass =
  "border-[#3e2723] bg-[#0f0b0a] text-[#eaddcf] placeholder:text-[#5d4037]";

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function LanguageManagementClient() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [monacoSlug, setMonacoSlug] = useState("");
  const [extension, setExtension] = useState("");
  const [dockerImage, setDockerImage] = useState("");
  const [compileCmd, setCompileCmd] = useState("");
  const [runCmd, setRunCmd] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugWasEdited) setSlug(createSlug(value));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: LanguagePayload = {
      name: name.trim(),
      slug: slug.trim(),
      monacoSlug: monacoSlug.trim(),
      extension: extension.trim(),
      dockerImage: dockerImage.trim(),
      compileCmd: compileCmd.trim() || null,
      runCmd: runCmd.trim(),
      isSupported,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof result === "string"
            ? result
            : `Could not create language (${response.status})`
        );
      }

      toast.success(`${payload.name} was added.`);
      setName("");
      setSlug("");
      setSlugWasEdited(false);
      setMonacoSlug("");
      setExtension("");
      setDockerImage("");
      setCompileCmd("");
      setRunCmd("");
      setIsSupported(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create language.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/questions"
        className="inline-flex items-center gap-2 text-sm text-[#a1887f] transition-colors hover:text-[#d4af37]"
      >
        <ArrowLeft className="size-4" />
        Questions dashboard
      </Link>

      <div className="flex items-start gap-4 border-b border-[#3e2723] pb-6">
        <div className="rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 p-3 text-[#d4af37]">
          <Code2 className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#eaddcf]">Add Language</h1>
          <p className="mt-1 text-sm text-[#a1887f]">
            Configure editor metadata and runtime commands for a supported language.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-[#3e2723] bg-[#1a110d]/40 p-5 sm:p-7"
      >
        <section className="space-y-4">
          <h2 className="border-b border-[#3e2723] pb-2 text-lg font-semibold text-[#eaddcf]">
            Language details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language-name" className="text-[#a1887f]">Name</Label>
              <Input
                id="language-name"
                value={name}
                onChange={(event) => handleNameChange(event.target.value)}
                placeholder="e.g. Python"
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-slug" className="text-[#a1887f]">Slug</Label>
              <Input
                id="language-slug"
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugWasEdited(true);
                }}
                placeholder="e.g. python"
                className={`${inputClass} font-mono`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monaco-slug" className="text-[#a1887f]">Monaco language ID</Label>
              <Input
                id="monaco-slug"
                value={monacoSlug}
                onChange={(event) => setMonacoSlug(event.target.value)}
                placeholder="e.g. python"
                className={`${inputClass} font-mono`}
                required
              />
              <p className="text-xs text-[#5d4037]">
                Use the language identifier recognized by Monaco Editor.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language-extension" className="text-[#a1887f]">File extension</Label>
              <Input
                id="language-extension"
                value={extension}
                onChange={(event) => setExtension(event.target.value)}
                placeholder="e.g. py"
                className={`${inputClass} font-mono`}
                required
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#3e2723] bg-[#0f0b0a] p-3 text-sm text-[#eaddcf]">
            <input
              type="checkbox"
              checked={isSupported}
              onChange={(event) => setIsSupported(event.target.checked)}
              className="size-4 accent-[#d4af37]"
            />
            Available to users in the editor
          </label>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="border-b border-[#3e2723] pb-2 text-lg font-semibold text-[#eaddcf]">
              Runtime configuration
            </h2>
            <p className="mt-2 text-xs text-[#a1887f]">
              These values are stored for the execution service. Creating a language does not enable code execution by itself.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="docker-image" className="text-[#a1887f]">Docker image</Label>
            <Input
              id="docker-image"
              value={dockerImage}
              onChange={(event) => setDockerImage(event.target.value)}
              placeholder="e.g. python:3.12-slim"
              className={`${inputClass} font-mono`}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compile-command" className="text-[#a1887f]">
              Compile command <span className="text-[#5d4037]">(optional)</span>
            </Label>
            <Textarea
              id="compile-command"
              value={compileCmd}
              onChange={(event) => setCompileCmd(event.target.value)}
              placeholder="Leave blank for interpreted languages"
              className={`${inputClass} font-mono text-sm`}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="run-command" className="text-[#a1887f]">Run command</Label>
            <Textarea
              id="run-command"
              value={runCmd}
              onChange={(event) => setRunCmd(event.target.value)}
              placeholder="e.g. python3 main.py"
              className={`${inputClass} font-mono text-sm`}
              rows={2}
              required
            />
          </div>
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-[#3e2723] pt-5 sm:flex-row">
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.push("/admin/questions")}
            className="cursor-pointer border-[#3e2723] text-[#eaddcf] hover:bg-[#3e2723]/40"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer bg-[#d4af37] text-black transition-colors hover:bg-[#b5952f]"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isSubmitting ? "Creating..." : "Create Language"}
          </Button>
        </div>
      </form>
    </div>
  );
}
