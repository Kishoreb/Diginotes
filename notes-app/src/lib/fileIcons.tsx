import {
  File,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image,
  Palette,
  Presentation,
} from "lucide-react";
import { ComponentType } from "react";

type IconComponent = ComponentType<{ size?: number; className?: string }>;

const EXTENSION_ICONS: Record<string, { icon: IconComponent; className: string }> = {
  ".md": { icon: FileText, className: "text-blue-500" },
  ".txt": { icon: FileText, className: "text-gray-500" },
  ".log": { icon: FileText, className: "text-gray-500" },
  ".tldr": { icon: Palette, className: "text-purple-500" },
  ".png": { icon: Image, className: "text-emerald-500" },
  ".jpg": { icon: Image, className: "text-emerald-500" },
  ".jpeg": { icon: Image, className: "text-emerald-500" },
  ".gif": { icon: Image, className: "text-emerald-500" },
  ".bmp": { icon: Image, className: "text-emerald-500" },
  ".svg": { icon: Image, className: "text-emerald-500" },
  ".pdf": { icon: FileText, className: "text-red-500" },
  ".doc": { icon: FileText, className: "text-blue-600" },
  ".docx": { icon: FileText, className: "text-blue-600" },
  ".xls": { icon: FileSpreadsheet, className: "text-green-600" },
  ".xlsx": { icon: FileSpreadsheet, className: "text-green-600" },
  ".csv": { icon: FileSpreadsheet, className: "text-green-600" },
  ".ppt": { icon: Presentation, className: "text-orange-500" },
  ".pptx": { icon: Presentation, className: "text-orange-500" },
  ".zip": { icon: FileArchive, className: "text-amber-600" },
  ".rar": { icon: FileArchive, className: "text-amber-600" },
  ".7z": { icon: FileArchive, className: "text-amber-600" },
  ".json": { icon: FileCode, className: "text-yellow-600" },
  ".js": { icon: FileCode, className: "text-yellow-600" },
  ".ts": { icon: FileCode, className: "text-blue-500" },
  ".tsx": { icon: FileCode, className: "text-blue-500" },
  ".html": { icon: FileCode, className: "text-orange-600" },
  ".css": { icon: FileCode, className: "text-sky-500" },
};

export function getFileIconInfo(fileName: string): { icon: IconComponent; className: string } {
  const extension = fileName.includes(".")
    ? "." + fileName.split(".").pop()!.toLowerCase()
    : "";
  return EXTENSION_ICONS[extension] || { icon: File, className: "text-gray-400" };
}

export function FileTypeIcon({ fileName, size = 16 }: { fileName: string; size?: number }) {
  const { icon: Icon, className } = getFileIconInfo(fileName);
  return <Icon size={size} className={className} />;
}
