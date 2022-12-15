import { fromZodSchema } from "@onetyped/zod";
import { randomUUID } from "crypto";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { exampleRouter } from "./example";

export const appRouter = router({
  example: exampleRouter,
  demo: router({
    hello: publicProcedure.query(async ({ ctx }) => {
      return "hello";
    }),
    goodbye: publicProcedure.query(async () => {
      return "goodbye";
    }),
    mutationTest: publicProcedure.mutation(async () => {
      return "mutationTest";
    }),
    inputTest: publicProcedure
      .input(
        z.object({
          name: z.string(),
          details: z.number(),
          sub: z.object({
            name: z.string(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return input;
      }),
  }),
  live: router({
    hello: publicProcedure.query(async ({ ctx }) => {
      return "hello live";
    }),
    nested: router({
      hello: publicProcedure.query(async ({ ctx }) => {
        return "hello nested";
      }),
    }),
  }),
});

// test out one typed
console.log(fromZodSchema(appRouter.demo.inputTest._def.inputs[0] as any));
console.log(
  Object.keys(fromZodSchema(appRouter.demo.inputTest._def.inputs[0] as any))
);

// export type definition of API
export type AppRouter = typeof appRouter;

// console.log(appRouter.demo.inputTest._def.inputs[0]._def.shape());

export type StudioTree = {
  children: StudioTree[];
  parent: StudioTree | null;
  key: string;
  isMutation: boolean;
  isQuery: boolean;
  id: string;
  input: any;
};

// TODO: this is not great, but it works for now, need to add this to the generateStudioTree function
export const generateIds = (tree: StudioTree) => {
  tree.id = tree.key;
  let parent = tree.parent;
  while (parent) {
    tree.id = `${parent.key}.${tree.id}`;
    parent = parent.parent;
  }

  for (const child of tree.children) {
    generateIds(child);
  }
};

export const generateStudioTree = (router: Object | Function): StudioTree => {
  const root: StudioTree = {
    id: "root",
    children: [],
    parent: null,
    key: "root",
    isMutation: false,
    isQuery: false,
    input: {},
  };

  const keys = Object.keys(router) as (keyof typeof router)[];

  // these are the blacklisted keys
  const blacklist = ["_def", "createCaller", "getErrorShape", "meta"];

  // fill in the tree
  if (typeof router === "function") {
    // LEAF NODE
    root.isMutation = (router as any)._def.mutation === true;
    root.isQuery = (router as any)._def.query === true;

    // get the inputs
    const inputs = (router as any)._def.inputs;
    if (inputs && inputs.length > 0) {
      console.log(fromZodSchema(inputs[0]));
      root.input = fromZodSchema(inputs[0]);
    }
    root.id = randomUUID();
  } else {
    // INTERMEDIATE NODE
    for (const key of keys) {
      // skip blacklisted keys
      if (blacklist.includes(key)) continue;

      // get the id
      let nodeId = key as string;

      // create a new node
      const node = generateStudioTree(router[key]);

      // set the key
      node.key = key;

      // set the id
      node.id = nodeId;

      // set the parent
      node.parent = root;

      // add the node to the children
      root.children.push(node);
    }
  }

  return root;
};
