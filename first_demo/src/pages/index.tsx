import { useQuery } from "@tanstack/react-query";
import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { trpcClient } from "../utils/trpc";
import { StudioDTO } from "./api/studio/[id]";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const GetInput: React.FC<{
  input: any;
  name: string | null;
  inputData: { key: string; value: any }[];
  setData: Function;
  path: string;
  changeCounter: number;
}> = ({ input, name, inputData, setData, path, changeCounter }) => {
  const [output, setOutput] = useState(<div></div>);
  // check the type of the input
  const [localState, setLocalState] = useState<any>(null);

  const hasInit = useRef(false);

  const internalChangeCounter = useRef(0);

  useEffect(() => {
    if (input && "typeName" in input) {
      // check the input type
      switch (input.typeName) {
        case "string":
          setLocalState("");
          // add entry to data
          if (
            changeCounter !== internalChangeCounter.current ||
            (!inputData.find((d) => d.key === path) && !hasInit.current)
          ) {
            if (path === "root") {
              setData("");
            }
            setData((prev: any) => [...prev, { key: path, value: "" }]);
            hasInit.current = true;
            internalChangeCounter.current = changeCounter;
          }
          setOutput(
            <input
              type={"string"}
              placeholder={name || "input"}
              value={localState}
              onChange={(e) => {
                // update the data
                setData((prev: { key: string; value: any }[]) => {
                  const newData = prev.map((d) => {
                    if (d.key === path) {
                      return { key: path, value: e.target.value };
                    }
                    return d;
                  });
                  return newData;
                });
                setLocalState(e.target.value);
              }}
            />
          );
          break;
        case "number":
          setOutput(<input type={"number"} placeholder={name || "input"} />);
          break;
        case "object":
          // get array of children
          const children = [];
          const keys = Object.keys(input.shape);
          for (const key of keys) {
            children.push(
              <GetInput
                input={input.shape[key]}
                name={key}
                inputData={inputData}
                setData={setData}
                path={path + "." + key}
                changeCounter={changeCounter}
              />
            );
          }
          setOutput(
            <div>
              {children.map((child, idx) => {
                return (
                  <div key={idx} className="mb-2">
                    {child}
                  </div>
                );
              })}
            </div>
          );
          break;
      }
    } else {
      setOutput(<div></div>);
    }
  }, [input]);
  return output;
};

const Home: NextPage = () => {
  const [entry, setEntry] = useState("root");

  const [selectedProcedure, setSelectedProcedure] = useState<StudioDTO | null>(
    null
  );

  const [responseData, setResponseData] = useState<string | null>(null);

  const entryData = useQuery(
    ["entry", entry],
    () => {
      return fetcher(
        `http://localhost:3000/api/studio/${entry}`
      ) as Promise<StudioDTO>;
    },
    {}
  );

  const [inputData, setInputData] = useState<{ key: string; value: any }[]>([]);

  // counter to trigger a reset of the input data within nested components
  // either genius or stupid idk
  const [changeCounter, setChangeCounter] = useState(0);

  // reset input data when the selected procedure changes
  useEffect(() => {
    setInputData([]);
    setChangeCounter((prev) => prev + 1);
  }, [selectedProcedure]);

  useEffect(() => {
    // console.log(generateInputObject(inputData));
    console.log(inputData);
  }, [inputData]);

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
        setResponseData(JSON.stringify(res));
      });
    } else {
      (procedureObject as any).query().then((res: any) => {
        setResponseData(JSON.stringify(res));
      });
    }
  };

  const generateInputObject = (input: { key: string; value: any }[]): any => {
    const output: any = {};
    for (const entry of input) {
      const parts = entry.key.split(".");
      parts.shift();
      let current = output;
      for (const part of parts) {
        if (part === parts[parts.length - 1]) {
          current[part] = entry.value;
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }
    }
    return output;
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
                    className={`mx-8 my-2 flex justify-between overflow-hidden rounded-md px-2 py-3 text-xl ring-primary hover:bg-gray-900 ${
                      selectedProcedure?.id === child.id ? "ring-2" : ""
                    }`}
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
            <div className="text-black">
              <GetInput
                input={selectedProcedure?.input}
                name={"root"}
                inputData={inputData}
                setData={setInputData}
                path={"root"}
                changeCounter={changeCounter}
              />
            </div>
          </div>
          <div className="h-4/5 rounded-md bg-secondary px-4 py-2">
            <div className="flex flex-row items-center justify-between border-b-2 border-gray-200 py-2">
              <h2 className="text-2xl font-light">Procedure Response</h2>
            </div>
            <div>
              <pre>{responseData}</pre>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
