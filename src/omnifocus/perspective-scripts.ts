import { PERSPECTIVE_SERIALIZER } from "./serializers.js";

export function buildListPerspectivesScript(): string {
  return `${PERSPECTIVE_SERIALIZER}
var builtIn = Perspective.BuiltIn.all.map(function(p) { return { id: p.name, name: p.name, isBuiltIn: true }; });
var custom = Perspective.Custom.all.map(function(p) { return serializePerspective(p); });
JSON.stringify(builtIn.concat(custom));`;
}
