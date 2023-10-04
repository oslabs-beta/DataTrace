'use client';

import Head from 'next/head';
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import styles from '@/styles/Home.module.css';

import Sidebar from './_Sidebar';
import Timeline from './_Timeline';
import EndpointsTable from './_EndpointsTable';

import { DataType } from '../types';

export default function Home() {
  // Time is determined by the difference between the final index's start+duration minus the initial index's start
  const initialStartTimeRef: React.MutableRefObject<null | number> = useRef(null);
  const [data, setData] = useState<DataType[]>([]);

  // Clears EndpointsTable and Timeline when "Reset" button is clicked
  const clearTraces: () => void = async () => {
    setData([]);
    initialStartTimeRef.current = null;
  };

  // Append stream of OTEL spans to data state
  const socketInitializer = async () => {
    const exporterPort = 4000;
    const socket = await io(`http://localhost:${exporterPort}/`);

    socket.on('connect', () => {
      console.log(`Socket listening on port ${exporterPort}.`);
    });

    socket.on('message', (msg) => {
      const serverTraces: DataType[] = JSON.parse(msg);
      serverTraces.forEach((el: DataType) => {
        const newEl = { ...el };
        if (initialStartTimeRef.current === null) {
          initialStartTimeRef.current = el.startTime;
        }
        if (el.contentLength === null) newEl.contentLength = 1;
        newEl.startTime -= initialStartTimeRef.current;
        setData((prev: DataType[]) => [...prev, newEl]);
      });
    });
  };

  useEffect(() => {
    socketInitializer();
  }, []);

  return (
    <>
      <Head>
        <title>NetPulse Dashboard</title>
        <meta name="description" content="DataTrace Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <Sidebar clearTraces={clearTraces} />
        <div className={styles.networkContainer}>
          <Timeline data={data} />
          <EndpointsTable data={data} />
        </div>
      </main>
    </>
  );
}
