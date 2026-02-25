import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "vanzon-studio",
  title: "Vanzon Explorer Studio",

  projectId,
  dataset,
  basePath: "/studio",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Vanzon Explorer")
          .items([
            S.listItem()
              .title("📸 Médiathèque")
              .child(
                S.documentTypeList("mediaAsset").title("Médiathèque"),
              ),
            S.listItem()
              .title("🎨 Images Hero")
              .child(
                S.documentTypeList("heroImages").title("Images Hero"),
              ),
            S.divider(),
            S.listItem()
              .title("🚐 Vans")
              .child(S.documentTypeList("van").title("Vans")),
            S.listItem()
              .title("⭐ Témoignages")
              .child(
                S.documentTypeList("testimonial").title("Témoignages"),
              ),
            S.listItem()
              .title("📍 Spots Pays Basque")
              .child(
                S.documentTypeList("spotPaysBasque").title("Spots Pays Basque"),
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
});
