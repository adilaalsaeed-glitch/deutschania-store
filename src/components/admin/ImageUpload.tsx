"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

export function ImageUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { t } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      setError(t.admin.uploadFailed);
      return;
    }
    const data = await res.json();
    onChange(data.url);
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void handleFile(file);
  }

  return (
    <div className="field">
      <label>{t.admin.image}</label>
      {value ? (
        <div className="admin-image-preview">
          <img src={value} alt="" />
          <div className="admin-image-actions">
            <label className="btn btn-ghost-outline">
              {uploading ? t.admin.uploading : t.admin.changeImage}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={onFileInput} />
            </label>
            <button type="button" className="btn btn-ghost-outline" onClick={() => onChange(null)}>
              {t.admin.removeImage}
            </button>
          </div>
        </div>
      ) : (
        <label className="btn btn-ghost-outline admin-upload-btn">
          {uploading ? t.admin.uploading : t.admin.uploadImage}
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={onFileInput} />
        </label>
      )}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
