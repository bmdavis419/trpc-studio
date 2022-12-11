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
console.log(Object.keys(appRouter["demo"]["mutationTest"]));

// HOW TO TELL IF MUTATION
console.log(appRouter.demo.mutationTest._def);

// HOW TO GET INPUTS
console.log(appRouter.demo.inputTest._def.inputs);

const caller = appRouter.createCaller({});

caller.demo.goodbye().then((res) => {
  console.log(res);
});
