import React, { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { UploadSimple, Sparkle, X, ArrowRight, FileXls, Table, ChatCircleDots } from "@phosphor-icons/react";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const sheets = {};
        wb.SheetNames.forEach((name) => {
          const ws = wb.Sheets[name];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          sheets[name] = data;
        });
        resolve({ sheetNames: wb.SheetNames, sheets });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function buildContext(sheetData, sheetName, maxRows = 60) {
  if (!sheetData || sheetData.length === 0) return "";
  const headers = sheetData[0];
  const rows = sheetData.slice(1, maxRows + 1);
  const totalRows = sheetData.length - 1;
  let ctx = `Sheet: "${sheetName}" | ${headers.length} columns | ${totalRows} rows total\n\n`;
  ctx += "COLUMNS: " + headers.join(" | ") + "\n\n";
  ctx += "DATA (first " + Math.min(rows.length, maxRows) + " rows):\n";
  rows.forEach((row, i) => {
    ctx += `Row ${i + 1}: ` + row.join(" | ") + "\n";
  });
  return ctx;
}

// ─── SPREADSHEET TABLE ────────────────────────────────────────────────────────

function SpreadsheetTable({ data }) {
  const [colWidths] = useState({});
  if (!data || data.length === 0) return (
    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No data in this sheet.</div>
  );

  const headers = data[0] || [];
  const rows = data.slice(1);
  const cols = ["", ...headers.map((_, i) => String.fromCharCode(65 + i))];

  return (
    <div className="flex-1 overflow-auto border border-[#bfbfbf]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: "12px" }}>
      <table className="border-collapse" style={{ minWidth: "100%" }}>
        <thead>
          <tr>
            {cols.map((c, ci) => (
              <th key={ci} className={`border border-[#d0d0d0] px-3 py-1.5 text-center font-semibold whitespace-nowrap sticky top-0 z-10 ${ci === 0 ? "w-10 bg-[#f0efee] text-[#5a5a5a]" : "bg-[#dce6f1] text-[#1f3864] min-w-[90px]"}`}>
                {c || ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Header row (row 1 — column names) */}
          <tr>
            <td className="border border-[#d0d0d0] bg-[#d6e8d6] text-center text-[#1a5e38] font-bold px-2 py-1 sticky left-0">1</td>
            {headers.map((h, ci) => (
              <td key={ci} className="border border-[#bfc9d6] bg-[#dce6f1] px-3 py-1.5 font-bold text-[#1f3864] whitespace-nowrap">
                {String(h)}
              </td>
            ))}
          </tr>
          {/* Data rows */}
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-[#f9f9ff]"}>
              <td className="border border-[#d0d0d0] bg-[#f0efee] text-center text-[#5a5a5a] px-2 py-1 sticky left-0 font-medium">{ri + 2}</td>
              {headers.map((_, ci) => (
                <td key={ci} className="border border-[#e0e0e0] px-3 py-1.5 text-[#252423] whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                  {String(row[ci] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ExcelAnalyzer() {
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const fileRef = useRef(null);
  const chatEndRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      toast.error("Please upload an .xlsx, .xls, or .csv file");
      return;
    }
    setParsing(true);
    try {
      const wb = await parseFile(f);
      setFile(f);
      setWorkbook(wb);
      setActiveSheet(wb.sheetNames[0]);
      setMessages([{
        role: "assistant",
        text: `✅ **${f.name}** loaded — ${wb.sheetNames.length} sheet(s), ${wb.sheets[wb.sheetNames[0]].length - 1} rows in "${wb.sheetNames[0]}". Ask me anything about your data!`,
      }]);
    } catch {
      toast.error("Could not read file. Make sure it's a valid Excel or CSV.");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const sendMessage = async () => {
    if (!input.trim() || aiLoading || !workbook) return;
    const q = input.trim();
    setInput("");
    const userMsg = { role: "user", text: q };
    setMessages(prev => [...prev, userMsg]);
    setAiLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    const sheetData = workbook.sheets[activeSheet] || [];
    const context = buildContext(sheetData, activeSheet);

    try {
      const { data } = await api.post("/excel/analyze", {
        question: q,
        context,
      });

      const reply = data.reply || "I couldn't analyze that. Try rephrasing.";
      setMessages(prev => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Error connecting to AI. Please try again." }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  const reset = () => {
    setFile(null);
    setWorkbook(null);
    setActiveSheet(null);
    setMessages([]);
    setInput("");
  };

  const currentData = workbook?.sheets[activeSheet] || [];
  const rowCount = currentData.length > 0 ? currentData.length - 1 : 0;
  const colCount = currentData[0]?.length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 dark:text-white">
      <Header />

      <main className="flex-1 flex flex-col max-w-[1400px] w-full mx-auto px-4 lg:px-8 py-6 gap-4">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold tracking-[0.2em] text-[#002FA7] mb-1">EXCEL ANALYZER</div>
            <h1 className="text-2xl font-extrabold tracking-tight dark:text-white">Upload & Analyze Your Spreadsheet</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload any Excel or CSV file — view your data and ask AI questions about it</p>
          </div>
          {file && (
            <button onClick={reset} className="flex items-center gap-2 border border-foreground/20 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X size={14} /> Upload new file
            </button>
          )}
        </div>

        {/* Upload zone */}
        {!file && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-none cursor-pointer transition-all flex flex-col items-center justify-center py-20 px-6 text-center ${dragging ? "border-[#002FA7] bg-[#002FA7]/5" : "border-foreground/20 hover:border-[#002FA7]/40 hover:bg-slate-100/50 dark:hover:bg-slate-900/50"}`}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#002FA7] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Reading your file…</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#002FA7]/10 dark:bg-[#002FA7]/20 flex items-center justify-center mb-5">
                  <FileXls size={36} className="text-[#002FA7]" weight="fill" />
                </div>
                <p className="text-lg font-extrabold text-slate-800 dark:text-white mb-1">
                  {dragging ? "Drop it here!" : "Drop your Excel file here"}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">or click to browse · supports .xlsx, .xls, .csv</p>
                <button className="bg-[#002FA7] text-white px-6 py-2.5 text-sm font-bold hover:bg-[#002FA7]/90 transition-colors flex items-center gap-2">
                  <UploadSimple size={16} weight="bold" /> Choose file
                </button>
                <p className="text-xs text-slate-400 mt-4">Your file is processed locally — nothing is stored on our servers</p>
              </>
            )}
          </div>
        )}

        {/* Main workspace */}
        {file && workbook && (
          <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 240px)" }}>

            {/* Left: Spreadsheet viewer */}
            <div className="flex flex-col flex-1 min-w-0 border border-foreground/10 bg-white dark:bg-slate-900 overflow-hidden">

              {/* Excel title bar */}
              <div className="bg-[#217346] px-4 py-2 flex items-center gap-3">
                <FileXls size={16} className="text-white" weight="fill" />
                <span className="text-white text-xs font-semibold truncate">{file.name}</span>
                <div className="ml-auto flex items-center gap-3 text-white/70 text-[11px]">
                  <span className="flex items-center gap-1"><Table size={11} /> {rowCount} rows × {colCount} cols</span>
                </div>
              </div>

              {/* Sheet tabs */}
              {workbook.sheetNames.length > 1 && (
                <div className="flex border-b border-foreground/10 bg-slate-50 dark:bg-slate-800 overflow-x-auto">
                  {workbook.sheetNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => setActiveSheet(name)}
                      className={`px-4 py-2 text-xs font-semibold border-r border-foreground/10 whitespace-nowrap transition-colors ${activeSheet === name ? "bg-white dark:bg-slate-900 text-[#217346] border-b-2 border-b-[#217346]" : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700"}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {/* Table */}
              <SpreadsheetTable data={currentData} />

              {/* Status bar */}
              <div className="bg-[#217346] px-4 py-1 text-[10px] text-white/70 flex items-center gap-4">
                <span>Sheet: {activeSheet}</span>
                <span>·</span>
                <span>{rowCount} rows</span>
                <span>·</span>
                <span>{colCount} columns</span>
                {rowCount > 60 && <span className="text-yellow-300">· AI analyzes first 60 rows</span>}
              </div>
            </div>

            {/* Right: AI Chat */}
            <div className="flex flex-col w-full lg:w-[380px] shrink-0 border border-foreground/10 bg-white dark:bg-slate-900">

              {/* Chat header */}
              <div className="border-b border-foreground/10 px-4 py-3 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                <ChatCircleDots size={16} className="text-[#002FA7]" weight="fill" />
                <span className="text-sm font-bold dark:text-white">Ask AI about your data</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-6 h-6 bg-[#002FA7] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Sparkle size={12} className="text-white" weight="fill" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2.5 text-sm leading-6 ${m.role === "user" ? "bg-[#002FA7] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"}`}
                      style={{ whiteSpace: "pre-wrap" }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 bg-[#002FA7] flex items-center justify-center shrink-0 mr-2">
                      <Sparkle size={12} className="text-white" weight="fill" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex gap-1 items-center">
                      {[0,1,2].map(i => <span key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick prompts */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                  {[
                    "Summarize this data",
                    "Find duplicate rows",
                    "What are the totals?",
                    "Which row has max value?",
                    "Suggest a formula",
                  ].map(q => (
                    <button key={q} onClick={() => { setInput(q); }}
                      className="text-[10px] font-semibold px-2.5 py-1 border border-[#002FA7]/30 text-[#002FA7] hover:bg-[#002FA7]/5 transition-colors dark:text-blue-300 dark:border-blue-700">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="border-t border-foreground/10 p-3 flex gap-2">
                <input
                  className="flex-1 border border-foreground/20 bg-white dark:bg-slate-800 dark:text-white px-3 py-2 text-sm outline-none focus:border-[#002FA7] transition-colors"
                  placeholder="Ask anything about your data…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(); }}
                  disabled={aiLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={aiLoading || !input.trim()}
                  className="bg-[#002FA7] text-white px-3 py-2 hover:bg-[#002FA7]/90 disabled:opacity-40 transition-colors"
                >
                  <ArrowRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
