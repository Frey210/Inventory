---
version: 1
slug: runtime-catchall
primary_target: "src/app/[[...path]]/page.tsx"
related_targets:
  [
    "src/components/forms.tsx",
    "src/components/data.tsx",
    "src/components/shell.tsx",
    "src/app/globals.css",
  ]
---

# Implementasi route MTC Inventory

Renderer server bersama mempertahankan URL pada UI_SPEC. Brief auth, office, technician, loans, fulfilment dan controls di direktori ini berlaku berdasarkan URL yang disentuh, meskipun rencana awal memakai satu file route per halaman. Ikuti PRODUCT.md dan DESIGN.md; jangan memperkenalkan identitas visual berbeda antarmodul.

Nota menggunakan `src/server/documents/template.ts` dan `render.ts`, sesuai brief nota dan PRINT_SPEC. Screenshot review adalah data simulasi dan tidak masuk repository. Implementasi preparation tidak membuktikan gate bisnis atau UAT operasional.
