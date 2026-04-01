export type PluginCapability =
  | "analyze"
  | "transform"
  | "export"
  | "import"
  | "review"
  | "automation";

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  author: string;
  capabilities: ReadonlyArray<PluginCapability>;
  entry: string;
};

export type PluginContext = {
  projectName: string;
  revision: number;
  now: number;
};

export type PluginActionResult = {
  ok: boolean;
  message: string;
  payload?: unknown;
};

export type PluginModule = {
  manifest: PluginManifest;
  run: (context: PluginContext, input?: unknown) => PluginActionResult | Promise<PluginActionResult>;
};

export type PluginRegistry = {
  plugins: PluginModule[];
};

function normalizeCapabilities(capabilities: ReadonlyArray<PluginCapability>) {
  return Array.from(new Set(capabilities));
}

export function createPluginRegistry(): PluginRegistry {
  return { plugins: [] };
}

export function registerPlugin(registry: PluginRegistry, plugin: PluginModule): PluginRegistry {
  if (registry.plugins.some((entry) => entry.manifest.id === plugin.manifest.id)) {
    throw new Error(`Plugin already registered: ${plugin.manifest.id}`);
  }
  return {
    plugins: [
      ...registry.plugins,
      {
        ...plugin,
        manifest: {
          ...plugin.manifest,
          capabilities: normalizeCapabilities(plugin.manifest.capabilities),
        },
      },
    ],
  };
}

export function unregisterPlugin(registry: PluginRegistry, pluginId: string): PluginRegistry {
  return {
    plugins: registry.plugins.filter((plugin) => plugin.manifest.id !== pluginId),
  };
}

export function getPlugin(registry: PluginRegistry, pluginId: string) {
  return registry.plugins.find((plugin) => plugin.manifest.id === pluginId) ?? null;
}

export function pluginsByCapability(registry: PluginRegistry, capability: PluginCapability) {
  return registry.plugins.filter((plugin) => plugin.manifest.capabilities.includes(capability));
}

export async function runPlugin(
  registry: PluginRegistry,
  pluginId: string,
  context: PluginContext,
  input?: unknown,
): Promise<PluginActionResult> {
  const plugin = getPlugin(registry, pluginId);
  if (!plugin) {
    return {
      ok: false,
      message: `Plugin not found: ${pluginId}`,
    };
  }
  try {
    return await plugin.run(context, input);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Plugin execution failed",
    };
  }
}

export function validatePluginManifest(manifest: PluginManifest) {
  const issues: string[] = [];
  if (!manifest.id.trim()) {
    issues.push("Missing plugin id");
  }
  if (!manifest.name.trim()) {
    issues.push("Missing plugin name");
  }
  if (!manifest.version.trim()) {
    issues.push("Missing plugin version");
  }
  if (!manifest.entry.trim()) {
    issues.push("Missing plugin entry");
  }
  if (manifest.capabilities.length === 0) {
    issues.push("Plugin has no capabilities");
  }
  return {
    valid: issues.length === 0,
    issues,
  };
}

export function pluginManifestSummary(manifest: PluginManifest) {
  return `${manifest.name}@${manifest.version} [${manifest.capabilities.join(",")}]`;
}
