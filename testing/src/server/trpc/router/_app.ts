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
      .input(z.string())
      .mutation(async ({ input, ctx }) => {
        return input;
      }),
  }),
});

// export type definition of API
export type AppRouter = typeof appRouter;

// SUPER IMPORTANT THIS IS HOW YOU ACTUALLY CALL FUNCTIONS
// now I just need an app router on the client side...
console.log(Object.keys(appRouter["example"]["hello"]["_def"]));
// console.log(Object.keys(appRouter["demo"]));

// console.log(appRouter.demo.goodbye._def);
// console.log(typeof appRouter.demo);

// HOW TO TELL IF MUTATION
// console.log(appRouter.demo.mutationTest);

// HOW TO GET INPUTS
// console.log(appRouter.demo.inputTest._def.inputs);

const caller = appRouter.createCaller({});

caller.demo.goodbye().then((res) => {
  console.log(res);
});

export type StudioTree = {
  children: StudioTree[];
  parent: StudioTree | null;
  key: string;
  isMutation: boolean;
  isQuery: boolean;
  id: string;
};

export const generateStudioTree = (router: Object | Function): StudioTree => {
  const root: StudioTree = {
    id: "root",
    children: [],
    parent: null,
    key: "root",
    isMutation: false,
    isQuery: false,
  };

  const keys = Object.keys(router) as (keyof typeof router)[];

  // these are the blacklisted keys
  const blacklist = ["_def", "createCaller", "getErrorShape", "meta"];

  // fill in the tree
  if (typeof router === "function") {
    // LEAF NODE
    root.isMutation = (router as any)._def.mutation === true;
    root.isQuery = (router as any)._def.query === true;
    root.id = randomUUID();
  } else {
    // INTERMEDIATE NODE
    for (const key of keys) {
      // skip blacklisted keys
      if (blacklist.includes(key)) continue;

      // create a new node
      const node = generateStudioTree(router[key]);

      // set the id
      node.id = root.id + "." + key;

      // set the parent
      node.parent = root;

      // set the key
      node.key = key;

      // add the node to the children
      root.children.push(node);
    }
  }

  return root;
};
