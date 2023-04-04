"use client";
import Head from "next/head";
import { DataType } from "../types";
import Image from "next/image";
import Link from "next/link";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import React, { useCallback } from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import MaterialReactTable from "material-react-table"; // For resizing & auto sorting columns - Move to detail

// Type import
import type { MRT_ColumnDef, MRT_Virtualizer } from "material-react-table";

//Material-UI Imports
import { Box } from "@mui/material";
import { CellTower } from "@mui/icons-material";
import { Chart, ChartType, registerables } from "chart.js"; // import chart.js & react-chartjs components
import { Bar } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { io } from "socket.io-client";
Chart.register(...registerables); // register chart.js elements due to webpack tree-shaking, else error

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  // Hook for updating overall time and tying it to state
  // Time is determined by the difference between the final index's start+duration minus the initial index's start
  let initialStartTime: number;
  const [time, setTime] = useState(0);
  const [data, setData] = useState<DataType[]>([]);

  //intialize socket connection
  //when data recieved update state here
  const socketInitializer = useCallback(async () => {
    let socket = await io("http://localhost:4000/");
    socket.on("connect", () => {
      console.log("connected");
    });
    socket.on("message", (msg) => {
      // when data recieved concat messages state with inbound traces
      const serverTraces: DataType[] = JSON.parse(msg);
      serverTraces.forEach((el: DataType) => {
        // TODO: change the below to check for equal to 0 when we get rid of starter data
        if (initialStartTime === undefined) {
          initialStartTime = el.startTime;
          console.log("initial start time reset: ", initialStartTime);
        }
        if (el.packageSize === null) el.packageSize = 1;
        el.startTime -= initialStartTime;
        setData((data: DataType[]) => [...data, el]);
      });
    });
  }, [setData]);

  //when component mounts initialize socket
  useEffect(() => {
    socketInitializer();
  }, []);

  // an empty array that collects barData objects in the below for loop
  const barDataSet = [];

  // generates barData object for each sample data from data array with label being the endpoint
  // data takes in the exact start-time and total time
  for (let i = 0; i < data.length; i++) {
    barDataSet.push({
      label: [data[i]["endPoint"]],
      data: [
        {
          x: [data[i]["startTime"], data[i]["startTime"] + data[i]["duration"]],
          y: 1,
        },
      ],
      backgroundColor: ["green"],
      borderColor: ["limegreen"],
    });
  }

  // final data for Bar chartjs component
  const barData = {
    labels: ["trace1"],
    datasets: barDataSet,
  };

  // const barData = {
  //   labels: ['trace1', 'trace2', 'trace3'],
  //   datasets: barDataSet
  // }

  // Create columns -> later on, we can dynamically declare this based
  // on user options using a config file or object or state and only
  // rendering the things that are requested

  //Column declaration requires a flat array of objects with a header
  // which is the column's title, and an accessorKey, which is the
  // key in the data object.
  console.log("columns");
  const columns = useMemo<MRT_ColumnDef<DataType>[]>(
    () => [
      {
        header: "Start",
        accessorKey: "startTime",
      },
      {
        header: "TraceID",
        accessorKey: "traceId",
      },
      {
        header: "Duration",
        accessorKey: "duration",
      },
      {
        header: "Size",
        accessorKey: "packageSize",
      },
      {
        header: "Status",
        accessorKey: "statusCode",
      },
      {
        header: "Endpoint",
        accessorKey: "endPoint",
      },
      {
        header: "Request",
        accessorKey: "requestType",
      },
      {
        header: "Span ID",
        accessorKey: "spanId",
        enablePinning: true,
        minSize: 200, //min size enforced during resizing
        maxSize: 1000, //max size enforced during resizing
        size: 300, //medium column
        //custom conditional format and styling
        Cell: ({ cell, row }) => {
          return (
            <Box
              component="span"
              sx={(theme) => ({
                backgroundColor: "green",
                borderRadius: "0.2rem",
                color: "#fff",
                // Proof of concept for the displays - these still must be tied to state.  We first select the
                // cell, then determine the left and right portions and make it a percentage
                marginLeft: (() => {
                  console.log(Date.now(), "row org", row.original.spanId, row.original.startTime);
                  const cellStartTime = row.original["startTime"];
                  const totalTime = data.length
                    ? data[data.length - 1]["startTime"] + data[data.length - 1]["duration"]
                    : cellStartTime;
                  const pCellTotal = (cellStartTime / totalTime) * 100;
                  console.log("cst", cellStartTime, "tT", totalTime, "pCT", pCellTotal);
                  return `${pCellTotal}%`;
                })(),
                width: (() => {
                  const cellDuration = row.original["duration"];
                  const totalTime = data.length
                    ? data[data.length - 1]["startTime"] + data[data.length - 1]["duration"]
                    : cellDuration;
                  const pCellDuration = (cellDuration / totalTime) * 100;
                  return `${pCellDuration}%`;
                })(),
              })}
            >
              {/* below is the duration in seconds displayed as text in the waterfall bar */}
              {row.original["duration"] / 1000}
            </Box>
          );
        },
      },
    ],
    // WE ADDED DATA HERE, IF EVERYTHING IS BROKEN TRY DELETING THIS TO FIX IT?
    [data]
  );

  return (
    <>
      <Head>
        <title>DataTrace Dashboard</title>
        <meta name="description" content="DataTrace Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* REMEMBER TO CHANGE ICON AND FAVICON LTER */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className={styles.sidebar}>
          <Image
            src={"/Goblins.png"}
            className={styles.sbLogo}
            alt="DataTrace Logo"
            width="190"
            height="190"
          />
          <div className={styles.sbContent}>
            <button className={styles.splashButton}>SplashPage</button>
            <button className={styles.secondButton}>SecondButton</button>
            <button className={styles.thirdButton}>ThirdButton</button>
            <Link href="/datatrace-splash" className={styles.sbLinks}>
              DataTrace Splash Page
            </Link>
            <Link href="/about" className={styles.sbLinks}>
              About Us
            </Link>
            <Link href="/blog/hello-world" className={styles.sbLinks}>
              Blog Post
            </Link>
          </div>
        </div>
        <div className={styles.networkContainer}>
          <div className={styles.mainWaterfall}>
            {/* Bar component from react-chartjs with all options/plugins */}
            <Bar
              data={barData}
              // width={400}
              // height={200}
              options={{
                maintainAspectRatio: false,
                aspectRatio: 1,
                indexAxis: "y",
                borderSkipped: false,
                borderWidth: 1,
                barPercentage: 0.1,
                categoryPercentage: 1,
                scales: {
                  x: {
                    position: "top",
                    type: "time",
                    // stacked: true,
                    grid: {
                      // display: false,
                      // drawBorder: false,
                      drawTicks: false,
                    },
                    ticks: {
                      // autoSkip: true,
                      maxTicksLimit: 10,
                      callback: (value, index, values) => {
                        return `${value} ms`;
                      },
                    },
                  },
                  y: {
                    // beginAtZero: true,
                    stacked: true,
                    grid: {
                      display: false,
                      // drawBorder: false,
                      // drawTicks: false,
                    },
                    ticks: {
                      display: false,
                    },
                  },
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                },
              }}
            />
          </div>
          {/* Check if we can directly assign CSS to component names */}
          <div className={styles.detailList}>
            {/* Data is passed via data, column info passed via columns */}
            <MaterialReactTable
              columns={columns}
              data={data}
              defaultColumn={{
                minSize: 50, //allow columns to get smaller than default
                maxSize: 300, //allow columns to get larger than default
                size: 70, //make columns wider by default
              }}
              // enableRowSelection
              // enablePinning
              // initialState={{columnPinning:{right:['waterfall']}}}
              enablePagination={false}
              enableGlobalFilter={false}
              enableColumnResizing
              columnResizeMode="onEnd"
              layoutMode="grid"
              enableStickyHeader={true}

              // enableRowVirtualization
              // onSortingChange={setSorting}
              // state={{ isLoading, sorting }}
              // rowVirtualizerInstanceRef={rowVirtualizerInstanceRef} //optional
              // rowVirtualizerProps={{ overscan: 5 }} //optionally customize the row virtualizer
              // columnVirtualizerProps={{ overscan: 2 }}
              // muiTableHeadCellProps={{
              //   sx: {
              //     flex: '0 0 auto',
              //   },
              // }}
              // muiTableBodyCellProps={{
              //   sx: {
              //     flex: '0 0 auto',
              //   },
              // }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
