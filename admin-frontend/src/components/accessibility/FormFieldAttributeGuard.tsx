"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const FIELD_SELECTOR = "input, select, textarea";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferBaseName(field: Element) {
  return (
    field.getAttribute("name") ||
    field.getAttribute("id") ||
    field.getAttribute("aria-label") ||
    field.getAttribute("placeholder") ||
    (field instanceof HTMLInputElement ? field.type : "") ||
    field.tagName.toLowerCase()
  );
}

function applyFormFieldAttributes(root: ParentNode, prefix: string) {
  const counters = new Map<string, number>();
  const fields = root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(FIELD_SELECTOR);

  fields.forEach((field) => {
    const needsId = !field.id;
    const needsName = !field.name;
    if (!needsId && !needsName) return;

    const base = slugify(inferBaseName(field)) || "field";
    const count = (counters.get(base) ?? 0) + 1;
    counters.set(base, count);

    const generated = `${prefix}-${base}${count > 1 ? `-${count}` : ""}`;
    if (needsId) field.id = generated;
    if (needsName) field.name = field.id || generated;
  });
}

export function FormFieldAttributeGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const routePrefix = slugify(pathname || "admin") || "admin";
    const prefix = `admin-${routePrefix}`;

    applyFormFieldAttributes(document, prefix);

    const observer = new MutationObserver(() => {
      applyFormFieldAttributes(document, prefix);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
