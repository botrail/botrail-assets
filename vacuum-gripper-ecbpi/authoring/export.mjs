import { exportFixedModel } from "@botrail/authoring/fixed-usd.mjs";
import { writeUsdIfMain } from "@botrail/authoring/cli.mjs";
import { definition } from "./model.mjs";

export function exportModel() { return exportFixedModel(definition()); }
writeUsdIfMain(import.meta.url, "../usd/vacuum-gripper-ecbpi.usda", exportModel);
