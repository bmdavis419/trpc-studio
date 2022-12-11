import { type NextPage } from "next";

import { trpc, trpcClient } from "../utils/trpc";

const Home: NextPage = () => {
  const hello = trpc.example.hello.useQuery({ text: "from tRPC" });

  // get all the keys on trpc

  // IMPORTANT THIS HOLDS HOW I WILL GET DATA ON THE CLIENT!!!
  trpcClient["demo"]["goodbye"].query().then((res) => {
    console.log(res);
  });

  // EXAMPLE OF PULLING DATA WITH VARIABLE
  const testKey1 = "demo" as keyof typeof trpcClient;
  const trpcDemo = trpcClient[testKey1];

  const testKey2 = "goodbye" as keyof typeof trpcDemo;
  trpcDemo[testKey2].query().then((res) => {
    console.log("chained", res);
  });

  return <div className="bg-black text-green-500">hi</div>;
};

export default Home;
