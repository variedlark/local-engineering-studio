import { defaultLayers } from "./layers";
import type {
  Component,
  Footprint,
  ManufacturingExport,
  Net,
  PcbProject,
} from "./pcb-types";

function qfnFootprint(id: string, netPrefix: string): Footprint {
  const pads = Array.from({ length: 12 }, (_, index) => ({
    id: `${id}-pad-${index + 1}`,
    netId: `${netPrefix}-${(index % 4) + 1}`,
    position: {
      x: index < 6 ? -7 : 7,
      y: -7.5 + (index % 6) * 3,
    },
    width: 1.2,
    height: 2.1,
    shape: "rect" as const,
  }));
  return { id, name: "QFN-24-0.5", package: "QFN", pads };
}

function passiveFootprint(id: string, netA: string, netB: string): Footprint {
  return {
    id,
    name: "0603 metric",
    package: "R0603",
    pads: [
      {
        id: `${id}-1`,
        netId: netA,
        position: { x: -2, y: 0 },
        width: 1.4,
        height: 1.6,
        shape: "rect",
      },
      {
        id: `${id}-2`,
        netId: netB,
        position: { x: 2, y: 0 },
        width: 1.4,
        height: 1.6,
        shape: "rect",
      },
    ],
  };
}

const components: Component[] = [
  {
    id: "u1",
    reference: "U1",
    value: "STM32G4 MCU",
    footprint: qfnFootprint("u1-qfn", "mcu"),
    position: { x: 96, y: 68 },
    rotation: 0,
    layerId: "top-copper",
  },
  {
    id: "u2",
    reference: "U2",
    value: "USB-C PHY",
    footprint: qfnFootprint("u2-qfn", "usb"),
    position: { x: 42, y: 56 },
    rotation: 90,
    layerId: "top-copper",
  },
  {
    id: "j1",
    reference: "J1",
    value: "USB-C Receptacle",
    footprint: passiveFootprint("j1-usbc", "usb-1", "gnd"),
    position: { x: 16, y: 58 },
    rotation: 90,
    layerId: "top-copper",
  },
  {
    id: "l1",
    reference: "L1",
    value: "2.2µH Power Inductor",
    footprint: passiveFootprint("l1-0603", "vbus", "3v3"),
    position: { x: 141, y: 38 },
    rotation: 0,
    layerId: "top-copper",
  },
  {
    id: "r7",
    reference: "R7",
    value: "49.9Ω diff term",
    footprint: passiveFootprint("r7-0603", "usb-dp", "usb-dn"),
    position: { x: 61, y: 86 },
    rotation: 0,
    layerId: "top-copper",
  },
  {
    id: "c12",
    reference: "C12",
    value: "10µF decoupling",
    footprint: passiveFootprint("c12-0603", "3v3", "gnd"),
    position: { x: 125, y: 82 },
    rotation: 90,
    layerId: "bottom-copper",
  },
];

const nets: Net[] = [
  { id: "gnd", name: "GND", voltage: "0 V", unroutedLengthMm: 0 },
  { id: "3v3", name: "+3V3", voltage: "3.3 V", unroutedLengthMm: 4.4 },
  { id: "vbus", name: "VBUS", voltage: "5 V", unroutedLengthMm: 0 },
  {
    id: "usb-dp",
    name: "USB_D+",
    impedanceOhms: 90,
    differentialPair: "USB2",
    unroutedLengthMm: 2.8,
  },
  {
    id: "usb-dn",
    name: "USB_D-",
    impedanceOhms: 90,
    differentialPair: "USB2",
    unroutedLengthMm: 3.1,
  },
];

const manufacturing: ManufacturingExport[] = [
  {
    id: "gerber",
    name: "Gerber X2 layer pack",
    format: "gerber",
    status: "ready",
    detail: "5 visible fabrication layers staged",
  },
  {
    id: "drill",
    name: "Excellon drill files",
    format: "drill",
    status: "needs-check",
    detail: "Verify via drill tolerance before release",
  },
  {
    id: "bom",
    name: "Bill of materials",
    format: "bom",
    status: "ready",
    detail: "6 line items with MPN placeholders",
  },
  {
    id: "pnp",
    name: "Pick and place",
    format: "pick-place",
    status: "ready",
    detail: "Top and bottom centroid data available",
  },
  {
    id: "step",
    name: "STEP assembly",
    format: "step",
    status: "coming-soon",
    detail: "Waiting for mechanical exporter integration",
  },
];

export const mockPcbProject: PcbProject = {
  id: "les-demo-board",
  name: "Precision Motor Controller",
  path: "~/Hardware/precision-motor-controller",
  revision: "A.3",
  savedState: "dirty",
  engineStatus: "ready",
  mode: "pcb",
  board: {
    id: "board-main",
    name: "Control Board 42 x 120",
    width: 160,
    height: 110,
    outline: [
      { x: 8, y: 8 },
      { x: 154, y: 8 },
      { x: 154, y: 104 },
      { x: 8, y: 104 },
    ],
    layers: defaultLayers,
    components,
    tracks: [
      {
        id: "t1",
        netId: "usb-dp",
        layerId: "top-copper",
        width: 0.18,
        lengthMm: 38.4,
        points: [
          { x: 22, y: 56 },
          { x: 42, y: 56 },
          { x: 61, y: 84 },
          { x: 91, y: 66 },
        ],
      },
      {
        id: "t2",
        netId: "usb-dn",
        layerId: "top-copper",
        width: 0.18,
        lengthMm: 39.1,
        points: [
          { x: 22, y: 60 },
          { x: 42, y: 60 },
          { x: 61, y: 88 },
          { x: 91, y: 70 },
        ],
      },
      {
        id: "t3",
        netId: "3v3",
        layerId: "bottom-copper",
        width: 0.35,
        lengthMm: 54.2,
        points: [
          { x: 141, y: 39 },
          { x: 126, y: 82 },
          { x: 101, y: 75 },
        ],
      },
      {
        id: "t4",
        netId: "gnd",
        layerId: "top-copper",
        width: 0.45,
        lengthMm: 72.7,
        points: [
          { x: 18, y: 62 },
          { x: 45, y: 96 },
          { x: 96, y: 94 },
          { x: 137, y: 83 },
        ],
      },
    ],
    vias: [
      {
        id: "v1",
        netId: "3v3",
        position: { x: 126, y: 82 },
        drill: 0.3,
        diameter: 0.62,
        fromLayerId: "top-copper",
        toLayerId: "bottom-copper",
      },
      {
        id: "v2",
        netId: "gnd",
        position: { x: 45, y: 96 },
        drill: 0.3,
        diameter: 0.62,
        fromLayerId: "top-copper",
        toLayerId: "bottom-copper",
      },
      {
        id: "v3",
        netId: "usb-dp",
        position: { x: 75, y: 76 },
        drill: 0.2,
        diameter: 0.48,
        fromLayerId: "top-copper",
        toLayerId: "bottom-copper",
      },
    ],
  },
  nets,
  drc: [
    {
      id: "drc-1",
      severity: "error",
      title: "Clearance below rule",
      rule: "Min copper clearance 0.15 mm",
      description: "USB_D+ segment approaches J1 shield pad at 0.09 mm.",
      suggestion:
        "Nudge the differential pair corridor or relax only with impedance review.",
      location: { x: 38, y: 57 },
      objectIds: ["t1", "j1"],
    },
    {
      id: "drc-2",
      severity: "warning",
      title: "Differential pair skew",
      rule: "USB2 length mismatch < 0.5 mm",
      description: "USB_D+ and USB_D- mismatch is currently 0.7 mm.",
      suggestion: "Add a short tuning accordion near U2 before release.",
      location: { x: 62, y: 86 },
      objectIds: ["t1", "t2"],
    },
    {
      id: "drc-3",
      severity: "info",
      title: "Unrouted power stub",
      rule: "No open ratsnest before manufacturing",
      description: "+3V3 has 4.4 mm remaining to C12 decoupling pad.",
      suggestion: "Complete bottom-layer escape route or add a via near U1.",
      location: { x: 116, y: 78 },
      objectIds: ["c12"],
    },
  ],
  manufacturing,
};
