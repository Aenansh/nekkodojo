"use client";

import { useEffect, useState } from "react";
import { Code2, Loader2, Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Language = {
  id: string;
  name: string;
  slug: string;
  monacoSlug: string;
  extension: string;
  dockerImage: string;
  compileCmd: string | null;
  runCmd: string;
  isSupported: boolean;
};

type LanguagePayload = Omit<Language, "id">;

const inputClass =
  "border-[#3e2723] bg-[#0f0b0a] text-[#eaddcf] placeholder:text-[#5d4037]";

export default function LanguageManagementClient() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [languageToEdit, setLanguageToEdit] = useState<Language | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLanguages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/language");
        if (!response.ok) throw new Error("Failed to fetch languages.");
        const data = (await response.json()) as Language[];
        if (!cancelled) setLanguages(data);
      } catch (fetchError) {
        console.error("Failed to load languages:", fetchError);
        if (!cancelled) setError("Unable to load languages.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadLanguages();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const filteredLanguages = languages.filter((language) =>
    `${language.name} ${language.slug} ${language.monacoSlug}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-[#d4af37]">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading languages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p role="alert" className="text-red-400">{error}</p>
        <Button
          onClick={() => setRetryCount((count) => count + 1)}
          variant="outline"
          className="border-[#3e2723] text-[#eaddcf]"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-[#3e2723] pb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#eaddcf]">Languages</h1>
          <p className="mt-1 text-sm text-[#a1887f]">
            Manage programming languages available to question code stubs and the editor.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="cursor-pointer bg-[#d4af37] text-black hover:bg-[#b5952f]"
        >
          <Plus className="mr-2 size-4" />
          Add Language
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#5d4037]" />
          <Input
            placeholder="Search languages..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="border-[#3e2723] bg-[#1a110d]/50 pl-10 text-[#eaddcf] placeholder:text-[#5d4037]"
          />
        </div>
        <div className="text-xs font-mono uppercase text-[#5d4037]">
          Total: {filteredLanguages.length}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#3e2723] bg-[#1a110d]/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#3e2723] bg-[#0f0b0a]/50 text-[#a1887f]">
                <th className="p-4 font-medium">Language</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">Monaco ID</th>
                <th className="p-4 font-medium">Extension</th>
                <th className="p-4 font-medium">Runtime</th>
                <th className="p-4 font-medium text-center">Availability</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3e2723]">
              {filteredLanguages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#5d4037]">
                    No languages found matching &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                filteredLanguages.map((language) => (
                  <tr
                    key={language.id}
                    className="transition-colors hover:bg-[#3e2723]/10"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded border border-[#3e2723] bg-[#0f0b0a] text-[#d4af37]">
                          <Code2 className="size-4" />
                        </div>
                        <span className="font-medium text-[#eaddcf]">{language.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-[#5d4037]">{language.slug}</td>
                    <td className="p-4 font-mono text-xs text-[#a1887f]">{language.monacoSlug}</td>
                    <td className="p-4 font-mono text-xs text-[#a1887f]">.{language.extension}</td>
                    <td className="max-w-xs p-4">
                      <div className="truncate font-mono text-xs text-[#a1887f]" title={language.dockerImage}>
                        {language.dockerImage}
                      </div>
                      <div className="truncate font-mono text-[10px] text-[#5d4037]" title={language.runCmd}>
                        {language.runCmd}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        className={
                          language.isSupported
                            ? "border border-green-800 bg-green-950/40 text-green-300"
                            : "border border-[#3e2723] bg-[#0f0b0a] text-[#a1887f]"
                        }
                      >
                        {language.isSupported ? "Supported" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Edit ${language.name}`}
                        onClick={() => setLanguageToEdit(language)}
                        className="h-8 w-8 cursor-pointer text-[#a1887f] hover:bg-[#3e2723]/50 hover:text-[#d4af37]"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LanguageDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        language={null}
        onSuccess={() => setRetryCount((count) => count + 1)}
      />
      <LanguageDialog
        open={languageToEdit !== null}
        onOpenChange={(open) => !open && setLanguageToEdit(null)}
        language={languageToEdit}
        onSuccess={() => {
          setLanguageToEdit(null);
          setRetryCount((count) => count + 1);
        }}
      />
    </div>
  );
}

function LanguageDialog({
  open,
  onOpenChange,
  language,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: Language | null;
  onSuccess: () => void;
}) {
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

  useEffect(() => {
    if (!open) return;
    setName(language?.name ?? "");
    setSlug(language?.slug ?? "");
    setSlugWasEdited(Boolean(language));
    setMonacoSlug(language?.monacoSlug ?? "");
    setExtension(language?.extension ?? "");
    setDockerImage(language?.dockerImage ?? "");
    setCompileCmd(language?.compileCmd ?? "");
    setRunCmd(language?.runCmd ?? "");
    setIsSupported(language?.isSupported ?? true);
  }, [language, open]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setSlugWasEdited(false);
    setMonacoSlug("");
    setExtension("");
    setDockerImage("");
    setCompileCmd("");
    setRunCmd("");
    setIsSupported(true);
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
      const response = await fetch(
        language
          ? `/api/language?languageId=${encodeURIComponent(language.id)}`
          : "/api/language",
        {
        method: language ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        },
      );
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof result === "string"
            ? result
            : `Could not ${language ? "update" : "create"} language (${response.status})`,
        );
      }

      toast.success(
        language ? `${payload.name} was updated.` : `${payload.name} was added.`,
      );
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : `Could not ${language ? "update" : "create"} language.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#3e2723] bg-[#1a110d] text-[#eaddcf] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{language ? "Edit Language" : "Add Language"}</DialogTitle>
          <DialogDescription className="text-[#a1887f]">
            {language
              ? "Update editor metadata and runtime commands for this language."
              : "Configure editor metadata and runtime commands for this language."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-4">
            <h2 className="border-b border-[#3e2723] pb-2 text-sm font-semibold text-[#eaddcf]">
              Language details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="language-name" className="text-[#a1887f]">Name</Label>
                <Input
                  id="language-name"
                  value={name}
                  onChange={(event) => {
                    const value = event.target.value;
                    setName(value);
                    if (!slugWasEdited) {
                      setSlug(value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                    }
                  }}
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
              <h2 className="border-b border-[#3e2723] pb-2 text-sm font-semibold text-[#eaddcf]">
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer border-[#3e2723] bg-[#3e2723] text-[#a1887f] hover:bg-[#3e2723]/20 hover:text-[#eaddcf]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer bg-[#d4af37] text-black hover:bg-[#b5952f]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                language ? "Save Changes" : "Create Language"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
