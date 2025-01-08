"use client";

import { EventData, ImportDataDB, ScheduleData } from "@/server/database";
import { useState } from "react";
import * as XLSX from "xlsx";

export default function ImportData() {
  const [data, setData] = useState<EventData[] | ScheduleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importType, setImportType] = useState<"event" | "schedule" | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "event" | "schedule"): void => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setImportType(type);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          if (file.name.endsWith(".csv")) {
            parseCSV(content, type);
          } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
            parseExcel(content, type);
          }
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const validateData = (parsedData: any[], type: "event" | "schedule"): boolean => {
    if (type === "event") {
      return parsedData.every(
        (item) =>
          "event" in item &&
          "stage" in item &&
          "group" in item &&
          "slot" in item &&
          "team" in item &&
          "email" in item
      );
    } else if (type === "schedule") {
      return parsedData.every(
        (item) =>
          "event" in item &&
          "stage" in item &&
          "group" in item &&
          "matchNo" in item &&
          "map" in item &&
          "startTime" in item &&
          "date" in item
      );
    }
    return false;
  };

  const parseCSV = (content: string, type: "event" | "schedule"): void => {
    try {
      const lines = content.split("\n");
      const headers = lines[0]?.split(",") || [];
      const parsedData = lines.slice(1).map((line) => {
        const values = line.split(",");
        return headers.reduce<Record<string, string | number>>((obj, header, index) => {
          obj[header.trim()] = values[index]?.trim();
          return obj;
        }, {});
      });

      if (parsedData.length > 0 && validateData(parsedData, type)) {
        setData(
          parsedData as (typeof type extends "event" ? EventData[] : ScheduleData[])
        );
      } else {
        setError(`Invalid ${type === "event" ? "Event Data" : "Schedule Data"} format`);
      }
    } catch (err) {
      setError("Failed to parse CSV file");
    } finally {
      setIsLoading(false);
    }
  };

  const parseExcel = (content: string, type: "event" | "schedule"): void => {
    try {
      const workbook = XLSX.read(content, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      if (parsedData.length > 0 && validateData(parsedData, type)) {
        setData(
          parsedData as (typeof type extends "event" ? EventData[] : ScheduleData[])
        );
      } else {
        setError(`Invalid ${type === "event" ? "Event Data" : "Schedule Data"} format`);
      }
    } catch (err) {
      setError("Failed to parse Excel file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportToDB = async (): Promise<void> => {
    try {
      setIsImporting(true);
      setIsLoading(true);

      await ImportDataDB(data, importType as "event" | "schedule");

    } catch (err: any) {
      setError(err.message || "An error occurred during import");
    } finally {
      setError(null);
      setIsImporting(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Import Data</h1>
      </div>
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <label className="block mb-2">Import Event Data:</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e, "event")}
            disabled={isLoading || isImporting}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
        <div>
          <label className="block mb-2">Import Schedule Data:</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => handleFileUpload(e, "schedule")}
            disabled={isLoading || isImporting}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
        </div>
      </div>
      <div>
        {data.length > 0 && (
          <button
            onClick={handleImportToDB}
            disabled={isImporting}
            className="py-2 px-4 bg-blue-500 text-white rounded disabled:bg-gray-300"
          >
            {isImporting ? "Importing..." : "Import to DB"}
          </button>
        )}
      </div>
      {error && <p className="text-red-500">{error}</p>}
      {isLoading && <p>Loading...</p>}
    </div>
  );
}
