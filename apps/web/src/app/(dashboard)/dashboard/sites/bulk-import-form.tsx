'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Download, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { sitesApi } from '@/lib/api';

interface ParsedSite {
  name: string;
  url: string;
  username: string;
  appPassword: string;
  error?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ name?: string; url?: string; error: string }>;
}

interface BulkImportFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BATCH_SIZE = 50;
const EXPECTED_HEADERS = ['name', 'url', 'username', 'apppassword'];

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function isHeaderRow(fields: string[]): boolean {
  const normalized = fields.map((f) => f.toLowerCase().replace(/[^a-z]/g, ''));
  return EXPECTED_HEADERS.every((h) => normalized.includes(h));
}

function validateSite(site: ParsedSite, index: number): string | undefined {
  if (!site.name) return 'ชื่อเว็บไซต์ห้ามว่าง';
  if (!site.url) return 'URL ห้ามว่าง';
  if (!site.username) return 'Username ห้ามว่าง';
  if (!site.appPassword) return 'App Password ห้ามว่าง';
  try {
    new URL(site.url);
  } catch {
    return 'URL ไม่ถูกต้อง';
  }
  return undefined;
}

function parseText(text: string): ParsedSite[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstFields = parseCSVLine(lines[0]);
  const startIndex = isHeaderRow(firstFields) ? 1 : 0;

  return lines.slice(startIndex).map((line, i) => {
    const fields = parseCSVLine(line);
    const site: ParsedSite = {
      name: fields[0] || '',
      url: fields[1] || '',
      username: fields[2] || '',
      appPassword: fields[3] || '',
    };
    site.error = validateSite(site, i);
    return site;
  });
}

function downloadTemplate() {
  const csv = 'name,url,username,appPassword\nบล็อกสุขภาพ,https://health-blog.com,admin,xxxx xxxx xxxx xxxx';
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sites-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function BulkImportForm({ onSuccess, onCancel }: BulkImportFormProps) {
  const [activeTab, setActiveTab] = useState<'csv' | 'text'>('csv');
  const [parsedSites, setParsedSites] = useState<ParsedSite[]>([]);
  const [textValue, setTextValue] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validSites = parsedSites.filter((s) => !s.error);
  const invalidSites = parsedSites.filter((s) => s.error);

  const handleFileRead = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setParsedSites(parseText(text));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
        handleFileRead(file);
      } else {
        toast.error('กรุณาอัปโหลดไฟล์ .csv เท่านั้น');
      }
    },
    [handleFileRead]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleTextChange = (text: string) => {
    setTextValue(text);
    if (text.trim()) {
      setParsedSites(parseText(text));
    } else {
      setParsedSites([]);
    }
  };

  const handleImport = async () => {
    if (validSites.length === 0) return;

    setIsImporting(true);
    setProgress({ current: 0, total: validSites.length });

    const allResults: ImportResult = { success: 0, failed: 0, errors: [] };
    const batches = [];
    for (let i = 0; i < validSites.length; i += BATCH_SIZE) {
      batches.push(validSites.slice(i, i + BATCH_SIZE));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const res = await sitesApi.bulkImport(
          batch.map(({ error, ...site }) => site)
        );
        const data = res.data;
        allResults.success += data.success || 0;
        allResults.failed += data.failed || 0;
        if (data.errors?.length) {
          allResults.errors.push(...data.errors);
        }
      } catch (err: any) {
        allResults.failed += batch.length;
        allResults.errors.push(
          ...batch.map((s) => ({
            name: s.name,
            url: s.url,
            error: err.response?.data?.error || 'เกิดข้อผิดพลาด',
          }))
        );
      }
      setProgress({
        current: Math.min((i + 1) * BATCH_SIZE, validSites.length),
        total: validSites.length,
      });
    }

    setResult(allResults);
    setIsImporting(false);

    if (allResults.success > 0) {
      toast.success(`นำเข้าสำเร็จ ${allResults.success} เว็บไซต์`);
    }
    if (allResults.failed > 0) {
      toast.error(`ล้มเหลว ${allResults.failed} เว็บไซต์`);
    }
  };

  // Result screen
  if (result) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          {result.success > 0 ? (
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
          ) : (
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">ผลการนำเข้า</h3>
          <div className="mt-2 flex justify-center gap-6 text-sm">
            <span className="text-green-600 font-medium">
              สำเร็จ: {result.success}
            </span>
            <span className="text-red-600 font-medium">
              ล้มเหลว: {result.failed}
            </span>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50">
            <table className="w-full text-sm">
              <thead className="bg-red-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-red-800">เว็บไซต์</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-red-800">ข้อผิดพลาด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {result.errors.map((err, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-red-700">{err.name || err.url || `#${i + 1}`}</td>
                    <td className="px-3 py-2 text-red-600">{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onSuccess}>เสร็จสิ้น</Button>
        </div>
      </div>
    );
  }

  // Importing screen
  if (isImporting) {
    return (
      <div className="py-12 text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-700 font-medium">กำลังนำเข้าเว็บไซต์...</p>
        <div className="max-w-xs mx-auto">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{
                width: progress.total > 0
                  ? `${(progress.current / progress.total) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {progress.current} / {progress.total}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'csv'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('csv');
            setParsedSites([]);
            setTextValue('');
            setFileName('');
          }}
        >
          <Upload className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          อัปโหลด CSV
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'text'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('text');
            setParsedSites([]);
            setTextValue('');
            setFileName('');
          }}
        >
          <FileText className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
          วาง Text
        </button>
      </div>

      {/* CSV Upload Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-3">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {fileName ? (
              <p className="text-sm text-gray-700 font-medium">{fileName}</p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  ลากไฟล์ CSV มาวางที่นี่ หรือ <span className="text-blue-600 font-medium">เลือกไฟล์</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">รองรับไฟล์ .csv</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
            onClick={downloadTemplate}
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            ดาวน์โหลด Template CSV
          </button>
        </div>
      )}

      {/* Text Paste Tab */}
      {activeTab === 'text' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            วางข้อมูลทีละบรรทัด format: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">name,url,username,appPassword</code>
          </p>
          <textarea
            className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`name,url,username,appPassword\nบล็อกสุขภาพ,https://health-blog.com,admin,xxxx xxxx xxxx xxxx\nเว็บท่องเที่ยว,https://travel-site.com,editor,yyyy yyyy yyyy yyyy`}
            value={textValue}
            onChange={(e) => handleTextChange(e.target.value)}
          />
        </div>
      )}

      {/* Preview Table */}
      {parsedSites.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-700 font-medium">
              พบ {parsedSites.length} เว็บไซต์
            </span>
            {validSites.length > 0 && (
              <span className="text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5 inline -mt-0.5 mr-0.5" />
                {validSites.length} พร้อมนำเข้า
              </span>
            )}
            {invalidSites.length > 0 && (
              <span className="text-red-600">
                <AlertCircle className="h-3.5 w-3.5 inline -mt-0.5 mr-0.5" />
                {invalidSites.length} มีข้อผิดพลาด
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10">#</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">ชื่อ</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">URL</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Username</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Password</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-24">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedSites.map((site, i) => (
                  <tr
                    key={i}
                    className={site.error ? 'bg-red-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5 text-gray-900 truncate max-w-[120px]">{site.name || '-'}</td>
                    <td className="px-3 py-1.5 text-gray-600 truncate max-w-[160px]">{site.url || '-'}</td>
                    <td className="px-3 py-1.5 text-gray-600 truncate max-w-[80px]">{site.username || '-'}</td>
                    <td className="px-3 py-1.5 text-gray-400">{'•'.repeat(Math.min(site.appPassword.length, 8)) || '-'}</td>
                    <td className="px-3 py-1.5">
                      {site.error ? (
                        <span className="text-xs text-red-600">{site.error}</span>
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleImport}
          disabled={validSites.length === 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import {validSites.length > 0 ? `${validSites.length} เว็บไซต์` : ''}
        </Button>
      </div>
    </div>
  );
}
