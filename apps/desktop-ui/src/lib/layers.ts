import type { Layer } from "./pcb-types";

export const layerPalette = {
  topCopper: "#ff5c5c",
  bottomCopper: "#4f8cff",
  mask: "#39d98a",
  silk: "#d8e1ff",
  outline: "#f4c95d",
  selection: "#55f0ff",
};

export const defaultLayers: Layer[] = [
  {
    id: "top-copper",
    name: "F.Cu Top Copper",
    kind: "signal",
    side: "top",
    color: layerPalette.topCopper,
    visible: true,
    order: 1,
  },
  {
    id: "bottom-copper",
    name: "B.Cu Bottom Copper",
    kind: "signal",
    side: "bottom",
    color: layerPalette.bottomCopper,
    visible: true,
    order: 2,
  },
  {
    id: "solder-mask",
    name: "F.Mask Solder Mask",
    kind: "mask",
    side: "top",
    color: layerPalette.mask,
    visible: true,
    order: 3,
  },
  {
    id: "silkscreen",
    name: "F.Silk Reference",
    kind: "silk",
    side: "top",
    color: layerPalette.silk,
    visible: true,
    order: 4,
  },
  {
    id: "edge-cuts",
    name: "Edge.Cuts Outline",
    kind: "mechanical",
    side: "mechanical",
    color: layerPalette.outline,
    visible: true,
    order: 5,
  },
];
