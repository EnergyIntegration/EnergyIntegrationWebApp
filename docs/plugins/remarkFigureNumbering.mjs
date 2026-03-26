function getAttribute(node, name) {
  if (!node.attributes) {
    return undefined;
  }

  const attribute = node.attributes.find(
    (item) => item && item.type === "mdxJsxAttribute" && item.name === name,
  );
  return attribute?.value;
}

function setAttribute(node, name, value) {
  if (!node.attributes) {
    node.attributes = [];
  }

  const existing = node.attributes.find(
    (item) => item && item.type === "mdxJsxAttribute" && item.name === name,
  );

  if (existing) {
    existing.value = value;
    return;
  }

  node.attributes.push({
    type: "mdxJsxAttribute",
    name,
    value,
  });
}

function visit(node, callback) {
  callback(node);

  if (!node || !Array.isArray(node.children)) {
    return;
  }

  for (const child of node.children) {
    visit(child, callback);
  }
}

function isMdxNode(node, name) {
  return (
    node &&
    (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
    node.name === name
  );
}

function normalizeKind(value) {
  return value === "table" ? "table" : "figure";
}

function labelForKind(kind) {
  if (kind === "table") {
    return "Table";
  }
  if (kind === "equation") {
    return "Equation";
  }
  return "Figure";
}

export default function remarkFigureNumbering() {
  return (tree) => {
    const registry = new Map();
    const counters = {
      figure: 0,
      table: 0,
      equation: 0,
    };

    visit(tree, (node) => {
      if (!isMdxNode(node, "Figure")) {
        return;
      }

      const id = getAttribute(node, "id");
      const kind = normalizeKind(getAttribute(node, "kind"));
      counters[kind] += 1;
      const number = String(counters[kind]);
      const label = labelForKind(kind);

      setAttribute(node, "kind", kind);
      setAttribute(node, "number", number);
      setAttribute(node, "label", label);

      if (typeof id === "string" && id.length > 0) {
        registry.set(id, { number, label, kind });
      }
    });

    visit(tree, (node) => {
      if (!isMdxNode(node, "Equation")) {
        return;
      }

      const id = getAttribute(node, "id");
      counters.equation += 1;
      const number = String(counters.equation);
      const label = labelForKind("equation");

      setAttribute(node, "number", number);
      setAttribute(node, "label", label);

      if (typeof id === "string" && id.length > 0) {
        registry.set(id, { number, label, kind: "equation" });
      }
    });

    visit(tree, (node) => {
      if (!isMdxNode(node, "FigRef") && !isMdxNode(node, "TableRef") && !isMdxNode(node, "EqRef")) {
        return;
      }

      const target = getAttribute(node, "to");
      if (typeof target !== "string" || !registry.has(target)) {
        return;
      }

      const { number, label, kind } = registry.get(target);
      setAttribute(node, "number", number);
      setAttribute(node, "label", label);
      setAttribute(node, "kind", kind);
    });
  };
}
