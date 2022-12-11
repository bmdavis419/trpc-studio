import { useQuery } from "@tanstack/react-query";
import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { trpcClient } from "../utils/trpc";
import { StudioDTO } from "./api/studio/[id]";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const Home: NextPage = () => {
  const [entry, setEntry] = useState("root");

  const [selectedProcedure, setSelectedProcedure] = useState<StudioDTO | null>(
    null
  );

  const entryData = useQuery(
    ["entry", entry],
    () => {
      return fetcher(
        `http://localhost:3000/api/studio/${entry}`
      ) as Promise<StudioDTO>;
    },
    {}
  );

  const runProcedure = async () => {
    if (!selectedProcedure) return;

    // split up the selected procedure id
    const parts = selectedProcedure.id.split(".");

    // remove the [0] entry
    parts.shift();

    let procedureObject = trpcClient;
    for (const part of parts) {
      // TODO: remove this ts-ignore
      // @ts-ignore
      procedureObject = procedureObject[part];
    }

    if (selectedProcedure.isMutation) {
      (procedureObject as any).mutate().then((res: any) => {
        console.log(res);
      });
    } else {
      (procedureObject as any).query().then((res: any) => {
        console.log(res);
      });
    }
  };

  if (entryData.isLoading || !entryData.data) return <div>Loading...</div>;

  if (entryData.isError) return <div>Error</div>;

  return (
    <>
      <Head>
        <title>TRPC Studio First Test</title>
        <meta
          name="description"
          content="An Apollo Studio like interface for TRPC"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen overflow-hidden bg-black text-white">
        <div className="mb-4 border-b-4 border-white px-4 py-2">
          <h2 className="text-4xl font-bold">TRPC Studio (UNOFFICIAL)</h2>
        </div>

        <div className="grid h-full w-full grid-cols-3 gap-10 px-24">
          <div className="h-4/5 rounded-md bg-secondary px-4 py-2">
            <div className="flex flex-row items-center justify-between border-b-2 border-gray-200 py-2">
              <h2 className="text-2xl font-light">Select Procedure</h2>
            </div>
            <div className="flex flex-col justify-center py-2">
              <button
                className="text-gray-500 hover:underline"
                onClick={() => {
                  if (entryData.data.parentId) {
                    setEntry(entryData.data.parentId);
                  }
                }}
              >
                Parent
              </button>
            </div>

            <div className="flex flex-col justify-center py-2">
              {entryData.data.children.map((child) => {
                return (
                  <button
                    key={child.id}
                    className="mx-8 my-2 flex justify-between overflow-hidden rounded-md px-2 py-3 text-xl ring-primary hover:bg-gray-900"
                    onClick={() => {
                      if (child.isMutation || child.isQuery) {
                        setSelectedProcedure(child);
                      } else {
                        setEntry(child.id);
                      }
                    }}
                  >
                    <span>{child.key}</span>
                    <span className="w-1/2 rounded-lg bg-primary text-center">
                      {child.isQuery
                        ? "QUERY"
                        : child.isMutation
                        ? "MUTATION"
                        : "ROUTER"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="h-4/5 rounded-md bg-secondary px-4 py-2">
            <div className="flex flex-row items-center justify-between border-b-2 border-gray-200 py-2">
              <h2 className="text-2xl font-light">Procedure Operation</h2>
              <button
                className="rounded-sm bg-primary px-4 py-2 font-bold hover:bg-blue-700"
                onClick={runProcedure}
              >
                RUN {"->"}
              </button>
            </div>
            {/* TODO: add inputs */}
          </div>
          <div className="h-4/5 rounded-md bg-secondary px-4 py-2">
            <div className="flex flex-row items-center justify-between border-b-2 border-gray-200 py-2">
              <h2 className="text-2xl font-light">Procedure Response</h2>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;