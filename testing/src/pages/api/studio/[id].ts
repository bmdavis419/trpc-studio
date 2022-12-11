import type { NextApiRequest, NextApiResponse } from "next";
import {
  appRouter,
  generateStudioTree,
  StudioTree,
} from "../../../server/trpc/router/_app";

type StudioDTO = {
  children: StudioDTO[];
  parentId: string | null;
  key: string;
  isMutation: boolean;
  isQuery: boolean;
  id: string;
};

export default (req: NextApiRequest, res: NextApiResponse) => {
  // get the id from params
  const { id } = req.query;

  // get the studio tree
  const tree = generateStudioTree(appRouter);

  console.log(tree.children[0]?.children);

  // if the id is root then return the root and its children
  if (id === "root") {
    const root = tree;
    const children = root.children;
    const dto: StudioDTO = {
      children: children.map((child) => ({
        children: [],
        parentId: child.parent ? child.parent.id : null,
        key: child.key,
        isMutation: child.isMutation,
        isQuery: child.isQuery,
        id: child.id,
      })),
      parentId: root.parent ? root.parent.id : null,
      key: root.key,
      isMutation: root.isMutation,
      isQuery: root.isQuery,
      id: root.id,
    };
    return res.status(200).json(dto);
  } else {
    // if the id is not root then find the node with the id
    const findNode = (node: StudioTree, id: string): StudioTree | null => {
      if (node.id === id) return node;
      for (const child of node.children) {
        const found = findNode(child, id);
        if (found) return found;
      }
      return null;
    };

    // find the node
    const node = findNode(tree, id as string);

    // if the node is not found then return 404
    if (!node) return res.status(404).json({ message: "Not found" });

    // if the node is found then return the node and its children
    const dto: StudioDTO = {
      children: node.children.map((child) => ({
        children: [],
        parentId: child.parent ? child.parent.id : null,
        key: child.key,
        isMutation: child.isMutation,
        isQuery: child.isQuery,
        id: child.id,
      })),
      parentId: node.parent ? node.parent.id : null,
      key: node.key,
      isMutation: node.isMutation,
      isQuery: node.isQuery,
      id: node.id,
    };

    return res.status(200).json(dto);
  }
  res.status(200).json({ name: "John Doe" });
};
