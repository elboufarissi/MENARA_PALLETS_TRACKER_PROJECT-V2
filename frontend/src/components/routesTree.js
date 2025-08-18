// routesTree.js
const routesTree = {
  label: "Palette Track",
  path: "/",
  children: [
    {
      label: "Flux interne",
      path: "/flux-interne",
      children: [
        {
          label: "Consignation",
          path: "/flux-interne/consignation",
        },
        {
          label: "Déconsignation",
          path: "/flux-interne/deconsignation",
        },
      ],
    },
    {
      label: "Récupération",
      path: "/recuperation",
    },
    {
      label: "Dépôt de caution",
      path: "/depot-de-caution",
    },
    {
      label: "Etat",
      path: "/etat/caution",
    },
  ],
};

export default routesTree;
